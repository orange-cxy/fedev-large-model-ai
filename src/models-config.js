// 大模型配置文件
export const models = [
  {
    id: 'deepseek',
    name: 'Deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'VITE_DEEPSEEK_API_KEY',
    defaultKey: 'demo_key',
    model: 'deepseek-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-api',
    // Deepseek模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "model": "deepseek-chat",
        "modelId": "deepseek",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": messages}
        ],
        "stream": options.stream || false,
      };
    },
    formatResponse: (data) => {
        return {
            context: data.choices[0].message.content
        }
    }
  },
  {
    id: 'cozeV3',
    name: 'CozeV3',
    endpoint: 'https://api.coze.cn/v3/chat',
    apiKeyEnv: 'VITE_COZE_API_KEY',
    defaultKey: 'demo_key',
    model: 'coze-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-api',
    // Coze模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "modelId": "cozeV3",
        "bot_id": import.meta.env.VITE_COZE_BOT_ID,
        "user_id": import.meta.env.VITE_COZE_USER_ID,
        "stream": false,
        query: '你好', chat_history: [], 
        custom_variables: { prompt: messages },
        // "additional_messages": [
        //     {
        //     "content": messages,
        //     "content_type": "text",
        //     "role": "user",
        //     "type": "question"
        //     }
        // ],
        // "parameters": {}
      };
    },
    formatResponse: (data) => {
        return {
            context: data.msg
        }
    },
  },
  {
    id: 'cozeV2',
    name: 'CozeV2',
    endpoint: 'https://api.coze.cn/open_api/v2/chat',
    apiKeyEnv: 'VITE_COZE_API_KEY',
    defaultKey: 'demo_key',
    model: 'coze-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-api',
    // Coze模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "modelId": "cozeV2",
        "bot_id": import.meta.env.VITE_COZE_BOT_ID,
        "user": import.meta.env.VITE_COZE_USER_ID,
        query: messages,
        chat_history: [],
        stream: false,
        custom_variables: { prompt: messages }
      };
    },
    formatResponse: (data) => {
        return {
            context: data.messages[0].content
        }
    },
  },
  {
    id: "kimi-k2-0905-preview",
    name: "kimi-k2-0905-preview",
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    apiKeyEnv: 'VITE_MOONSHOT_API_KEY',
    defaultKey: 'demo_key',
    model: 'coze-chat',
    mockEndpoint: 'http://localhost:3001/api/mock-api',
    // Coze模型的请求格式化函数
    formatPayload: (messages, options = {}) => {
      return {
        "model": "kimi-k2-0905-preview",
        "messages": [
            {
                "role": "system",
                "content": messages
            }
        ],
        "temperature": 0.3,
        "max_tokens": 8192,
        "top_p": 1,
        "stream": false
      };
    },
    formatResponse: (data) => {
        return {
            context: data.choices[0].message.content
        }
    },
  }
];

// 中间件函数：根据模型格式化请求reponsoe
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
  
  // 默认格式化函数（兼容OpenAI风格）
  return {
    model: model.model,
    messages,
    choices: {
        messages,
    },
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