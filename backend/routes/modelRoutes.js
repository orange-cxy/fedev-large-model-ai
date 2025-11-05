// backend/routes/modelRoutes.js - 模型相关路由
import express from 'express';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import response from '../utils/response.js';
import logger from '../utils/logger.js';
import ModelService from '../services/modelService.js';
import { validateInput } from '../utils/error.js';

const router = express.Router();
const modelService = new ModelService();

/**
 * @route GET /models
 * @description 获取所有可用模型
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get available models requested');
    
    // 从查询参数获取过滤条件
    const { provider, category, minContextWindow } = req.query;
    
    // 构建过滤选项
    const filterOptions = {};
    if (provider) filterOptions.provider = provider;
    if (category) filterOptions.category = category;
    if (minContextWindow) {
      filterOptions.minContextWindow = parseInt(minContextWindow, 10);
    }
    
    // 获取模型列表
    const models = await modelService.getAvailableModels(filterOptions);
    
    return response.success(
      res,
      {
        models,
        total: models.length,
        providers: [...new Set(models.map(m => m.provider))],
        categories: [...new Set(models.map(m => m.category))]
      },
      'Models retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve models', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/:modelId
 * @description 获取模型详情
 * @access Public
 */
router.get('/:modelId', asyncErrorHandler(async (req, res) => {
  try {
    const { modelId } = req.params;
    logger.info(`Get model details requested for ${modelId}`);
    
    // 获取模型详情
    const model = await modelService.getModelDetails(modelId);
    
    return response.success(
      res,
      model,
      'Model details retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve model details', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/provider/:provider
 * @description 获取指定提供商的所有模型
 * @access Public
 */
router.get('/provider/:provider', asyncErrorHandler(async (req, res) => {
  try {
    const { provider } = req.params;
    logger.info(`Get models by provider requested for ${provider}`);
    
    // 验证提供商名称
    const validationRules = {
      provider: {
        presence: true,
        isString: true,
        minLength: 1
      }
    };
    validateInput({ provider }, validationRules);
    
    // 获取指定提供商的模型
    const models = await modelService.getModelsByProvider(provider);
    
    return response.success(
      res,
      {
        provider,
        models,
        total: models.length
      },
      `Models for provider ${provider} retrieved successfully`,
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve models by provider', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/default
 * @description 获取默认模型信息
 * @access Public
 */
router.get('/default', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get default model requested');
    
    // 获取默认模型
    const defaultModel = await modelService.getDefaultModel();
    
    return response.success(
      res,
      defaultModel,
      'Default model retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve default model', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /models/validate
 * @description 验证模型和参数是否兼容
 * @access API Key Required
 */
router.post('/validate', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Validate model compatibility requested');
    
    // 验证输入数据
    const validationRules = {
      model: {
        presence: true,
        isString: true
      },
      messages: {
        presence: true,
        isArray: true,
        minLength: 1
      },
      options: {
        optional: true,
        isObject: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { model, messages, options = {} } = req.body;
    
    // 验证模型兼容性
    const validationResult = await modelService.validateModelCompatibility(
      model,
      messages,
      options
    );
    
    return response.success(
      res,
      validationResult,
      'Model validation completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Model validation failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/features/supported
 * @description 获取所有支持的功能特性
 * @access Public
 */
router.get('/features/supported', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get supported features requested');
    
    // 获取支持的功能特性
    const features = modelService.getSupportedFeatures();
    
    return response.success(
      res,
      features,
      'Supported features retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve supported features', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/:modelId/context-window
 * @description 验证上下文窗口大小
 * @access API Key Required
 */
router.get('/:modelId/context-window', asyncErrorHandler(async (req, res) => {
  try {
    const { modelId } = req.params;
    const { messages } = req.query;
    
    logger.info(`Validate context window for model ${modelId}`);
    
    // 解析消息（如果提供）
    let parsedMessages = [];
    if (messages) {
      try {
        parsedMessages = JSON.parse(messages);
      } catch (parseError) {
        return response.error(
          res,
          'Invalid messages format',
          response.STATUS_CODES.BAD_REQUEST,
          { error: 'MESSAGES_PARSE_ERROR' }
        );
      }
    }
    
    // 验证上下文窗口
    const contextInfo = await modelService.validateContextWindow(
      modelId,
      parsedMessages
    );
    
    return response.success(
      res,
      contextInfo,
      'Context window validation completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Context window validation failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /models/stats/usage
 * @description 获取模型使用统计
 * @access API Key Required
 */
router.get('/stats/usage', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get model usage statistics requested');
    
    // 获取时间范围
    const { startDate, endDate } = req.query;
    
    // 获取使用统计
    const stats = await modelService.getModelUsageStats(startDate, endDate);
    
    return response.success(
      res,
      stats,
      'Model usage statistics retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve model usage statistics', { error: error.message });
    throw error;
  }
}));

export default router;