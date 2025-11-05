// backend/services/chatService.js - 聊天服务
import { getModelConfig } from '../config/config.js';
import logger from '../utils/logger.js';
import {
  ApiError,
  ServiceUnavailableError,
  BadRequestError
} from '../utils/error.js';

const modelConfig = getModelConfig();

// 聊天服务类
class ChatService {
  constructor() {
    this.modelProviders = {
      'openai': this.processOpenAIModel.bind(this),
      'anthropic': this.processAnthropicModel.bind(this),
      'custom': this.processCustomModel.bind(this)
    };
  }
  
  /**
   * 处理聊天请求
   * @param {Object} params - 请求参数
   * @param {string} params.model - 模型名称
   * @param {Array} params.messages - 消息数组
   * @param {string} params.mode - 模式（chat/qa/code）
   * @param {Object} params.options - 额外选项
   * @returns {Promise<Object>} 聊天响应
   */
  async processChatRequest({ model, messages, mode = 'chat', options = {} }) {
    try {
      logger.info('Processing chat request', {
        model,
        mode,
        messageCount: messages.length,
        options: Object.keys(options).join(', ')
      });
      
      // 验证输入参数
      this.validateChatRequest({ model, messages, mode });
      
      // 获取模型信息
      const modelInfo = this.getModelInfo(model);
      
      // 根据模型提供商选择处理函数
      const providerHandler = this.modelProviders[modelInfo.provider];
      if (!providerHandler) {
        throw new BadRequestError(`Unsupported model provider: ${modelInfo.provider}`);
      }
      
      // 处理请求
      const response = await providerHandler({
        model,
        modelInfo,
        messages,
        mode,
        options
      });
      
      logger.info('Chat request processed successfully', {
        model,
        responseTime: response.responseTime || 'unknown',
        tokenUsage: response.tokenUsage
      });
      
      return response;
    } catch (error) {
      logger.error('Chat request failed', {
        model,
        mode,
        error: error.message,
        stack: error.stack
      });
      
      // 重新抛出错误或转换为适当的错误类型
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new ServiceUnavailableError('Model service is unavailable');
      }
      
      throw new ApiError(
        error.message || 'Chat processing failed',
        500,
        'CHAT_PROCESSING_FAILED',
        { originalError: error.message }
      );
    }
  }
  
  /**
   * 验证聊天请求
   */
  validateChatRequest({ model, messages, mode }) {
    // 验证模型
    if (!model || !modelConfig.availableModels.includes(model)) {
      throw new BadRequestError(
        `Invalid model: ${model}. Available models: ${modelConfig.availableModels.join(', ')}`
      );
    }
    
    // 验证消息
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestError('Messages must be a non-empty array');
    }
    
    // 验证消息格式
    for (const message of messages) {
      if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
        throw new BadRequestError('Each message must have a valid role');
      }
      if (!message.content || typeof message.content !== 'string') {
        throw new BadRequestError('Each message must have content');
      }
    }
    
    // 验证模式
    if (!['chat', 'qa', 'code'].includes(mode)) {
      throw new BadRequestError('Mode must be one of: chat, qa, code');
    }
  }
  
  /**
   * 获取模型信息
   */
  getModelInfo(model) {
    const modelMap = {
      'gpt-3.5-turbo': { provider: 'openai', maxTokens: 4096 },
      'gpt-3.5-turbo-16k': { provider: 'openai', maxTokens: 16384 },
      'gpt-4': { provider: 'openai', maxTokens: 8192 },
      'gpt-4o': { provider: 'openai', maxTokens: 128000 },
      'claude-3-opus': { provider: 'anthropic', maxTokens: 200000 },
      'claude-3-sonnet': { provider: 'anthropic', maxTokens: 200000 },
      'claude-3-haiku': { provider: 'anthropic', maxTokens: 200000 },
      'llama3-8b': { provider: 'custom', maxTokens: 32768 },
      'llama3-70b': { provider: 'custom', maxTokens: 32768 }
    };
    
    return modelMap[model] || { provider: 'custom', maxTokens: 8192 };
  }
  
  /**
   * 处理OpenAI模型
   */
  async processOpenAIModel({ model, messages, mode, options }) {
    const startTime = Date.now();
    
    try {
      // 这里是模拟实现，实际应该调用OpenAI API
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // const response = await openai.chat.completions.create({...});
      
      // 模拟响应
      const mockResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: this.generateMockResponse(messages, mode)
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      };
      
      const responseTime = Date.now() - startTime;
      
      return {
        id: mockResponse.id,
        content: mockResponse.choices[0].message.content,
        role: mockResponse.choices[0].message.role,
        model,
        responseTime,
        tokenUsage: mockResponse.usage,
        finishReason: mockResponse.choices[0].finish_reason
      };
    } catch (error) {
      throw new ApiError(
        `OpenAI API error: ${error.message}`,
        500,
        'OPENAI_API_ERROR'
      );
    }
  }
  
  /**
   * 处理Anthropic模型
   */
  async processAnthropicModel({ model, messages, mode, options }) {
    const startTime = Date.now();
    
    try {
      // 这里是模拟实现，实际应该调用Anthropic API
      // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      // const response = await anthropic.messages.create({...});
      
      // 模拟响应
      const mockResponse = {
        id: `msg-${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: this.generateMockResponse(messages, mode)
          }
        ],
        model,
        usage: {
          input_tokens: 100,
          output_tokens: 200
        }
      };
      
      const responseTime = Date.now() - startTime;
      
      return {
        id: mockResponse.id,
        content: mockResponse.content[0].text,
        role: mockResponse.role,
        model,
        responseTime,
        tokenUsage: mockResponse.usage,
        finishReason: 'stop'
      };
    } catch (error) {
      throw new ApiError(
        `Anthropic API error: ${error.message}`,
        500,
        'ANTHROPIC_API_ERROR'
      );
    }
  }
  
  /**
   * 处理自定义模型
   */
  async processCustomModel({ model, messages, mode, options }) {
    const startTime = Date.now();
    
    try {
      // 模拟自定义模型响应
      const mockResponse = {
        content: this.generateMockResponse(messages, mode),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200
        }
      };
      
      const responseTime = Date.now() - startTime;
      
      return {
        id: `custom-${Date.now()}`,
        content: mockResponse.content,
        role: 'assistant',
        model,
        responseTime,
        tokenUsage: mockResponse.usage,
        finishReason: 'stop'
      };
    } catch (error) {
      throw new ApiError(
        `Custom model error: ${error.message}`,
        500,
        'CUSTOM_MODEL_ERROR'
      );
    }
  }
  
  /**
   * 生成模拟响应
   */
  generateMockResponse(messages, mode) {
    const lastMessage = messages[messages.length - 1].content;
    
    switch (mode) {
      case 'qa':
        return `I'm answering your question about: ${lastMessage}\n\nThis is a simulated response from the QA mode. In a real implementation, this would use an appropriate model to provide a concise and accurate answer.`;
        
      case 'code':
        return `I'll help you with code related to: ${lastMessage}\n\n\`\`\`javascript\n// This is a simulated code response\nfunction example() {\n  console.log('Hello from code mode!');\n  // Your actual code would be generated here\n}\n\`\`\``;
        
      case 'chat':
      default:
        return `Thank you for your message: ${lastMessage}\n\nThis is a simulated response from the chat mode. In a real implementation, this would use a language model to generate a natural conversation response.`;
    }
  }
  
  /**
   * 计算Token使用量估计
   */
  estimateTokenUsage(text) {
    // 简单的token估算（实际应该使用更准确的tokenizer）
    return Math.ceil(text.length / 4);
  }
  
  /**
   * 流式处理聊天响应
   */
  async *streamChatResponse(request) {
    const { model, messages, mode } = request;
    
    // 验证请求
    this.validateChatRequest({ model, messages, mode });
    
    // 模拟流式响应
    const fullResponse = this.generateMockResponse(messages, mode);
    const chunks = fullResponse.split(/(?<=\s)/); // 在空格后分割
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50)); // 模拟延迟
      
      yield {
        id: `stream-${Date.now()}`,
        content: chunk,
        model,
        isFinished: chunk === chunks[chunks.length - 1]
      };
    }
  }
}

// 导出聊天服务实例
const chatService = new ChatService();
export default chatService;