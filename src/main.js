import './style.css'
import { models, getCurrentModel, setCurrentModel, formatPayloadForModel, formatResponseForModel, processStreamResponse, parseStreamChunk } from './models-config.js'

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

// 创建应用内容，支持多模型切换和流式响应
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
    
    <!-- 新增文本输入区域 -->
    <div class="input-area">
      <textarea id="user-input" placeholder="请输入您的问题..."></textarea>
      <button id="send-btn" class="send-btn">发送</button>
    </div>
    
    <!-- 响应显示区域 -->
    <div class="response-area">
      <h3>AI回复：</h3>
      <div id="reply" class="reply">请输入问题并发送</div>
    </div>
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
  
  /* 新增输入区域样式 */
  .input-area {
    margin: 1rem 0;
    display: flex;
    gap: 0.5rem;
  }
  
  #user-input {
    flex: 1;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    resize: vertical;
    min-height: 60px;
  }
  
  .send-btn {
    padding: 0.8rem 1.5rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    white-space: nowrap;
  }
  
  .send-btn:hover {
    background-color: #2980b9;
  }
  
  .send-btn:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  .response-area {
    margin-top: 1rem;
    text-align: left;
  }
  
  .response-area h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.1rem;
  }
  
  .reply {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #3498db;
    min-height: 60px;
    line-height: 1.6;
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
  });
  
  btnReal.addEventListener('click', () => {
    setMode(false);
  });
  
  // 添加发送按钮事件监听器
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  
  sendBtn.addEventListener('click', () => {
    sendMessage();
  });
  
  // 添加回车键发送功能
  userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
}

// 发送消息函数
async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const message = userInput.value.trim();
  
  if (!message) {
    alert('请输入问题');
    return;
  }
  
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  
  try {
    await fetchResponse(message);
  } finally {
    sendBtn.disabled = false;
  }
}

// 保存响应到文件的函数（仅在非mock模式下执行）
async function saveResponseToFile(responseData, message) {
  // 在mock模式下不保存响应
  if (isMockMode()) {
    console.log('Mock模式下，不保存响应到文件');
    return;
  }
  
  const currentModel = getCurrentModel();
  const payload = currentModel.formatPayload(message);
  
  // 准备要保存的数据，包括响应和元信息
  const saveData = {
    timestamp: new Date().toISOString(),
    model: currentModel.id,
    modelName: currentModel.name,
    response: responseData,
    request: payload,
    message: message,
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

// 通用模型API调用代码，支持流式响应
async function fetchModelResponse(message, onStreamChunk) {
  const mockMode = isMockMode();
  const currentModel = getCurrentModel();
  console.log(`当前模型: ${currentModel.name}, 模式: ${mockMode ? 'Mock' : '真实'}`);
  
  try {
    let response;
    
    // 准备请求参数
    const options = {
      stream: true,
      isMock: mockMode
    };
    
    // 使用中间件函数格式化请求payload
    const payload = formatPayloadForModel(currentModel, message, options);
    
    if (mockMode) {
      // Mock模式：调用模拟API
      console.log(`使用${currentModel.name}的Mock API`, JSON.stringify(payload, null, 2));
      
      response = await fetch(currentModel.mockEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload.model ? payload : {
          ...payload,
          model: currentModel.id,
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

      console.log(`发送到${currentModel.name}的请求格式:`, JSON.stringify(payload, null, 2));
      
      response = await fetch(currentModel.endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload.model ? payload : {
          ...payload,
          model: currentModel.id,
        })
      });
    }

    if (!response.ok) {
      throw new Error(`${mockMode ? '模拟' : '真实'}API错误: ${response.status}`);
    }

    // 如果需要流式处理
    console.log("payload.stream && onStreamChunk", payload.stream, onStreamChunk, response)
    if (payload.stream && onStreamChunk) {
      let fullResponse = '';
      
      // 使用流式处理函数
      await processStreamResponse(response, (chunk) => {
        const textChunk = parseStreamChunk(currentModel, chunk);
        fullResponse += textChunk;
        onStreamChunk(textChunk, chunk);
      });
      
      return {
        response: fullResponse,
        data: { context: fullResponse }
      };
    } else {
      // 非流式处理（降级方案）
      const data = await response.json();
      const assistantReply = formatResponseForModel(currentModel, data);
      return {
        response: data,
        data: assistantReply,
      };
    }
  } catch (error) {
    console.error(`${mockMode ? '获取模拟' : '获取真实'}${currentModel.name}响应失败:`, error);
    
    // 使用模拟数据作为降级方案
    const fallbackReply = `⚫ 这是一条${mockMode ? '模拟' : '测试'}响应数据（${currentModel.name}）

错误信息: ${error.message}`;
    
    // 不在这里设置UI，让调用者来处理
    return {
      response: null,
      data: {
        context: fallbackReply,
      }
    };
  }
}

// 获取响应的主函数，支持流式显示
async function fetchResponse(message) {
  const replyElement = document.getElementById('reply');
  replyElement.textContent = '正在生成回复...';
  
  // 更新状态显示
  updateStatusDisplay();

  try {
    let fullResponse = '';
    let streamEnded = false;
    let lastResponseTime = Date.now();
    let fullRawResponse = null;
    
    // 处理流式响应的回调函数
    const onStreamChunk = (textChunk, rawChunk) => {
      if (textChunk) {
        fullResponse += textChunk;
        replyElement.textContent = fullResponse;
        lastResponseTime = Date.now();
      }
      
      // 保存最后一个原始响应块用于保存
      if (rawChunk) {
        fullRawResponse = rawChunk;
      }
    };
    
    // 开始获取响应
    const responsePromise = fetchModelResponse(message, onStreamChunk);
    
    // 添加超时检测
    const checkTimeout = setInterval(() => {
      if (Date.now() - lastResponseTime > 30000) { // 30秒无响应认为超时
        replyElement.textContent += '\n\n⚠️ 响应超时，可能已断开连接。';
        streamEnded = true;
        clearInterval(checkTimeout);
      }
    }, 1000);
    
    // 等待响应完成
    const finalResponse = await responsePromise;
    streamEnded = true;
    clearInterval(checkTimeout);
    
    // 更新最终响应
    replyElement.textContent = finalResponse.data.context;
    
    // 保存响应到文件（仅在非mock模式下）
    const isMock = isMockMode();
    if (!isMock && !finalResponse.data.context.startsWith('⚫')) {
      await saveResponseToFile(fullRawResponse || finalResponse.response, message);
    }
  } catch (error) {
    console.error('获取响应失败:', error);
    replyElement.textContent = `获取响应失败: ${error.message}`;
  }
}

// 初始化应用
initApp();
