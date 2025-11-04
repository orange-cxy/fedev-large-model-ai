import './style.css'

// 尝试导入模式配置（可能由启动脚本生成）
let modeConfig = null;
try {
  // 使用动态导入避免构建错误
  import('./mode-config.js').then(config => {
    modeConfig = config.default || config;
    console.log('导入的模式配置:', modeConfig);
  }).catch(error => {
    console.log('未找到模式配置文件，使用默认配置');
  });
} catch (e) {
  console.log('导入模式配置出错:', e);
}

// 创建Hello Deepseek内容
const app = document.getElementById('app');
app.innerHTML = `
  <div class="container">
    <h1>Hello Deepseek!</h1>
    <div class="mode-switcher">
      <button id="btn-mock" class="mode-btn active">Mock模式</button>
      <button id="btn-real" class="mode-btn">真实模式</button>
    </div>
    <div id="current-mode" class="mode-info">当前模式: Mock</div>
    <div id="reply" class="reply">thinking...</div>
    <button id="refresh-btn" class="refresh-btn">刷新响应</button>
  </div>
`;

// 添加样式
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    background-color: #f0f7ff;
  }
  .container {
    text-align: center;
    padding: 2rem;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  h1 {
    color: #3498db;
    margin-bottom: 1.5rem;
  }
  .reply {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #3498db;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }
`;
document.head.appendChild(style);

// 检查是否运行在静态环境（GitHub Pages）
function isStaticEnvironment() {
  // 检测是否在GitHub Pages环境中
  // 如果URL中包含github.io，则认为是静态环境
  return window.location.hostname.includes('github.io') || 
         // 或者检查是否在dist目录（构建后的目录）
         window.location.pathname.includes('/dist/') ||
         // 开发时的检查：如果使用了构建后的路径格式
         window.location.pathname.includes('/fedev-large-model-ai/');
}

// 检查是否为mock模式
function isMockMode() {
  try {
    // 静态环境下强制使用mock模式
    if (isStaticEnvironment()) {
      console.log('静态环境检测到，强制使用mock模式');
      return true;
    }
    
    // 1. 首先检查localStorage（由用户手动切换按钮设置，最高优先级）
    const localStorageMode = localStorage.getItem('app_mode');
    if (localStorageMode === 'mock' || localStorageMode === 'real') {
      const isMock = localStorageMode === 'mock';
      console.log(`LocalStorage模式: ${isMock ? 'mock' : '真实'}`);
      return isMock;
    }
    
    // 2. 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const mockParam = urlParams.get('mock');
    if (mockParam !== null) {
      const isMock = mockParam === 'true';
      console.log(`URL参数模式: ${isMock ? 'mock' : '真实'}`);
      return isMock;
    }
    
    // 3. 检查modeConfig（由启动脚本生成）
    if (modeConfig && modeConfig.app_mode) {
      const isMock = modeConfig.app_mode === 'mock';
      console.log(`配置文件模式: ${isMock ? 'mock' : '真实'}`);
      return isMock;
    }
    
    // 4. 检查环境变量（在浏览器环境中通过import.meta.env获取）
    const isEnvMock = import.meta.env?.NODE_ENV === 'mock';
    const isEnvReal = import.meta.env?.NODE_ENV === 'real';
    if (isEnvMock || isEnvReal) {
      const isMock = isEnvMock;
      console.log(`环境变量模式: ${isMock ? 'mock' : '真实'}`);
      return isMock;
    }
    
    // 5. 默认模式（为了安全默认使用mock模式）
    console.log('默认模式: mock');
    return true;
  } catch (e) {
    console.error('检查mock模式出错:', e);
    return true;
  }
}

// 设置当前模式
function setMode(isMock) {
  localStorage.setItem('app_mode', isMock ? 'mock' : 'real');
  
  // 更新UI
  document.getElementById('btn-mock').classList.toggle('active', isMock);
  document.getElementById('btn-real').classList.toggle('active', !isMock);
  document.getElementById('current-mode').textContent = `当前模式: ${isMock ? 'Mock' : '真实'}`;
  
  console.log(`模式已切换为: ${isMock ? 'mock' : 'real'}`);
}

// 初始化模式切换
function initModeSwitcher() {
  const btnMock = document.getElementById('btn-mock');
  const btnReal = document.getElementById('btn-real');
  const refreshBtn = document.getElementById('refresh-btn');
  
  // 初始状态
  const initialMode = isMockMode();
  setMode(initialMode);
  
  // 添加事件监听器
  btnMock.addEventListener('click', () => {
    setMode(true);
    fetchResponse(); // 切换后重新获取响应
  });
  
  btnReal.addEventListener('click', () => {
    setMode(false);
    fetchResponse(); // 切换后重新获取响应
  });
  
  refreshBtn.addEventListener('click', () => {
    fetchResponse();
  });
}

// 保存响应到文件的函数（仅在非mock模式下执行）
async function saveResponseToFile(responseData) {
  // 在mock模式下不保存响应
  if (isMockMode()) {
    console.log('Mock模式下，不保存响应到文件');
    return;
  }
  
  // 准备要保存的数据，包括响应和元信息
  const saveData = {
    timestamp: new Date().toISOString(),
    response: responseData,
    request: {
      model: 'deepseek-chat',
      messages: [
        {role: "system", content: "You are a helpful assistant."},
        {role: "user", content: "你好 Deepseek"}
      ]
    }
  };
  
  try {
    // 调用后端API保存文件
    const response = await fetch('http://localhost:3001/api/save-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saveData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(result.message);
      // 可以在这里添加成功提示给用户
    } else {
      console.error('保存失败:', result.message);
    }
  } catch (error) {
    console.error('保存文件时发生错误:', error);
    
    // 降级处理：如果后端服务不可用，退回到浏览器下载方式
    fallbackToBrowserDownload(saveData);
  }
}

// 降级处理：浏览器下载方式
function fallbackToBrowserDownload(saveData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${timestamp}-response.json`;
  
  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  console.log(`由于后端服务不可用，响应已保存为 ${fileName}（下载到您的默认下载文件夹）`);
}

// 本地模拟数据 - 用于静态环境
const mockResponses = [
  "Hello! 我是Deepseek AI助手，很高兴为您服务。",
  "您好！感谢使用Deepseek AI。有什么我可以帮助您的吗？",
  "Hello! 我是基于先进AI技术构建的智能助手，可以解答各种问题。",
  "欢迎使用Deepseek AI！我在这里为您提供帮助和支持。",
  "你好！我是Deepseek，一个专注于理解和回应人类需求的AI系统。"
];

// 获取随机模拟响应
function getRandomMockResponse() {
  const randomIndex = Math.floor(Math.random() * mockResponses.length);
  return mockResponses[randomIndex];
}

// Deepseek API调用代码
async function fetchDeepseekResponse() {
  const mockMode = isMockMode();
  console.log(`当前模式: ${mockMode ? 'Mock' : '真实'}`);
  
  // 静态环境直接返回本地模拟数据
  if (isStaticEnvironment()) {
    console.log('使用本地模拟数据（静态环境）');
    const mockResponse = getRandomMockResponse();
    // 模拟API响应格式以便与现有代码兼容
    const mockResponseData = {
      choices: [{ message: { content: mockResponse } }]
    };
    
    // 保存响应到文件（saveResponseToFile内部会检查是否为mock模式）
    saveResponseToFile(mockResponseData).catch(err => console.error('保存响应失败:', err));
    return mockResponse;
  }
  
  try {
    let response;
    if (mockMode) {
      // Mock模式：调用模拟API
      console.log('使用Mock API');
      response = await fetch('http://localhost:3001/api/mock-deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: "你好 Deepseek"
        })
      });
    } else {
      // 真实模式：调用真实Deepseek API
      console.log('使用真实Deepseek API');
      // 这里保留原有逻辑，实际使用时需要配置API密钥
      const endpoint = 'https://api.deepseek.com/chat/completions';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || 'demo_key'}`
      };

      const payload = {
        model: 'deepseek-chat',
        messages: [
          {role: "system", content: "You are a helpful assistant."},
          {role: "user", content: "你好 Deepseek"}
        ],
        stream: false
      };
      
      response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      throw new Error(`${mockMode ? '模拟' : '真实'}API错误: ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;
    
    // 保存响应到文件（saveResponseToFile内部会检查是否为mock模式）
    // 注意：这里不使用await，避免阻塞返回
    saveResponseToFile(data).catch(err => console.error('保存响应失败:', err));
    
    // 返回响应内容，让fetchResponse函数可以设置到界面上
    return assistantReply;
  } catch (error) {
    console.error(`${mockMode ? '获取模拟' : '获取真实'}Deepseek响应失败:`, error);
    
    // 使用模拟数据作为降级方案
    console.log('请求失败，使用备用模拟数据');
    const fallbackReply = getRandomMockResponse();
    
    // 模拟API响应格式以便与现有代码兼容
    const mockResponseData = {
      choices: [{ message: { content: fallbackReply } }]
    };
    saveResponseToFile(mockResponseData).catch(err => console.error('保存响应失败:', err));
    
    // 不在这里设置UI，让调用者来处理
    return fallbackReply;
  }
}

// 获取响应的主函数
async function fetchResponse() {
  const replyElement = document.getElementById('reply');
  replyElement.textContent = 'thinking...';
  
  // 显示当前模式
  const isMock = isMockMode();
  document.getElementById('current-mode').textContent = `当前模式: ${isMock ? 'Mock' : '真实'}`;

  try {
    const response = await fetchDeepseekResponse();
    replyElement.textContent = response;
    
    // 保存响应到文件（仅在非mock模式下）
    if (!isMock) {
      await saveResponseToFile(response);
    }
  } catch (error) {
    console.error('获取响应失败:', error);
    replyElement.textContent = `获取响应失败: ${error.message}`;
  }
}

// 初始化模式切换器
initModeSwitcher();

// 立即执行获取响应
fetchResponse();
