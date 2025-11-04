// 大模型配置文件

// 模型配置和函数的聚合
// const modelFiles = [
//   { id: 'deepseek', json: () => import('./models/deepseek.json'), js: () => import('./models/deepseek.js') },
//   { id: 'cozeV3', json: () => import('./models/cozeV3.json'), js: () => import('./models/cozeV3.js') },
//   { id: 'cozeV2', json: () => import('./models/cozeV2.json'), js: () => import('./models/cozeV2.js') },
//   { id: 'kimi-k2-0905-preview', json: () => import('./models/kimi-k2-0905-preview.json'), js: () => import('./models/kimi-k2-0905-preview.js') }
// ];
let modelFiles = [
  "deepseek",
  "cozeV3",
  "cozeV2",
  "kimi-k2-0905-preview",
].map(item => ({
  id: item,
  json: () => import(`./models/${item}.json`),
  js: () => import(`./models/${item}.js`)
}))

const kimiModelFiles = ['kimi-k2-0711-preview', 'kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'kimi-latest', 'kimi-thinking-preview', 'moonshot-v1-128k', 'moonshot-v1-128k-vision-preview', 'moonshot-v1-32k', 'moonshot-v1-32k-vision-preview', 'moonshot-v1-8k', 'moonshot-v1-8k-vision-preview', 'moonshot-v1-auto'].map(item => {
  return {
    id: item,
    json: () => import(`./models/kimi-k2-0905-preview.json`),
    js: () => import(`./models/kimi-k2-0905-preview.js`),
    options: {
      "id": item,
      "name": item,
      "model": item,
    },
  }
})

modelFiles = modelFiles.concat(kimiModelFiles)

// 动态加载所有模型配置
let models = [];

// 初始化函数，用于异步加载所有模型
async function initializeModels() {
  const loadedModels = await Promise.all(
    modelFiles.map(async (modelFile) => {
      try {
        // 加载JSON配置
        const jsonModule = await modelFile.json();
        const config = jsonModule.default || jsonModule;
        
        // 加载JS函数
        const jsModule = await modelFile.js();
        
        // 合并配置和函数
        return {
          ...config,
          formatPayload: jsModule.formatPayload,
          formatResponse: jsModule.formatResponse,
          ...modelFile.options,
        };
      } catch (error) {
        console.error(`Failed to load model ${modelFile.id}:`, error);
        return null;
      }
    })
  );
  
  // 过滤掉加载失败的模型
  models = loadedModels.filter(model => model !== null);
  
  // 如果没有成功加载的模型，添加默认的deepseek模型作为备用
  if (models.length === 0) {
    models = [{ 
      id: 'deepseek',
      name: 'Deepseek',
      endpoint: 'https://api.deepseek.com/chat/completions',
      apiKeyEnv: 'VITE_DEEPSEEK_API_KEY',
      defaultKey: 'demo_key',
      model: 'deepseek-chat',
      mockEndpoint: 'http://localhost:3001/api/mock-api',
      formatPayload: (messages, options = {}) => ({
        "model": "deepseek-chat",
        "modelId": "deepseek",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": messages}
        ],
        "stream": options.stream || false,
      }),
      formatResponse: (data) => ({
        context: data.choices?.[0]?.message?.content || ""
      })
    }];
  }
}

// 初始化模型
await initializeModels().catch(error => {
  console.error('Failed to initialize models:', error);
});

// 导出模型数组（提供访问接口）
export { models };

// 中间件函数：根据模型格式化请求响应
export function formatResponseForModel(model, response) {
  if (model.formatResponse && typeof model.formatResponse === 'function') {
    return model.formatResponse(response);
  }

  return {
    context: ""
  }
}

// 中间件函数：根据模型格式化请求payload
export function formatPayloadForModel(model, messages, options = {}) {
  if (model.formatPayload && typeof model.formatPayload === 'function') {
    return model.formatPayload(messages, options);
  }
  
  // 默认的请求格式
  return {
    model: model.model,
    messages,
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
  console.log('savedModelId: ', savedModelId, models)
  return savedModelId ? getModelById(savedModelId) : getDefaultModel();
}

// 设置当前选中的模型
export function setCurrentModel(modelId) {
  localStorage.setItem('selected_model', modelId);
}