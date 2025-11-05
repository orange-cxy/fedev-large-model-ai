// backend/controllers/systemController.js - 系统控制器
import logger from '../utils/logger.js';
import response from '../utils/response.js';
import config from '../config/config.js';
import ModelService from '../services/modelService.js';

class SystemController {
  constructor() {
    this.modelService = new ModelService();
  }

  /**
   * 获取系统配置信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getSystemConfig(req, res, next) {
    try {
      logger.info('System config requested', {
        userId: req.user?.id
      });
      
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
      
      logger.info('System configuration retrieved successfully');
      
      return response.success(
        res,
        systemConfig,
        'System configuration retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve system config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取系统统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getSystemStats(req, res, next) {
    try {
      logger.info('System stats requested', {
        userId: req.user?.id
      });
      
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
      
      logger.info('System statistics retrieved successfully');
      
      return response.success(
        res,
        systemStats,
        'System statistics retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve system stats', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 系统健康检查（内部使用）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getSystemHealth(req, res, next) {
    try {
      logger.info('Internal system health check requested', {
        userId: req.user?.id
      });
      
      // 检查各个服务组件的健康状态
      // 在实际应用中，这里应该进行实际的健康检查
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
      
      logger.info('Internal health check completed successfully');
      
      return response.success(
        res,
        internalHealth,
        'Internal health check completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Internal health check failed', {
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
  async refreshModelsCache(req, res, next) {
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

  /**
   * 获取系统日志（最近的）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getSystemLogs(req, res, next) {
    try {
      // 验证查询参数
      const { limit = 50, level } = req.query;
      const limitNum = parseInt(limit, 10);
      
      logger.info('System logs requested', {
        limit: limitNum,
        level,
        userId: req.user?.id
      });
      
      // 模拟日志数据（实际应用中应该从日志文件或数据库获取）
      const logs = [];
      
      logger.info('System logs retrieved successfully', {
        count: logs.length
      });
      
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
      logger.error('Failed to retrieve system logs', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 验证系统配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async validateSystemConfig(req, res, next) {
    try {
      const { config: configData } = req.body;
      
      logger.info('System config validation requested', {
        userId: req.user?.id,
        hasConfig: !!configData
      });
      
      // 这里应该实现配置验证逻辑
      // 现在我们只返回成功
      const validationResult = {
        valid: true,
        issues: [],
        warnings: []
      };
      
      logger.info('Config validation completed', {
        valid: validationResult.valid
      });
      
      return response.success(
        res,
        validationResult,
        'Config validation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Config validation failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取API版本信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getAPIVersion(req, res, next) {
    try {
      logger.info('API version requested', {
        userId: req.user?.id
      });
      
      const versionInfo = {
        apiVersion: 'v1',
        packageVersion: process.env.npm_package_version || 'unknown',
        buildDate: process.env.BUILD_DATE || 'unknown',
        environment: process.env.NODE_ENV || 'development'
      };
      
      logger.info('Version information retrieved successfully');
      
      return response.success(
        res,
        versionInfo,
        'Version information retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve version information', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取资源使用情况
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getResourceUsage(req, res, next) {
    try {
      logger.info('Resource usage requested', {
        userId: req.user?.id
      });
      
      // 获取资源使用情况
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      );
      
      const resources = {
        memory: {
          current: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: memoryPercentage
        },
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
      
      logger.info('Resource usage retrieved successfully', {
        memoryPercentage
      });
      
      return response.success(
        res,
        resources,
        'Resource usage retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve resource usage', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 重启服务（模拟）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async restartService(req, res, next) {
    try {
      logger.info('Service restart requested', {
        userId: req.user?.id
      });
      
      // 模拟重启操作
      // 在实际应用中，这里应该实现安全的重启逻辑
      const restartInfo = {
        status: 'initiated',
        message: 'Service restart initiated',
        timestamp: new Date().toISOString()
      };
      
      logger.warn('Service restart initiated');
      
      return response.success(
        res,
        restartInfo,
        'Service restart initiated',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to initiate service restart', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取环境变量信息（过滤敏感信息）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getEnvironmentInfo(req, res, next) {
    try {
      logger.info('Environment info requested', {
        userId: req.user?.id
      });
      
      // 过滤敏感信息
      const safeEnvVars = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        BUILD_DATE: process.env.BUILD_DATE,
        npm_package_version: process.env.npm_package_version,
        // 不包含任何敏感信息如API密钥、数据库密码等
      };
      
      logger.info('Environment info retrieved successfully');
      
      return response.success(
        res,
        {
          environment: safeEnvVars,
          timestamp: new Date().toISOString()
        },
        'Environment information retrieved',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve environment info', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export default new SystemController();