// src/services/storage-service.js
export class StorageService {
  constructor() {
    this.supported = this._checkStorageSupport();
  }
  
  // 检查存储支持
  _checkStorageSupport() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('本地存储不可用:', e);
      return false;
    }
  }
  
  // 保存数据
  save(key, data) {
    if (!this.supported) {
      console.error('本地存储不可用');
      return false;
    }
    
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`保存数据失败 [${key}]:`, error);
      return false;
    }
  }
  
  // 加载数据
  load(key) {
    if (!this.supported) {
      console.error('本地存储不可用');
      return null;
    }
    
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error(`加载数据失败 [${key}]:`, error);
      return null;
    }
  }
  
  // 删除数据
  remove(key) {
    if (!this.supported) {
      console.error('本地存储不可用');
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除数据失败 [${key}]:`, error);
      return false;
    }
  }
  
  // 清除所有数据
  clear() {
    if (!this.supported) {
      console.error('本地存储不可用');
      return false;
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('清除数据失败:', error);
      return false;
    }
  }
  
  // 获取所有键
  getAllKeys() {
    if (!this.supported) {
      console.error('本地存储不可用');
      return [];
    }
    
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } catch (error) {
      console.error('获取所有键失败:', error);
      return [];
    }
  }
  
  // 保存聊天历史
  saveChatHistory(model, conversation) {
    const key = `chat_history_${model}_${Date.now()}`;
    return this.save(key, {
      model,
      timestamp: Date.now(),
      conversation
    });
  }
  
  // 加载特定模型的聊天历史
  loadChatHistory(model) {
    const allKeys = this.getAllKeys();
    const historyKeys = allKeys.filter(key => 
      key.startsWith('chat_history_') && key.includes(model)
    );
    
    const history = [];
    historyKeys.forEach(key => {
      const data = this.load(key);
      if (data) {
        history.push(data);
      }
    });
    
    // 按时间戳排序
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // 保存用户偏好设置
  saveUserPreferences(prefs) {
    return this.save('user_preferences', prefs);
  }
  
  // 加载用户偏好设置
  loadUserPreferences() {
    return this.load('user_preferences') || {
      theme: 'light',
      defaultMode: 'mock',
      defaultModel: null,
      fontSize: 'medium'
    };
  }
  
  // 缓存模型响应（用于优化）
  cacheModelResponse(model, prompt, response) {
    const cacheKey = `model_cache_${model}_${this._generateCacheKey(prompt)}`;
    const cacheData = {
      prompt,
      response,
      timestamp: Date.now()
    };
    return this.save(cacheKey, cacheData);
  }
  
  // 获取缓存的模型响应
  getCachedResponse(model, prompt) {
    const cacheKey = `model_cache_${model}_${this._generateCacheKey(prompt)}`;
    const cached = this.load(cacheKey);
    
    // 检查缓存是否过期（24小时）
    if (cached && (Date.now() - cached.timestamp) < 24 * 60 * 60 * 1000) {
      return cached.response;
    }
    
    return null;
  }
  
  // 生成缓存键
  _generateCacheKey(text) {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export const storageService = new StorageService();