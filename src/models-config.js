// 大模型配置文件
export const models = [
  {
    id: 'deepseek',
    name: 'Deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'VITE_DEEPSEEK_API_KEY',
    defaultKey: 'demo_key',
    model: 'deepseek-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-deepseek',
    // Deepseek模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "model": "deepseek-chat",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": messages}
        ],
        "stream": options.stream || false,
      };
    }
  },
  {
    id: 'coze',
    name: 'Coze',
    endpoint: 'https://api.coze.cn/v3/chat',
    apiKeyEnv: 'VITE_COZE_API_KEY',
    defaultKey: 'demo_key',
    model: 'coze-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-coze',
    // Coze模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "bot_id": import.meta.env.VITE_COZE_BOT_ID,
        "user_id": import.meta.env.VITE_COZE_USER_ID,
        "stream": options.stream || false,
        "additional_messages": [
            {
            "content": messages,
            "content_type": "text",
            "role": "user",
            "type": "question"
            }
        ],
        "parameters": {}
      };
    }
  }
];

// 中间件函数：根据模型格式化请求payload
export function formatPayloadForModel(model, messages, options = {}) {
  if (model.formatPayload && typeof model.formatPayload === 'function') {
    return model.formatPayload(messages, options);
  }
  
  // 默认格式化函数（兼容OpenAI风格）
  return {
    model: model.model,
    messages: messages,
    stream: options.stream || false
  };
}

// 中间件函数：处理响应数据，统一格式
export function processResponseForModel(model, rawResponse) {
  // 这里可以根据不同模型的响应格式进行标准化处理
  // 目前假设所有模型都返回与OpenAI兼容的格式
  return rawResponse;
}

// 获取默认模型
export function getDefaultModel() {
  return models[0];
}

// 根据ID获取模型
export function getModelById(id) {
  return models.find(model => model.id === id) || getDefaultModel();
}

// 获取当前选中的模型
export function getCurrentModel() {
  const savedModelId = localStorage.getItem('selected_model');
  return savedModelId ? getModelById(savedModelId) : getDefaultModel();
}

// 设置当前选中的模型
export function setCurrentModel(modelId) {
  localStorage.setItem('selected_model', modelId);
}