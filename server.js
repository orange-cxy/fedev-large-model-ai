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

// 模拟的Deepseek API端点
app.post('/api/mock-deepseek', (req, res) => {
  try {
    // 读取chat目录中的所有JSON文件
    const files = fs.readdirSync(chatDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      // 如果没有历史记录，返回一个默认的模拟响应
      const defaultResponse = {
        id: 'mock-response-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '您好！这是来自模拟Deepseek API的响应。我可以帮助您解答各种问题。'
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
      
      return res.json(defaultResponse);
    }
    
    // 随机选择一个历史记录文件
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(chatDir, randomFile);
    
    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // 返回保存的响应数据
    const response = {
      id: data.response.id || 'mock-' + Date.now(),
      object: data.response.object || 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: data.response.model || 'deepseek-chat',
      choices: data.response.choices || [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: data.response.choices?.[0]?.message?.content || '这是一条从历史记录中检索的响应。'
          },
          finish_reason: data.response.choices?.[0]?.finish_reason || 'stop'
        }
      ],
      usage: data.response.usage || {
        prompt_tokens: 20,
        completion_tokens: 15,
        total_tokens: 35
      }
    };
    
    console.log(`返回模拟响应，使用文件: ${randomFile}`);
    res.json(response);
  } catch (error) {
    console.error('获取模拟响应失败:', error);
    res.status(500).json({
      error: '获取模拟响应失败',
      message: error.message
    });
  }
});

// 保存聊天记录的API端点
app.post('/api/save-chat', (req, res) => {
  try {
    // 生成唯一的文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}-response.json`;
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