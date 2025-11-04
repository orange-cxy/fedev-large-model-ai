import './style.css'
import { models, getCurrentModel, setCurrentModel } from './models-config.js'

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

// 创建应用内容，支持多模型切换
const app = document.getElementById('app');
app.innerHTML = `
  <div class="container">
    <h1>AI 对话助手</h1>
    <div class="model-selector">
      <label for="model-select">选择模型：</label>
      <select id="model-select"></select>
    </div>
    <div class="mode-switcher">
      <button id="btn-mock" class="mode-btn active">Mock模式</button>
      <button id="btn-real" class="mode-btn">真实模式</button>
    </div>
    <div id="current-status" class="status-info">当前状态: Mock | Deepseek</div>
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
    margin-bottom: 1rem;
  }
  .model-selector {
    margin-bottom: 1rem;
  }
  .model-selector select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  .status-info {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
  .mode-switcher {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .mode-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background-color: #f8f9fa;
    border-radius: 4px;
    cursor: pointer;
  }
  .mode-btn.active {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
  }
  .refresh-btn {
    padding: 0.5rem 1.5rem;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .refresh-btn:hover {
    background-color: #27ae60;
  }
`;
document.head.appendChild(style);

// 检查是否为mock模式
function isMockMode() {
  try {
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
  updateStatusDisplay(isMock);
  
  console.log(`模式已切换为: ${isMock ? 'mock' : 'real'}`);
}

// 更新状态显示
function updateStatusDisplay(isMock = null) {
  const currentIsMock = isMock !== null ? isMock : isMockMode();
  const currentModel = getCurrentModel();
  document.getElementById('current-status').textContent = `当前状态: ${currentIsMock ? 'Mock' : '真实'} | ${currentModel.name}`;
}

// 初始化模型选择器
function initModelSelector() {
  const modelSelect = document.getElementById('model-select');
  const currentModel = getCurrentModel();
  
  // 添加所有模型选项
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    option.selected = model.id === currentModel.id;
    modelSelect.appendChild(option);
  });
  
  // 添加事件监听器
  modelSelect.addEventListener('change', (event) => {
    const selectedModelId = event.target.value;
    setCurrentModel(selectedModelId);
    updateStatusDisplay();
    fetchResponse(); // 切换模型后重新获取响应
  });
}

// 初始化应用
function initApp() {
  const btnMock = document.getElementById('btn-mock');
  const btnReal = document.getElementById('btn-real');
  const refreshBtn = document.getElementById('refresh-btn');
  
  // 初始化模型选择器
  initModelSelector();
  
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
  
  const currentModel = getCurrentModel();
  
  // 准备要保存的数据，包括响应和元信息
  const saveData = {
    timestamp: new Date().toISOString(),
    model: currentModel.id,
    modelName: currentModel.name,
    response: responseData,
    request: {
      model: currentModel.model,
      messages: [
        {role: "system", content: "You are a helpful assistant."},
        {role: "user", content: `你好 ${currentModel.name}`}
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
    // fallbackToBrowserDownload(saveData);
  }
}

// 降级处理：浏览器下载方式
function fallbackToBrowserDownload(saveData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const modelId = saveData.model || 'unknown';
  const fileName = `${timestamp}-${modelId}-response.json`;
  
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

// 通用模型API调用代码
async function fetchModelResponse() {
  const mockMode = isMockMode();
  const currentModel = getCurrentModel();
  console.log(`当前模型: ${currentModel.name}, 模式: ${mockMode ? 'Mock' : '真实'}`);
  
  try {
    let response;
    if (mockMode) {
      // Mock模式：调用模拟API
      console.log(`使用${currentModel.name}的Mock API`);
      response = await fetch(currentModel.mockEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `你好 ${currentModel.name}`
        })
      });
    } else {
      // 真实模式：调用真实API
      console.log(`使用${currentModel.name}的真实API`);
      // 获取API密钥
      const apiKey = import.meta.env[currentModel.apiKeyEnv] || currentModel.defaultKey;
      
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      };

      // 通用的请求负载，不同模型可能需要调整
      const payload = {
        model: currentModel.model,
        messages: [
          {role: "system", content: "You are a helpful assistant."},
          {role: "user", content: `你好 ${currentModel.name}`}
        ],
        stream: false
      };
      
      response = await fetch(currentModel.endpoint, {
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
    return assistantReply;
  } catch (error) {
    console.error(`${mockMode ? '获取模拟' : '获取真实'}${currentModel.name}响应失败:`, error);
    
    // 使用模拟数据作为降级方案
    const fallbackReply = `⚫ 这是一条${mockMode ? '模拟' : '测试'}响应数据（${currentModel.name}）${mockMode ? '，用于验证Mock模式功能。' : '，用于验证保存功能。'}`;
    
    // 不在这里设置UI，让调用者来处理
    return fallbackReply;
  }
}

// 获取响应的主函数
async function fetchResponse() {
  const replyElement = document.getElementById('reply');
  replyElement.textContent = 'thinking...';
  
  // 更新状态显示
  updateStatusDisplay();

  try {
    const response = await fetchModelResponse();
    replyElement.textContent = response;
    
    // 保存响应到文件（仅在非mock模式下）
    const isMock = isMockMode();
    if (!isMock && !response.startsWith('⚫')) {
      await saveResponseToFile(response);
    }
  } catch (error) {
    console.error('获取响应失败:', error);
    replyElement.textContent = `获取响应失败: ${error.message}`;
  }
}

// 初始化应用
initApp();

// 立即执行获取响应
fetchResponse();
