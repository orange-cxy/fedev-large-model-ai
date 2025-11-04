import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
const app = express();
const PORT = 3001;

// 检查是否为mock模式
const isMockMode = process.env.NODE_ENV === 'mock';
console.log(`服务器启动，模式: ${isMockMode ? 'mock' : '真实'}`);

// 中间件
app.use(cors());
app.use(express.json());

// 确保chat目录存在（仅在非mock模式下创建）
// 在ES模块中，使用import.meta.url获取当前文件路径
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const chatDir = path.join(__dirname, 'chat');
if (!isMockMode && !fs.existsSync(chatDir)) {
  fs.mkdirSync(chatDir, { recursive: true });
}

// 通用模拟API函数
function createMockResponse(modelId, defaultMessage) {
  return {
    id: `mock-${modelId}-response-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: `${modelId}-chat`,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: defaultMessage
        },
        finish_reason: 'stop'
      }
    ],
    usage: {
      prompt_tokens: 15,
      completion_tokens: 20,
      total_tokens: 35
    }
  };
}

// 获取历史记录文件（按模型ID过滤）
function getModelHistoryFiles(modelId) {
  try {
    if (!fs.existsSync(chatDir)) {
      return [];
    }
    const allFiles = fs.readdirSync(chatDir).filter(file => file.endsWith('.json'));
    
    // 尝试按模型ID过滤文件
    if (modelId) {
      // 方法1: 根据文件名中的模型ID过滤
      const modelFiles = allFiles.filter(file => {
        console.log('file: ', file, file.fileName)
        return file.includes(`-${modelId}-`);
      });
      console.log("modelFiles: ", modelFiles.length, modelId)
      if (modelFiles.length > 0) {
        return modelFiles;
      }
      
      // 方法2: 读取文件内容检查model字段
      const contentFilteredFiles = [];
      for (const file of allFiles) {
        try {
          const filePath = path.join(chatDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          if (data.model === modelId) {
            contentFilteredFiles.push(file);
          }
        } catch (e) {
          console.log(`读取文件 ${file} 失败，跳过:`, e);
        }
      }
      
      if (contentFilteredFiles.length > 0) {
        return contentFilteredFiles;
      }
    }
    
    return allFiles; // 如果没有找到特定模型的文件，返回所有文件
  } catch (error) {
    console.error('获取历史记录文件失败:', error);
    return [];
  }
}

// 创建流式响应的块
function createStreamChunk(modelId, content, index = 0, isLast = false) {
  const chunk = {
    id: `mock-${modelId}-stream-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: `${modelId}-chat`,
    choices: [
      {
        index: index,
        delta: isLast ? {} : { content: content },
        finish_reason: isLast ? 'stop' : null
      }
    ]
  };
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// 处理流式响应
function handleStreamResponse(req, res, modelId, content) {
  // 设置响应头为事件流
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // 将内容拆分成多个块
  const words = content.split(' ');
  let currentChunk = '';
  let chunkIndex = 0;
  
  // 创建定时器，模拟流式数据传输
  const intervalId = setInterval(() => {
    if (words.length === 0) {
      // 发送最后一个块并结束流
      res.write(createStreamChunk(modelId, '', 0, true));
      res.end();
      clearInterval(intervalId);
      return;
    }
    
    // 添加1-3个词到当前块
    const wordsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, words.length);
    for (let i = 0; i < wordsToAdd; i++) {
      if (i > 0) currentChunk += ' ';
      currentChunk += words.shift();
    }
    
    // 添加标点符号的概率
    const punctuation = ['.', ',', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
    if (Math.random() > 0.7 && words.length > 0) {
      const randomPunc = punctuation[Math.floor(Math.random() * punctuation.length)];
      currentChunk += randomPunc;
    }
    
    // 发送当前块
    res.write(createStreamChunk(modelId, currentChunk));
    currentChunk = '';
    chunkIndex++;
    
  }, 100 + Math.random() * 200); // 随机延迟，模拟真实网络
  
  // 处理连接关闭
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
}

// 处理模拟请求的通用函数
function handleMockRequest(req, res, defaultMessage) {
  try {
    // 记录请求数据，用于调试
    console.log(`${req.body.modelId}模拟API收到请求:`, JSON.stringify(req.body, null, 2));
    
    // 尝试从请求中提取用户消息内容（适配不同的请求格式）
    let userMessage = '';
    if (req.body.messages && req.body.messages.length > 0) {
      const lastMessage = req.body.messages[req.body.messages.length - 1];
      if (lastMessage.role === 'user') {
        userMessage = lastMessage.content || '';
      }
    } else if (req.body.prompt) {
      userMessage = req.body.prompt;
    }
    
    // 检查是否为流式请求
    const isStream = req.body.stream === true;
    
    // 生成响应内容
    let responseContent = '';
    let useHistory = false;
    
    // 读取特定模型的历史记录文件
    const files = getModelHistoryFiles(req.body.modelId);
    
    if (files.length > 0) {
      // 随机选择一个历史记录文件
      const randomFile = files[Math.floor(Math.random() * files.length)];
      const filePath = path.join(chatDir, randomFile);
      
      try {
        // 读取文件内容并返回模拟响应
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // 提取响应内容
        if (data.response && data.response.choices && data.response.choices[0] && 
            data.response.choices[0].message && data.response.choices[0].message.content) {
          responseContent = data.response.choices[0].message.content;
          useHistory = true;
        }
      } catch (e) {
        console.log(`读取历史文件失败，使用默认响应:`, e);
        useHistory = false;
      }
    }
    
    // 如果没有历史记录或读取失败，生成默认响应
    if (!useHistory) {
      // 添加丰富的Markdown测试内容
      responseContent = `${defaultMessage}

# Markdown测试内容

## 这是二级标题
### 这是三级标题

您的请求: ${userMessage || 'Hello'}

这是一个**加粗文本**和*斜体文本*的示例。

## 列表测试

### 无序列表
- 项目一
- 项目二
- 项目三

### 有序列表
1. 第一步
2. 第二步
3. 第三步

## 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, Markdown!');
}
\`\`\`

## 引用

> 这是一段引用内容
> 可以有多行

## 链接和图片

[Markdown官方文档](https://www.markdownguide.org)

## 表格

| 名称 | 描述 | 值 |
|------|------|----|
| 特性1 | 测试特性 | 100 |
| 特性2 | 另一个测试 | 200 |

这是一个模拟的流式响应示例。在实际应用中，您将看到文本逐字显示，就像我现在正在为您生成回答一样。`;
    }
    
    console.log(`返回${req.body.modelId}${isStream ? '流式' : ''}模拟响应${useHistory ? '，使用历史文件' : '，使用默认内容'}`);
    
    if (isStream) {
      // 处理流式响应
      handleStreamResponse(req, res, req.body.modelId, responseContent);
    } else {
      // 处理普通响应
      const defaultResponse = createMockResponse(
        req.body.modelId, 
        responseContent
      );
      res.json(defaultResponse);
    }
  } catch (error) {
    console.error(`获取${req.body.modelId}模拟响应失败:`, error);
    
    // 如果是流式请求，先设置响应头
    if (req.body.stream === true) {
      res.writeHead(500, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(createStreamChunk(req.body.modelId || 'unknown', `错误: ${error.message}`));
      res.write(createStreamChunk(req.body.modelId || 'unknown', '', 0, true));
      res.end();
    } else {
      res.status(500).json({
        error: '获取模拟响应失败',
        message: error.message
      });
    }
  }
}

// 模拟的Deepseek API端点
app.post('/api/mock-api', (req, res) => {
  handleMockRequest(
    req, 
    res,
    '您好！这是来自模拟Deepseek API的响应。我可以帮助您解答各种问题。'
  );
});

// 保存聊天记录的API端点
app.post('/api/save-chat', (req, res) => {
  try {
    // 确保chat目录存在
    if (!fs.existsSync(chatDir)) {
      fs.mkdirSync(chatDir, { recursive: true });
    }
    
    // 生成唯一的文件名，包含模型ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelId = req.body.model || 'unknown';
    const fileName = `${timestamp}-${modelId}-response.json`;
    const filePath = path.join(chatDir, fileName);
    
    // 保存文件
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    
    res.status(200).json({
      success: true,
      message: `响应已保存到 ${filePath}`,
      fileName: fileName
    });
  } catch (error) {
    console.error('保存文件失败:', error);
    res.status(500).json({
      success: false,
      message: '保存文件失败',
      error: error.message
    });
  }
});

// 静态文件服务（可选，用于测试）
app.use(express.static(path.join(__dirname, 'dist')));

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});