// backend/controllers/modelController.js - 模型控制器
import ModelService from '../services/modelService.js';
import logger from '../utils/logger.js';
import response from '../utils/response.js';

class ModelController {
  constructor() {
    this.modelService = new ModelService();
  }

  /**
   * 获取所有可用模型
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getAvailableModels(req, res, next) {
    try {
      // 从查询参数获取过滤条件
      const { provider, category, minContextWindow } = req.query;
      
      logger.info('Get available models requested', {
        provider,
        category,
        minContextWindow
      });
      
      // 构建过滤选项
      const filterOptions = {};
      if (provider) filterOptions.provider = provider;
      if (category) filterOptions.category = category;
      if (minContextWindow) {
        filterOptions.minContextWindow = parseInt(minContextWindow, 10);
      }
      
      // 获取模型列表
      const models = await this.modelService.getAvailableModels(filterOptions);
      
      // 提取唯一的提供商和类别
      const providers = [...new Set(models.map(m => m.provider))];
      const categories = [...new Set(models.map(m => m.category))];
      
      logger.info('Models retrieved successfully', {
        totalModels: models.length,
        providers: providers.length,
        categories: categories.length
      });
      
      return response.success(
        res,
        {
          models,
          total: models.length,
          providers,
          categories
        },
        'Models retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve models', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取模型详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getModelDetails(req, res, next) {
    try {
      const { modelId } = req.params;
      
      logger.info(`Get model details requested for ${modelId}`);
      
      // 获取模型详情
      const model = await this.modelService.getModelDetails(modelId);
      
      logger.info(`Model details retrieved successfully for ${modelId}`);
      
      return response.success(
        res,
        model,
        'Model details retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error(`Failed to retrieve model details for ${req.params.modelId}`, {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取指定提供商的所有模型
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getModelsByProvider(req, res, next) {
    try {
      const { provider } = req.params;
      
      logger.info(`Get models by provider requested for ${provider}`);
      
      // 获取指定提供商的模型
      const models = await this.modelService.getModelsByProvider(provider);
      
      logger.info(`Models for provider ${provider} retrieved successfully`, {
        totalModels: models.length
      });
      
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
      logger.error(`Failed to retrieve models for provider ${req.params.provider}`, {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取默认模型信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getDefaultModel(req, res, next) {
    try {
      logger.info('Get default model requested');
      
      // 获取默认模型
      const defaultModel = await this.modelService.getDefaultModel();
      
      logger.info('Default model retrieved successfully', {
        modelId: defaultModel.id
      });
      
      return response.success(
        res,
        defaultModel,
        'Default model retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve default model', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 验证模型和参数是否兼容
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async validateModelCompatibility(req, res, next) {
    try {
      const { model, messages, options = {} } = req.body;
      
      logger.info('Validate model compatibility requested', {
        model,
        messageCount: messages?.length || 0,
        userId: req.user?.id
      });
      
      // 验证模型兼容性
      const validationResult = await this.modelService.validateModelCompatibility(
        model,
        messages,
        options
      );
      
      logger.info('Model validation completed', {
        model,
        valid: validationResult.isValid
      });
      
      return response.success(
        res,
        validationResult,
        'Model validation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Model validation failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取所有支持的功能特性
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getSupportedFeatures(req, res, next) {
    try {
      logger.info('Get supported features requested');
      
      // 获取支持的功能特性
      const features = this.modelService.getSupportedFeatures();
      
      logger.info('Supported features retrieved successfully');
      
      return response.success(
        res,
        features,
        'Supported features retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve supported features', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 验证上下文窗口大小
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async validateContextWindow(req, res, next) {
    try {
      const { modelId } = req.params;
      const { messages: messagesStr } = req.query;
      
      logger.info(`Validate context window for model ${modelId}`);
      
      // 解析消息（如果提供）
      let messages = [];
      if (messagesStr) {
        try {
          messages = JSON.parse(messagesStr);
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
      const contextInfo = await this.modelService.validateContextWindow(
        modelId,
        messages
      );
      
      logger.info(`Context window validation completed for model ${modelId}`, {
        withinLimit: contextInfo.withinLimit
      });
      
      return response.success(
        res,
        contextInfo,
        'Context window validation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error(`Context window validation failed for model ${req.params.modelId}`, {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取模型使用统计
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getModelUsageStats(req, res, next) {
    try {
      // 获取时间范围
      const { startDate, endDate } = req.query;
      
      logger.info('Get model usage statistics requested', {
        startDate,
        endDate,
        userId: req.user?.id
      });
      
      // 获取使用统计
      const stats = await this.modelService.getModelUsageStats(startDate, endDate);
      
      logger.info('Model usage statistics retrieved successfully');
      
      return response.success(
        res,
        stats,
        'Model usage statistics retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve model usage statistics', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 刷新模型缓存
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async refreshModelCache(req, res, next) {
    try {
      logger.info('Refresh models cache requested', {
        userId: req.user?.id
      });
      
      // 刷新模型缓存
      await this.modelService.clearModelCache();
      
      logger.info('Models cache refreshed successfully');
      
      return response.success(
        res,
        { refreshed: true },
        'Models cache refreshed successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to refresh models cache', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export default new ModelController();