// src/services/api-service.js
import { appState } from '../state/app-state.js';

// 假设这是从现有的models-config.js导入的
const parseStreamChunk = (chunk) => {
  // 实际实现将取决于模型配置文件中的逻辑
  return chunk;
};

export class ApiService {
  async fetchModelResponse(message, onStreamChunk) {
    try {
      const mockMode = appState.getState().currentMode === 'mock';
      const currentModel = appState.getState().currentModel;
      
      if (!currentModel) {
        throw new Error('未选择模型');
      }
      
      // 设置加载状态
      appState.setLoading(true);
      appState.setError(null);
      appState.updateResponse('');
      
      if (mockMode) {
        // Mock模式逻辑
        return this._fetchMockResponse(message, currentModel, onStreamChunk);
      } else {
        // 真实API调用逻辑
        return this._fetchRealResponse(message, currentModel, onStreamChunk);
      }
    } catch (error) {
      console.error('API调用失败:', error);
      appState.setError(error.message);
      appState.setLoading(false);
      throw error;
    }
  }
  
  async _fetchMockResponse(message, model, onStreamChunk) {
    // 模拟响应逻辑
    const mockResponses = [
      "感谢您的提问！我是AI助手，可以回答各种问题。",
      "根据您的问题，我需要分析几个关键点...",
      "这个问题很有趣，让我思考一下...",
      "从多方面来看，这个问题可以这样理解...",
      "我很高兴为您提供帮助！针对您的问题..."
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // 模拟流式响应
    let index = 0;
    const responseInterval = setInterval(() => {
      if (index < randomResponse.length) {
        const chunk = randomResponse.slice(index, index + Math.floor(Math.random() * 10) + 1);
        index += chunk.length;
        appState.updateResponse(prev => prev + chunk);
        if (onStreamChunk) onStreamChunk(chunk);
      } else {
        clearInterval(responseInterval);
        appState.setLoading(false);
        // 添加到历史记录
        appState.addToHistory({
          id: Date.now().toString(),
          content: message,
          sender: 'user',
          timestamp: Date.now()
        });
        appState.addToHistory({
          id: (Date.now() + 1).toString(),
          content: randomResponse,
          sender: 'ai',
          timestamp: Date.now()
        });
      }
    }, 50);
  }
  
  async _fetchRealResponse(message, model, onStreamChunk) {
    // 这里应该是真实API调用的实现
    // 由于没有实际的API，这里暂时返回mock数据
    return this._fetchMockResponse(message, model, onStreamChunk);
  }
  
  async saveChatHistory(data) {
    try {
      // 实现保存聊天历史的逻辑
      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('保存失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('保存聊天历史失败:', error);
      // 如果API调用失败，尝试本地存储
      try {
        const historyKey = `chat_history_${Date.now()}`;
        localStorage.setItem(historyKey, JSON.stringify(data));
        return { success: true, fileName: historyKey };
      } catch (localError) {
        throw new Error('无法保存聊天历史');
      }
    }
  }
  
  async loadChatHistory(modelId) {
    try {
      const response = await fetch(`/api/mock/models/${modelId}/history`);
      
      if (!response.ok) {
        throw new Error('加载失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      // 尝试从本地存储加载
      const history = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('chat_history_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            history.push(item);
          } catch (e) {
            console.error('解析本地历史失败:', e);
          }
        }
      }
      return { success: true, data: history };
    }
  }
}

export const apiService = new ApiService();