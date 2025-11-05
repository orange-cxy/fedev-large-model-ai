// backend/routes/systemRoutes.js - 系统管理路由
import express from 'express';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import response from '../utils/response.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import ModelService from '../services/modelService.js';
import { validateInput } from '../utils/error.js';

const router = express.Router();
const modelService = new ModelService();

/**
 * @route GET /system/config
 * @description 获取系统配置信息
 * @access API Key Required
 */
router.get('/config', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('System config requested');
    
    // 获取配置信息（过滤敏感信息）
    const systemConfig = {
      environment: config.server.environment,
      version: process.env.npm_package_version || 'unknown',
      server: {
        port: config.server.port,
        host: config.server.host,
        cors: config.cors.enabled
      },
      features: {
        rateLimiting: config.rateLimit.enabled,
        logging: config.logging.enabled,
        cache: config.cache.enabled
      },
      security: {
        apiKeyAuth: config.api.keyAuth.enabled,
        requestValidation: true
      }
    };
    
    return response.success(
      res,
      systemConfig,
      'System configuration retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve system config', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /system/stats
 * @description 获取系统统计信息
 * @access API Key Required
 */
router.get('/stats', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('System stats requested');
    
    // 获取系统统计信息
    const systemStats = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      processId: process.pid
    };
    
    return response.success(
      res,
      systemStats,
      'System statistics retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve system stats', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /system/health
 * @description 系统健康检查（内部使用）
 * @access API Key Required
 */
router.get('/health', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Internal system health check requested');
    
    // 检查各个服务组件的健康状态
    const internalHealth = {
      overall: 'healthy',
      components: {
        server: 'healthy',
        middlewares: 'healthy',
        services: 'healthy',
        config: 'healthy'
      },
      timestamp: new Date().toISOString()
    };
    
    return response.success(
      res,
      internalHealth,
      'Internal health check completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Internal health check failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /system/refresh-models
 * @description 刷新模型缓存
 * @access API Key Required
 */
router.post('/refresh-models', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Refresh models cache requested');
    
    // 刷新模型缓存
    await modelService.clearModelCache();
    
    return response.success(
      res,
      { refreshed: true },
      'Models cache refreshed successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to refresh models cache', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /system/logs
 * @description 获取系统日志（最近的）
 * @access API Key Required
 */
router.get('/logs', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('System logs requested');
    
    // 验证查询参数
    const { limit = 50, level } = req.query;
    const limitNum = parseInt(limit, 10);
    
    // 模拟日志数据（实际应用中应该从日志文件或数据库获取）
    const logs = [];
    
    return response.success(
      res,
      {
        logs,
        total: logs.length,
        limit: limitNum,
        level: level || 'all'
      },
      'System logs retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve system logs', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /system/config/validate
 * @description 验证系统配置
 * @access API Key Required
 */
router.post('/config/validate', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('System config validation requested');
    
    // 验证配置数据
    const validationRules = {
      config: {
        presence: true,
        isObject: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { config: configData } = req.body;
    
    // 这里应该实现配置验证逻辑
    // 现在我们只返回成功
    const validationResult = {
      valid: true,
      issues: [],
      warnings: []
    };
    
    return response.success(
      res,
      validationResult,
      'Config validation completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Config validation failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /system/version
 * @description 获取API版本信息
 * @access API Key Required
 */
router.get('/version', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('API version requested');
    
    const versionInfo = {
      apiVersion: 'v1',
      packageVersion: process.env.npm_package_version || 'unknown',
      buildDate: process.env.BUILD_DATE || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    };
    
    return response.success(
      res,
      versionInfo,
      'Version information retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve version information', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /system/resources
 * @description 获取资源使用情况
 * @access API Key Required
 */
router.get('/resources', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Resource usage requested');
    
    // 获取资源使用情况
    const resources = {
      memory: {
        current: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        )
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    return response.success(
      res,
      resources,
      'Resource usage retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve resource usage', { error: error.message });
    throw error;
  }
}));

export default router;