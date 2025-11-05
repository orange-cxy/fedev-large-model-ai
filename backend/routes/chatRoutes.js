// backend/routes/chatRoutes.js - 聊天相关路由
import express from 'express';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import response from '../utils/response.js';
import logger from '../utils/logger.js';
import ChatService from '../services/chatService.js';
import { validateInput } from '../utils/error.js';

const router = express.Router();
const chatService = new ChatService();

/**
 * @route POST /chat/completions
 * @description 创建聊天完成
 * @access API Key Required
 */
router.post('/completions', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Chat completion request received', { userId: req.user?.id });
    
    // 验证输入数据
    const validationRules = {
      messages: {
        presence: true,
        isArray: true,
        minLength: 1
      },
      model: {
        presence: true,
        isString: true
      },
      temperature: {
        isNumber: true,
        optional: true,
        min: 0,
        max: 2
      },
      max_tokens: {
        isNumber: true,
        optional: true,
        min: 1,
        max: 4096
      },
      stream: {
        isBoolean: true,
        optional: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    // 从请求中提取参数
    const {
      messages,
      model,
      temperature = 0.7,
      max_tokens = 1000,
      stream = false,
      ...options
    } = req.body;
    
    // 检查是否需要流式响应
    if (stream) {
      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 处理流式响应
      await chatService.streamChatCompletion({
        messages,
        model,
        temperature,
        max_tokens,
        ...options
      }, res);
      
      // 流式响应会在完成时自动关闭连接
    } else {
      // 非流式响应
      const result = await chatService.createChatCompletion({
        messages,
        model,
        temperature,
        max_tokens,
        ...options
      });
      
      return response.success(
        res,
        result,
        'Chat completion successful',
        response.STATUS_CODES.OK
      );
    }
  } catch (error) {
    logger.error('Chat completion failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /chat/stream
 * @description 流式聊天接口（简化版）
 * @access API Key Required
 */
router.post('/stream', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Stream chat request received', { userId: req.user?.id });
    
    // 验证输入数据
    const validationRules = {
      prompt: {
        presence: true,
        isString: true,
        minLength: 1
      },
      model: {
        presence: true,
        isString: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    // 从请求中提取参数
    const { prompt, model, ...options } = req.body;
    
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 处理流式响应
    await chatService.streamChat({
      prompt,
      model,
      ...options
    }, res);
  } catch (error) {
    logger.error('Stream chat failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /chat/batch
 * @description 批量处理聊天请求
 * @access API Key Required
 */
router.post('/batch', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Batch chat request received', { userId: req.user?.id });
    
    // 验证输入数据
    const validationRules = {
      requests: {
        presence: true,
        isArray: true,
        minLength: 1,
        maxLength: 10 // 限制批量请求数量
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { requests } = req.body;
    
    // 处理每个请求
    const batchResults = await Promise.allSettled(
      requests.map(async (request, index) => {
        try {
          const result = await chatService.createChatCompletion(request);
          return {
            index,
            success: true,
            result
          };
        } catch (error) {
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
    
    return response.success(
      res,
      {
        results,
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      'Batch chat processing completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Batch chat processing failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /chat/clear-history
 * @description 清除聊天历史
 * @access API Key Required
 */
router.post('/clear-history', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Clear chat history request received', { userId: req.user?.id });
    
    // 在实际应用中，这里应该清除用户的聊天历史
    // 由于我们现在是模拟环境，只返回成功状态
    
    return response.success(
      res,
      { cleared: true },
      'Chat history cleared successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to clear chat history', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /chat/usage
 * @description 获取聊天使用统计
 * @access API Key Required
 */
router.get('/usage', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Chat usage statistics requested', { userId: req.user?.id });
    
    // 模拟使用统计数据
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
    logger.error('Failed to retrieve chat usage statistics', { error: error.message });
    throw error;
  }
}));

export default router;