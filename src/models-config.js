// 大模型配置文件
export const models = [
  {
    id: 'deepseek',
    name: 'Deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'VITE_DEEPSEEK_API_KEY',
    defaultKey: 'demo_key',
    model: 'deepseek-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-deepseek'
  },
  {
    id: 'coze',
    name: 'Coze',
    endpoint: 'https://api.coze.cn/v3/chat',
    apiKeyEnv: 'VITE_COZE_API_KEY',
    defaultKey: 'demo_key',
    model: 'coze-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-coze'
  }
];

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