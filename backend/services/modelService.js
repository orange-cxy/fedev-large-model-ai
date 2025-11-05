// backend/services/modelService.js - 模型服务
import { getModelConfig } from '../config/config.js';
import logger from '../utils/logger.js';
import { BadRequestError, NotFoundError } from '../utils/error.js';

const modelConfig = getModelConfig();

// 模型服务类
class ModelService {
  constructor() {
    // 模型信息缓存
    this.modelCache = new Map();
    // 模型使用统计
    this.modelStats = {};
  }
  
  /**
   * 获取所有可用模型
   * @returns {Promise<Array>} 可用模型列表
   */
  async getAvailableModels() {
    try {
      logger.info('Fetching available models');
      
      // 从配置中获取可用模型
      const models = modelConfig.availableModels.map(modelId => {
        return this.getModelDetails(modelId);
      });
      
      logger.info('Models fetched successfully', { count: models.length });
      return models;
    } catch (error) {
      logger.error('Failed to fetch models', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取模型详情
   * @param {string} modelId - 模型ID
   * @returns {Object} 模型详细信息
   */
  getModelDetails(modelId) {
    // 检查缓存
    if (this.modelCache.has(modelId)) {
      logger.debug('Model details retrieved from cache', { modelId });
      return this.modelCache.get(modelId);
    }
    
    // 验证模型是否存在
    if (!modelConfig.availableModels.includes(modelId)) {
      throw new NotFoundError(`Model ${modelId} not found`);
    }
    
    // 模型详细信息映射
    const modelDetailsMap = {
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        providerId: 'openai',
        description: 'Fast and cost-effective general-purpose model',
        maxTokens: 4096,
        contextWindow: 4096,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.0015,
          completion: 0.002
        },
        isDefault: true,
        capabilities: ['text-generation', 'code-generation', 'conversational'],
        performance: {
          speed: 'fast',
          accuracy: 'good',
          creativity: 'moderate'
        }
      },
      'gpt-3.5-turbo-16k': {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        provider: 'OpenAI',
        providerId: 'openai',
        description: 'GPT-3.5 with extended context window',
        maxTokens: 16384,
        contextWindow: 16384,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.003,
          completion: 0.004
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'conversational', 'long-context'],
        performance: {
          speed: 'fast',
          accuracy: 'good',
          creativity: 'moderate'
        }
      },
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        providerId: 'openai',
        description: 'Advanced model for complex tasks',
        maxTokens: 8192,
        contextWindow: 8192,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.03,
          completion: 0.06
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'conversational', 'complex-reasoning'],
        performance: {
          speed: 'medium',
          accuracy: 'high',
          creativity: 'high'
        }
      },
      'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        providerId: 'openai',
        description: 'Latest multimodal model with vision and audio capabilities',
        maxTokens: 128000,
        contextWindow: 128000,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.005,
          completion: 0.015
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'vision', 'audio', 'multimodal'],
        performance: {
          speed: 'fast',
          accuracy: 'very-high',
          creativity: 'high'
        }
      },
      'claude-3-opus': {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        providerId: 'anthropic',
        description: 'Anthropic\'s most advanced model',
        maxTokens: 200000,
        contextWindow: 200000,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.015,
          completion: 0.075
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'long-context', 'complex-reasoning'],
        performance: {
          speed: 'medium',
          accuracy: 'very-high',
          creativity: 'high'
        }
      },
      'claude-3-sonnet': {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        providerId: 'anthropic',
        description: 'Balance of power and efficiency',
        maxTokens: 200000,
        contextWindow: 200000,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.003,
          completion: 0.015
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'long-context'],
        performance: {
          speed: 'fast',
          accuracy: 'high',
          creativity: 'high'
        }
      },
      'claude-3-haiku': {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        providerId: 'anthropic',
        description: 'Fastest and most cost-effective Claude model',
        maxTokens: 200000,
        contextWindow: 200000,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.00025,
          completion: 0.00125
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'conversational'],
        performance: {
          speed: 'very-fast',
          accuracy: 'good',
          creativity: 'moderate'
        }
      },
      'llama3-8b': {
        id: 'llama3-8b',
        name: 'Llama 3 8B',
        provider: 'Meta',
        providerId: 'custom',
        description: 'Open-source 8B parameter model',
        maxTokens: 32768,
        contextWindow: 32768,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.0001,
          completion: 0.0001
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'conversational'],
        performance: {
          speed: 'fast',
          accuracy: 'moderate',
          creativity: 'moderate'
        }
      },
      'llama3-70b': {
        id: 'llama3-70b',
        name: 'Llama 3 70B',
        provider: 'Meta',
        providerId: 'custom',
        description: 'Open-source 70B parameter model',
        maxTokens: 32768,
        contextWindow: 32768,
        supportedModes: ['chat', 'qa', 'code'],
        costPerToken: {
          prompt: 0.001,
          completion: 0.001
        },
        isDefault: false,
        capabilities: ['text-generation', 'code-generation', 'conversational', 'complex-reasoning'],
        performance: {
          speed: 'medium',
          accuracy: 'good',
          creativity: 'high'
        }
      }
    };
    
    // 获取模型详情
    const details = modelDetailsMap[modelId];
    
    if (!details) {
      // 如果没有详细信息，创建默认信息
      const defaultDetails = {
        id: modelId,
        name: modelId,
        provider: 'Custom',
        providerId: 'custom',
        description: 'Custom model',
        maxTokens: 8192,
        contextWindow: 8192,
        supportedModes: ['chat'],
        costPerToken: {
          prompt: 0.001,
          completion: 0.001
        },
        isDefault: modelId === modelConfig.defaultModel,
        capabilities: ['text-generation'],
        performance: {
          speed: 'medium',
          accuracy: 'moderate',
          creativity: 'moderate'
        }
      };
      
      this.modelCache.set(modelId, defaultDetails);
      return defaultDetails;
    }
    
    // 更新默认标记
    details.isDefault = modelId === modelConfig.defaultModel;
    
    // 缓存模型信息
    this.modelCache.set(modelId, details);
    
    return details;
  }
  
  /**
   * 获取默认模型
   * @returns {Object} 默认模型信息
   */
  getDefaultModel() {
    return this.getModelDetails(modelConfig.defaultModel);
  }
  
  /**
   * 按提供者过滤模型
   * @param {string} providerId - 提供者ID
   * @returns {Array} 过滤后的模型列表
   */
  async getModelsByProvider(providerId) {
    const allModels = await this.getAvailableModels();
    return allModels.filter(model => model.providerId === providerId);
  }
  
  /**
   * 验证模型是否支持指定模式
   * @param {string} modelId - 模型ID
   * @param {string} mode - 模式
   * @returns {boolean} 是否支持
   */
  isModelSupportMode(modelId, mode) {
    const modelDetails = this.getModelDetails(modelId);
    return modelDetails.supportedModes.includes(mode);
  }
  
  /**
   * 记录模型使用情况
   * @param {string} modelId - 模型ID
   * @param {Object} usage - 使用信息
   */
  recordModelUsage(modelId, usage) {
    if (!this.modelStats[modelId]) {
      this.modelStats[modelId] = {
        totalRequests: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCost: 0,
        lastUsed: new Date().toISOString()
      };
    }
    
    const stats = this.modelStats[modelId];
    stats.totalRequests += 1;
    stats.totalPromptTokens += usage.prompt_tokens || 0;
    stats.totalCompletionTokens += usage.completion_tokens || 0;
    stats.totalTokens += (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    
    // 计算成本
    const modelDetails = this.getModelDetails(modelId);
    const promptCost = (usage.prompt_tokens || 0) * (modelDetails.costPerToken.prompt / 1000);
    const completionCost = (usage.completion_tokens || 0) * (modelDetails.costPerToken.completion / 1000);
    stats.totalCost += promptCost + completionCost;
    
    stats.lastUsed = new Date().toISOString();
    
    logger.debug('Model usage recorded', {
      modelId,
      usage: stats
    });
  }
  
  /**
   * 获取模型使用统计
   * @returns {Object} 使用统计
   */
  getModelStats() {
    return this.modelStats;
  }
  
  /**
   * 清除模型缓存
   */
  clearModelCache() {
    this.modelCache.clear();
    logger.info('Model cache cleared');
  }
  
  /**
   * 验证消息是否在模型的上下文窗口内
   * @param {string} modelId - 模型ID
   * @param {Array} messages - 消息数组
   * @returns {boolean} 是否在窗口内
   */
  validateContextWindow(modelId, messages) {
    const modelDetails = this.getModelDetails(modelId);
    const maxTokens = modelDetails.contextWindow;
    
    // 简单的token估算
    let totalTokens = 0;
    for (const message of messages) {
      // 消息结构本身也占用tokens
      totalTokens += 5; // 基础结构开销
      // 估算消息内容的tokens
      totalTokens += Math.ceil((message.role.length + message.content.length) / 4);
    }
    
    return totalTokens <= maxTokens;
  }
  
  /**
   * 估算消息的token数量
   * @param {Array} messages - 消息数组
   * @returns {number} 估算的token数量
   */
  estimateMessageTokens(messages) {
    let totalTokens = 0;
    for (const message of messages) {
      totalTokens += 5; // 基础结构开销
      totalTokens += Math.ceil((message.role.length + message.content.length) / 4);
    }
    return totalTokens;
  }
}

// 导出模型服务实例
const modelService = new ModelService();
export default modelService;