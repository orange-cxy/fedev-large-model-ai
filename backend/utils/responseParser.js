// backend/utils/responseParser.js - 响应解析工具
import logger from './logger.js';
import { createErrorResponse, createSuccessResponse } from './helpers.js';

/**
 * 响应解析器类
 * 用于标准化和处理来自不同模型和服务的响应
 */
class ResponseParser {
  /**
   * 标准化OpenAI模型响应
   * @param {Object} response - OpenAI API响应
   * @returns {Object} 标准化的响应
   */
  static parseOpenAIResponse(response) {
    try {
      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error('Invalid OpenAI response format');
      }

      const firstChoice = response.choices[0];
      let content = '';
      let isFunctionCall = false;
      let functionCall = null;

      // 处理聊天完成响应
      if (firstChoice.message) {
        content = firstChoice.message.content || '';
        
        // 检查是否包含函数调用
        if (firstChoice.message.function_call) {
          isFunctionCall = true;
          functionCall = {
            name: firstChoice.message.function_call.name,
            arguments: firstChoice.message.function_call.arguments
          };
        }
      } else if (firstChoice.text) {
        // 处理文本完成响应
        content = firstChoice.text;
      }

      // 提取使用情况统计
      const usage = response.usage || {};
      const stats = {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      };

      return createSuccessResponse({
        content,
        isFunctionCall,
        functionCall,
        model: response.model,
        finishReason: firstChoice.finish_reason || 'unknown',
        stats
      });
    } catch (error) {
      logger.error('Failed to parse OpenAI response', { error: error.message });
      return createErrorResponse('Failed to parse OpenAI response', 500, { originalError: error.message });
    }
  }

  /**
   * 标准化Azure OpenAI响应
   * @param {Object} response - Azure OpenAI API响应
   * @returns {Object} 标准化的响应
   */
  static parseAzureOpenAIResponse(response) {
    try {
      // Azure OpenAI响应格式与OpenAI基本相同
      return this.parseOpenAIResponse(response);
    } catch (error) {
      logger.error('Failed to parse Azure OpenAI response', { error: error.message });
      return createErrorResponse('Failed to parse Azure OpenAI response', 500, { originalError: error.message });
    }
  }

  /**
   * 标准化Anthropic Claude响应
   * @param {Object} response - Anthropic API响应
   * @returns {Object} 标准化的响应
   */
  static parseClaudeResponse(response) {
    try {
      if (!response || !response.completion) {
        throw new Error('Invalid Claude response format');
      }

      // 提取使用情况统计
      const usage = response.usage || {};
      const stats = {
        promptTokens: usage.input_tokens || 0,
        completionTokens: usage.output_tokens || 0,
        totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
      };

      return createSuccessResponse({
        content: response.completion,
        isFunctionCall: false,
        functionCall: null,
        model: response.model || 'claude',
        finishReason: response.stop_reason || 'unknown',
        stats
      });
    } catch (error) {
      logger.error('Failed to parse Claude response', { error: error.message });
      return createErrorResponse('Failed to parse Claude response', 500, { originalError: error.message });
    }
  }

  /**
   * 标准化Google Gemini响应
   * @param {Object} response - Google Gemini API响应
   * @returns {Object} 标准化的响应
   */
  static parseGeminiResponse(response) {
    try {
      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error('Invalid Gemini response format');
      }

      const firstCandidate = response.candidates[0];
      
      // 处理content
      let content = '';
      if (firstCandidate.content && firstCandidate.content.parts) {
        content = firstCandidate.content.parts.map(part => part.text || '').join('');
      }

      // 提取使用情况统计
      const usage = response.usageMetadata || {};
      const stats = {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0)
      };

      return createSuccessResponse({
        content,
        isFunctionCall: false,
        functionCall: null,
        model: response.model || 'gemini',
        finishReason: firstCandidate.finishReason || 'unknown',
        stats
      });
    } catch (error) {
      logger.error('Failed to parse Gemini response', { error: error.message });
      return createErrorResponse('Failed to parse Gemini response', 500, { originalError: error.message });
    }
  }

  /**
   * 标准化Mistral AI响应
   * @param {Object} response - Mistral AI API响应
   * @returns {Object} 标准化的响应
   */
  static parseMistralResponse(response) {
    try {
      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error('Invalid Mistral response format');
      }

      const firstChoice = response.choices[0];
      let content = firstChoice.message?.content || '';

      // 提取使用情况统计
      const usage = response.usage || {};
      const stats = {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      };

      return createSuccessResponse({
        content,
        isFunctionCall: Boolean(firstChoice.message?.function_call),
        functionCall: firstChoice.message?.function_call || null,
        model: response.model,
        finishReason: firstChoice.finish_reason || 'unknown',
        stats
      });
    } catch (error) {
      logger.error('Failed to parse Mistral response', { error: error.message });
      return createErrorResponse('Failed to parse Mistral response', 500, { originalError: error.message });
    }
  }

  /**
   * 标准化本地模型响应
   * @param {Object} response - 本地模型响应
   * @returns {Object} 标准化的响应
   */
  static parseLocalModelResponse(response) {
    try {
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid local model response format');
      }

      // 尝试提取内容
      let content = '';
      if (response.text) {
        content = response.text;
      } else if (response.content) {
        content = response.content;
      } else if (response.message) {
        content = response.message;
      } else if (response.output) {
        content = response.output;
      }

      return createSuccessResponse({
        content,
        isFunctionCall: false,
        functionCall: null,
        model: response.model || 'local-model',
        finishReason: response.finish_reason || 'unknown',
        stats: {
          promptTokens: response.prompt_tokens || 0,
          completionTokens: response.completion_tokens || 0,
          totalTokens: (response.prompt_tokens || 0) + (response.completion_tokens || 0)
        }
      });
    } catch (error) {
      logger.error('Failed to parse local model response', { error: error.message });
      return createErrorResponse('Failed to parse local model response', 500, { originalError: error.message });
    }
  }

  /**
   * 根据模型类型自动选择解析器
   * @param {string} modelType - 模型类型
   * @param {Object} response - 原始响应
   * @returns {Object} 标准化的响应
   */
  static parseByModelType(modelType, response) {
    switch (modelType.toLowerCase()) {
      case 'openai':
        return this.parseOpenAIResponse(response);
      case 'azure-openai':
        return this.parseAzureOpenAIResponse(response);
      case 'claude':
      case 'anthropic':
        return this.parseClaudeResponse(response);
      case 'gemini':
      case 'google':
        return this.parseGeminiResponse(response);
      case 'mistral':
        return this.parseMistralResponse(response);
      case 'local':
        return this.parseLocalModelResponse(response);
      default:
        logger.warn(`Unknown model type: ${modelType}, using default parser`);
        return this.parseLocalModelResponse(response);
    }
  }

  /**
   * 提取响应中的JSON数据
   * @param {string} content - 响应内容
   * @returns {Object|null} 提取的JSON对象或null
   */
  static extractJsonFromResponse(content) {
    try {
      // 尝试直接解析整个内容
      try {
        return JSON.parse(content);
      } catch (e) {
        // 如果失败，尝试提取JSON块
        const jsonMatches = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatches && jsonMatches[1]) {
          return JSON.parse(jsonMatches[1]);
        }
        
        // 尝试提取代码块中的JSON
        const codeMatches = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatches && codeMatches[1]) {
          try {
            return JSON.parse(codeMatches[1]);
          } catch (err) {
            // 忽略
          }
        }
        
        // 尝试提取{...}之间的内容
        const curlyBraceMatch = content.match(/\{[^{}]*\}/);
        if (curlyBraceMatch) {
          return JSON.parse(curlyBraceMatch[0]);
        }
        
        return null;
      }
    } catch (error) {
      logger.warn('Failed to extract JSON from response', { error: error.message });
      return null;
    }
  }

  /**
   * 提取响应中的工具调用信息
   * @param {string} content - 响应内容
   * @returns {Object|null} 工具调用信息
   */
  static extractToolCall(content) {
    try {
      // 尝试从JSON中提取
      const json = this.extractJsonFromResponse(content);
      if (json) {
        if (json.tool_call || json.function_call) {
          return json.tool_call || json.function_call;
        }
        if (json.name && (json.parameters || json.arguments)) {
          return {
            name: json.name,
            arguments: json.parameters || json.arguments
          };
        }
      }

      // 尝试从文本中提取工具调用格式
      // 查找类似 "call_tool('tool_name', {args})" 的模式
      const toolCallRegex = /call_tool\(\s*['"]([^'"]+)['"]\s*,\s*({[^}]*})\s*\)/;
      const match = content.match(toolCallRegex);
      
      if (match) {
        try {
          return {
            name: match[1],
            arguments: JSON.parse(match[2])
          };
        } catch (e) {
          logger.warn('Failed to parse tool call arguments', { error: e.message });
        }
      }

      return null;
    } catch (error) {
      logger.warn('Failed to extract tool call from response', { error: error.message });
      return null;
    }
  }

  /**
   * 格式化响应为流式传输格式
   * @param {Object} data - 要流式传输的数据
   * @returns {string} 格式化的流数据
   */
  static formatStreamChunk(data) {
    try {
      return `data: ${JSON.stringify(data)}\n\n`;
    } catch (error) {
      logger.error('Failed to format stream chunk', { error: error.message });
      return '';
    }
  }

  /**
   * 标准化错误响应
   * @param {Error|Object} error - 错误对象
   * @param {string} serviceName - 服务名称
   * @returns {Object} 标准化的错误响应
   */
  static standardizeError(error, serviceName = 'Unknown') {
    let message = 'Unknown error';
    let code = 'INTERNAL_ERROR';
    let statusCode = 500;
    let details = {};

    if (error instanceof Error) {
      message = error.message;
      details = { stack: error.stack };
    } else if (typeof error === 'object') {
      message = error.message || message;
      code = error.code || code;
      statusCode = error.statusCode || error.status || statusCode;
      details = error.details || {};
    } else if (typeof error === 'string') {
      message = error;
    }

    // 根据错误信息推断错误类型
    if (message.includes('rate limit') || message.includes('quota')) {
      code = 'RATE_LIMIT_EXCEEDED';
      statusCode = 429;
    } else if (message.includes('not found') || message.includes('404')) {
      code = 'NOT_FOUND';
      statusCode = 404;
    } else if (message.includes('unauthorized') || message.includes('401')) {
      code = 'UNAUTHORIZED';
      statusCode = 401;
    } else if (message.includes('forbidden') || message.includes('403')) {
      code = 'FORBIDDEN';
      statusCode = 403;
    } else if (message.includes('validation') || message.includes('400')) {
      code = 'VALIDATION_ERROR';
      statusCode = 400;
    }

    logger.error(`${serviceName} error`, { code, message, details });

    return createErrorResponse(message, statusCode, {
      code,
      serviceName,
      ...details
    });
  }

  /**
   * 处理模型响应的工具调用
   * @param {Object} functionCall - 函数调用信息
   * @returns {Object} 处理后的工具调用对象
   */
  static processFunctionCall(functionCall) {
    try {
      if (!functionCall || !functionCall.name) {
        throw new Error('Invalid function call format');
      }

      // 确保arguments是对象
      let args = functionCall.arguments || {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch (e) {
          logger.warn('Failed to parse function call arguments', { error: e.message });
          args = {};
        }
      }

      return {
        toolName: functionCall.name,
        parameters: args,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to process function call', { error: error.message });
      throw new Error('Invalid function call format');
    }
  }

  /**
   * 计算API调用成本
   * @param {Object} usage - 使用情况统计
   * @param {string} model - 模型名称
   * @returns {Object} 成本信息
   */
  static calculateCost(usage, model) {
    // 简化的成本计算，实际应根据各模型的定价策略进行调整
    const pricing = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-vision-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
      'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
      'claude-3-sonnet-20240229': { prompt: 0.003, completion: 0.015 },
      'claude-3-haiku-20240307': { prompt: 0.00025, completion: 0.00125 },
      'gemini-pro': { prompt: 0.000125, completion: 0.000375 },
      'mistral-large-latest': { prompt: 0.008, completion: 0.024 },
      'mistral-medium-latest': { prompt: 0.002, completion: 0.006 },
      'mistral-small-latest': { prompt: 0.0002, completion: 0.0006 }
    };

    // 查找最匹配的模型定价
    let modelKey = model;
    if (!pricing[model]) {
      // 尝试模糊匹配
      const keys = Object.keys(pricing);
      modelKey = keys.find(key => model.includes(key)) || 'gpt-3.5-turbo';
    }

    const price = pricing[modelKey] || pricing['gpt-3.5-turbo'];
    const promptCost = (usage.promptTokens || 0) * price.prompt / 1000;
    const completionCost = (usage.completionTokens || 0) * price.completion / 1000;
    const totalCost = promptCost + completionCost;

    return {
      model: modelKey,
      promptCost: Number(promptCost.toFixed(6)),
      completionCost: Number(completionCost.toFixed(6)),
      totalCost: Number(totalCost.toFixed(6)),
      currency: 'USD'
    };
  }
}

export default ResponseParser;