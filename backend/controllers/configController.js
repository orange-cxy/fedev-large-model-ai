// backend/controllers/configController.js - 配置控制器
import logger from '../utils/logger.js';
import response from '../utils/response.js';
import configManager from '../services/configManager.js';
import { CustomError } from '../utils/error.js';

class ConfigController {
  /**
   * 获取当前配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getCurrentConfig(req, res, next) {
    try {
      logger.info('Get current config requested', {
        userId: req.user?.id
      });

      const config = configManager.exportConfig();
      
      // 过滤敏感信息
      const safeConfig = {
        ...config,
        current: {
          ...config.current
        }
      };
      
      // 删除敏感配置项
      delete safeConfig.current.API_KEY_SECRET;
      delete safeConfig.current.JWT_SECRET;
      delete safeConfig.current.AI_MODEL_API_KEY;
      
      // 从历史记录中删除敏感信息
      safeConfig.history = safeConfig.history.map(historyItem => ({
        ...historyItem,
        config: {
          ...historyItem.config
        }
      }));
      
      safeConfig.history.forEach(historyItem => {
        delete historyItem.config.API_KEY_SECRET;
        delete historyItem.config.JWT_SECRET;
        delete historyItem.config.AI_MODEL_API_KEY;
      });

      logger.info('Current config retrieved successfully');
      
      return response.success(
        res,
        safeConfig,
        'Configuration retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve current config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 更新配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async updateConfig(req, res, next) {
    try {
      const { config: configUpdates } = req.body;
      
      if (!configUpdates || typeof configUpdates !== 'object') {
        throw new CustomError('Invalid config data', 400);
      }

      logger.info('Config update requested', {
        userId: req.user?.id,
        updatedKeys: Object.keys(configUpdates)
      });

      // 执行配置更新
      configManager.updateConfig(configUpdates);
      
      // 获取更新后的配置（过滤敏感信息）
      const updatedConfig = configManager.exportConfig();
      delete updatedConfig.current.API_KEY_SECRET;
      delete updatedConfig.current.JWT_SECRET;
      delete updatedConfig.current.AI_MODEL_API_KEY;

      logger.info('Config updated successfully', {
        updatedKeys: Object.keys(configUpdates)
      });
      
      return response.success(
        res,
        {
          config: updatedConfig.current,
          updatedAt: new Date().toISOString(),
          updatedKeys: Object.keys(configUpdates)
        },
        'Configuration updated successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to update config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 验证配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async validateConfig(req, res, next) {
    try {
      const { config: configData } = req.body;
      
      if (!configData || typeof configData !== 'object') {
        throw new CustomError('Invalid config data', 400);
      }

      logger.info('Config validation requested', {
        userId: req.user?.id,
        keysCount: Object.keys(configData).length
      });

      // 执行配置验证
      const validationResult = configManager.validateConfig(configData);

      logger.info('Config validation completed', {
        valid: validationResult.valid
      });
      
      return response.success(
        res,
        {
          valid: validationResult.valid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          timestamp: new Date().toISOString()
        },
        'Configuration validation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to validate config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 重新加载配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async reloadConfig(req, res, next) {
    try {
      logger.info('Config reload requested', {
        userId: req.user?.id
      });

      // 重新加载配置
      const reloadedConfig = configManager.reloadConfig();
      
      // 过滤敏感信息
      const safeConfig = { ...reloadedConfig };
      delete safeConfig.API_KEY_SECRET;
      delete safeConfig.JWT_SECRET;
      delete safeConfig.AI_MODEL_API_KEY;

      logger.info('Config reloaded successfully');
      
      return response.success(
        res,
        {
          config: safeConfig,
          reloadedAt: new Date().toISOString(),
          status: 'success'
        },
        'Configuration reloaded successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to reload config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取配置历史
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getConfigHistory(req, res, next) {
    try {
      logger.info('Config history requested', {
        userId: req.user?.id
      });

      // 获取配置历史
      const history = configManager.getConfigHistory();
      
      // 过滤敏感信息
      const safeHistory = history.map(item => ({
        ...item,
        config: { ...item.config }
      }));
      
      safeHistory.forEach(item => {
        delete item.config.API_KEY_SECRET;
        delete item.config.JWT_SECRET;
        delete item.config.AI_MODEL_API_KEY;
      });

      logger.info('Config history retrieved successfully', {
        historyLength: history.length
      });
      
      return response.success(
        res,
        {
          history: safeHistory,
          total: history.length
        },
        'Configuration history retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve config history', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 恢复到指定版本
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async revertConfig(req, res, next) {
    try {
      const { version } = req.params;
      const versionIndex = parseInt(version, 10);
      
      if (isNaN(versionIndex)) {
        throw new CustomError('Invalid version index', 400);
      }

      logger.info('Config revert requested', {
        userId: req.user?.id,
        versionIndex
      });

      // 恢复到指定版本
      configManager.revertToVersion(versionIndex);
      
      // 获取恢复后的配置（过滤敏感信息）
      const restoredConfig = configManager.exportConfig();
      delete restoredConfig.current.API_KEY_SECRET;
      delete restoredConfig.current.JWT_SECRET;
      delete restoredConfig.current.AI_MODEL_API_KEY;

      logger.info('Config reverted successfully', {
        versionIndex
      });
      
      return response.success(
        res,
        {
          config: restoredConfig.current,
          revertedTo: versionIndex,
          revertedAt: new Date().toISOString()
        },
        'Configuration reverted successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to revert config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 导入配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async importConfig(req, res, next) {
    try {
      const { config: importedConfig } = req.body;
      
      if (!importedConfig || typeof importedConfig !== 'object') {
        throw new CustomError('Invalid config data', 400);
      }

      logger.info('Config import requested', {
        userId: req.user?.id,
        keysCount: Object.keys(importedConfig).length
      });

      // 导入配置
      configManager.importConfig(importedConfig);
      
      // 获取导入后的配置（过滤敏感信息）
      const updatedConfig = configManager.exportConfig();
      delete updatedConfig.current.API_KEY_SECRET;
      delete updatedConfig.current.JWT_SECRET;
      delete updatedConfig.current.AI_MODEL_API_KEY;

      logger.info('Config imported successfully');
      
      return response.success(
        res,
        {
          config: updatedConfig.current,
          importedAt: new Date().toISOString(),
          status: 'success'
        },
        'Configuration imported successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to import config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 导出完整配置
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async exportConfig(req, res, next) {
    try {
      logger.info('Config export requested', {
        userId: req.user?.id
      });

      // 导出配置
      const fullConfig = configManager.exportConfig();
      
      // 过滤敏感信息
      const safeConfig = {
        ...fullConfig,
        current: { ...fullConfig.current }
      };
      
      delete safeConfig.current.API_KEY_SECRET;
      delete safeConfig.current.JWT_SECRET;
      delete safeConfig.current.AI_MODEL_API_KEY;
      
      // 从历史记录中过滤敏感信息
      safeConfig.history = safeConfig.history.map(item => ({
        ...item,
        config: { ...item.config }
      }));
      
      safeConfig.history.forEach(item => {
        delete item.config.API_KEY_SECRET;
        delete item.config.JWT_SECRET;
        delete item.config.AI_MODEL_API_KEY;
      });

      logger.info('Config exported successfully');
      
      // 设置响应头，使浏览器下载文件
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=config_export_${new Date().toISOString().split('T')[0]}.json`
      );
      res.setHeader('Content-Type', 'application/json');
      
      return res.json(safeConfig);
    } catch (error) {
      logger.error('Failed to export config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取配置模式
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getConfigSchema(req, res, next) {
    try {
      logger.info('Config schema requested', {
        userId: req.user?.id
      });

      const schema = configManager.getConfigSchema();

      logger.info('Config schema retrieved successfully');
      
      return response.success(
        res,
        {
          schema,
          description: 'Configuration schema for validation',
          version: '1.0'
        },
        'Configuration schema retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve config schema', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 重置配置为默认值
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async resetConfig(req, res, next) {
    try {
      logger.info('Config reset requested', {
        userId: req.user?.id
      });

      // 获取默认配置
      const defaultConfig = configManager.loadDefaultConfig();
      
      // 保存默认配置
      configManager.saveConfig(defaultConfig);
      
      // 获取重置后的配置（过滤敏感信息）
      const resetConfig = configManager.exportConfig();
      delete resetConfig.current.API_KEY_SECRET;
      delete resetConfig.current.JWT_SECRET;
      delete resetConfig.current.AI_MODEL_API_KEY;

      logger.info('Config reset to defaults successfully');
      
      return response.success(
        res,
        {
          config: resetConfig.current,
          resetAt: new Date().toISOString(),
          status: 'success'
        },
        'Configuration reset to defaults successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to reset config', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export default new ConfigController();