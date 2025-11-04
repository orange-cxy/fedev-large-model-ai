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
    
    // 读取特定模型的历史记录文件
    const files = getModelHistoryFiles(req.body.modelId);
    
    if (files.length === 0) {
      // 如果没有历史记录，返回一个默认的模拟响应
      const defaultResponse = createMockResponse(
        req.body.modelId, 
        `${defaultMessage}\n\n您的请求: ${userMessage || 'Hello'}`
      );
      return res.json(defaultResponse);
    }
    
    // 随机选择一个历史记录文件
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(chatDir, randomFile);
    
    // 读取文件内容并返回模拟响应
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // 构建响应（确保使用特定模型的信息）
    const response = data.response;
    
    console.log(`返回${req.body.modelId}模拟响应，使用文件: ${randomFile}`);
    res.json(response);
  } catch (error) {
    console.error(`获取${req.body.modelId}模拟响应失败:`, error);
    res.status(500).json({
      error: '获取模拟响应失败',
      message: error.message
    });
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