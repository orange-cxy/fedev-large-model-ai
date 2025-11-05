// backend/controllers/chatController.js - 聊天控制器
import ChatService from '../services/chatService.js';
import logger from '../utils/logger.js';
import response from '../utils/response.js';

class ChatController {
  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * 创建聊天完成
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async createChatCompletion(req, res, next) {
    try {
      const {
        messages,
        model,
        temperature = 0.7,
        max_tokens = 1000,
        stream = false,
        ...options
      } = req.body;

      logger.info('Chat completion requested', {
        model,
        stream,
        userId: req.user?.id,
        messageCount: messages?.length || 0
      });

      if (stream) {
        // 设置流式响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 处理流式响应
        await this.chatService.streamChatCompletion(
          {
            messages,
            model,
            temperature,
            max_tokens,
            ...options
          },
          res
        );
      } else {
        // 非流式响应
        const result = await this.chatService.createChatCompletion({
          messages,
          model,
          temperature,
          max_tokens,
          ...options
        });

        logger.info('Chat completion successful', {
          model,
          tokens: result?.usage?.total_tokens || 0
        });

        return response.success(
          res,
          result,
          'Chat completion successful',
          response.STATUS_CODES.OK
        );
      }
    } catch (error) {
      logger.error('Chat completion failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 流式聊天接口
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async streamChat(req, res, next) {
    try {
      const { prompt, model, ...options } = req.body;

      logger.info('Stream chat requested', {
        model,
        userId: req.user?.id
      });

      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 处理流式响应
      await this.chatService.streamChat(
        {
          prompt,
          model,
          ...options
        },
        res
      );
    } catch (error) {
      logger.error('Stream chat failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 批量处理聊天请求
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async batchChat(req, res, next) {
    try {
      const { requests } = req.body;

      logger.info('Batch chat requested', {
        requestCount: requests.length,
        userId: req.user?.id
      });

      // 处理每个请求
      const batchResults = await Promise.allSettled(
        requests.map(async (request, index) => {
          try {
            const result = await this.chatService.createChatCompletion(request);
            return {
              index,
              success: true,
              result
            };
          } catch (error) {
            logger.error('Batch chat request failed', {
              index,
              error: error.message
            });
            return {
              index,
              success: false,
              error: error.message,
              errorCode: error.code
            };
          }
        })
      );

      // 格式化结果
      const results = batchResults.map(item =>
        item.status === 'fulfilled' ? item.value : item.reason
      );

      const successfulCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      logger.info('Batch chat completed', {
        total: results.length,
        successful: successfulCount,
        failed: failedCount
      });

      return response.success(
        res,
        {
          results,
          total: results.length,
          successful: successfulCount,
          failed: failedCount
        },
        'Batch chat processing completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Batch chat processing failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 清除聊天历史
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async clearChatHistory(req, res, next) {
    try {
      const { userId } = req.user || {};

      logger.info('Clear chat history requested', {
        userId
      });

      // 在实际应用中，这里应该清除用户的聊天历史
      // 由于我们现在是模拟环境，只返回成功状态
      
      logger.info('Chat history cleared', {
        userId
      });

      return response.success(
        res,
        { cleared: true },
        'Chat history cleared successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to clear chat history', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取聊天使用统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getChatUsage(req, res, next) {
    try {
      const { userId } = req.user || {};

      logger.info('Chat usage statistics requested', {
        userId
      });

      // 模拟使用统计数据
      // 在实际应用中，这里应该从数据库或缓存中获取真实的使用统计
      const usageStats = {
        totalRequests: 0,
        tokensUsed: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestTimestamp: null,
        modelUsage: {}
      };

      return response.success(
        res,
        usageStats,
        'Chat usage statistics retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve chat usage statistics', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export default new ChatController();