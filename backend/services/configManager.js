// backend/services/configManager.js - 配置管理服务
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import { CustomError } from '../utils/error.js';
import config from '../config/config.js';

class ConfigManager {
  constructor() {
    this.configPath = path.resolve(process.cwd(), 'backend', '.env');
    this.defaultConfigPath = path.resolve(process.cwd(), 'backend', '.env.example');
    this.inMemoryConfig = { ...config };
    this.configHistory = [];
    this.schema = this.getConfigSchema();
  }

  /**
   * 获取配置验证模式
   * @returns {Object} 配置验证模式
   */
  getConfigSchema() {
    return {
      PORT: { type: 'number', required: true, min: 1024, max: 65535 },
      NODE_ENV: { type: 'string', required: true, enum: ['development', 'production', 'test'] },
      API_KEY_SECRET: { type: 'string', required: true, minLength: 8 },
      ALLOWED_ORIGINS: { type: 'string', required: true },
      RATE_LIMIT_WINDOW_MS: { type: 'string', required: false },
      RATE_LIMIT_MAX: { type: 'number', required: true, min: 1 },
      LOG_LEVEL: { type: 'string', required: true, enum: ['error', 'warn', 'info', 'debug', 'verbose'] },
      AI_MODEL_API_URL: { type: 'string', required: true },
      AI_MODEL_API_KEY: { type: 'string', required: true },
      AI_MODEL_TIMEOUT: { type: 'number', required: true, min: 1000 },
      CACHE_ENABLED: { type: 'boolean', required: false },
      CACHE_TTL: { type: 'number', required: true, min: 1000 },
      JWT_SECRET: { type: 'string', required: true, minLength: 8 },
      JWT_EXPIRES_IN: { type: 'string', required: true },
      METRICS_ENABLED: { type: 'boolean', required: false },
      METRICS_PORT: { type: 'number', required: false, min: 1024, max: 65535 }
    };
  }

  /**
   * 验证配置
   * @param {Object} configData - 要验证的配置数据
   * @returns {Object} 验证结果
   */
  validateConfig(configData) {
    const errors = [];
    const warnings = [];

    // 验证必需的配置项
    for (const [key, definition] of Object.entries(this.schema)) {
      const value = configData[key];
      
      // 检查必需项
      if (definition.required && (value === undefined || value === null || value === '')) {
        errors.push(`Missing required configuration: ${key}`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        // 根据类型验证
        switch (definition.type) {
          case 'number': {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push(`${key} must be a number`);
            } else if (definition.min !== undefined && numValue < definition.min) {
              errors.push(`${key} must be at least ${definition.min}`);
            } else if (definition.max !== undefined && numValue > definition.max) {
              errors.push(`${key} must be at most ${definition.max}`);
            }
            break;
          }
          case 'string':
            if (definition.minLength && String(value).length < definition.minLength) {
              errors.push(`${key} must be at least ${definition.minLength} characters`);
            }
            if (definition.enum && !definition.enum.includes(String(value))) {
              errors.push(`${key} must be one of: ${definition.enum.join(', ')}`);
            }
            break;
          case 'boolean':
            const boolValue = String(value).toLowerCase();
            if (!['true', 'false', '1', '0'].includes(boolValue)) {
              errors.push(`${key} must be a boolean value (true/false)`);
            }
            break;
          default:
            break;
        }
      }
    }

    // 检查额外的配置项
    const knownKeys = new Set(Object.keys(this.schema));
    for (const key of Object.keys(configData)) {
      if (!knownKeys.has(key)) {
        warnings.push(`Unknown configuration key: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 读取配置文件
   * @returns {Object} 配置对象
   */
  readConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        logger.warn('Config file not found, using default config');
        return this.loadDefaultConfig();
      }

      const data = fs.readFileSync(this.configPath, 'utf8');
      const configObject = {};
      
      data.split('\n').forEach(line => {
        // 忽略注释和空行
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...values] = line.split('=');
          if (key) {
            configObject[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
          }
        }
      });

      logger.info('Configuration loaded from file');
      return configObject;
    } catch (error) {
      logger.error('Failed to read config file', {
        error: error.message,
        stack: error.stack
      });
      throw new CustomError('Failed to read configuration file', 500);
    }
  }

  /**
   * 加载默认配置
   * @returns {Object} 默认配置
   */
  loadDefaultConfig() {
    try {
      if (fs.existsSync(this.defaultConfigPath)) {
        const data = fs.readFileSync(this.defaultConfigPath, 'utf8');
        const configObject = {};
        
        data.split('\n').forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key, ...values] = line.split('=');
            if (key) {
              configObject[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
            }
          }
        });
        
        logger.info('Default configuration loaded');
        return configObject;
      }
      
      logger.warn('Default config file not found, using environment variables');
      return { ...process.env };
    } catch (error) {
      logger.error('Failed to load default config', {
        error: error.message
      });
      return { ...process.env };
    }
  }

  /**
   * 保存配置到文件
   * @param {Object} configData - 要保存的配置数据
   */
  saveConfig(configData) {
    try {
      // 验证配置
      const validation = this.validateConfig(configData);
      if (!validation.valid) {
        throw new CustomError('Invalid configuration', 400, {
          errors: validation.errors
        });
      }

      // 生成配置文件内容
      let content = '';
      for (const [key, value] of Object.entries(configData)) {
        content += `${key}=${value}\n`;
      }

      // 备份当前配置
      this.backupConfig();

      // 保存配置
      fs.writeFileSync(this.configPath, content, 'utf8');
      
      // 更新内存配置
      this.inMemoryConfig = { ...this.inMemoryConfig, ...configData };
      
      // 记录历史
      this.configHistory.push({
        timestamp: new Date().toISOString(),
        config: { ...configData }
      });
      
      // 限制历史记录数量
      if (this.configHistory.length > 10) {
        this.configHistory.shift();
      }

      logger.info('Configuration saved successfully');
    } catch (error) {
      logger.error('Failed to save config', {
        error: error.message,
        stack: error.stack
      });
      throw new CustomError('Failed to save configuration', 500);
    }
  }

  /**
   * 备份当前配置
   */
  backupConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const backupPath = `${this.configPath}.bak`;
        fs.copyFileSync(this.configPath, backupPath);
        logger.info('Configuration backed up', { backupPath });
      }
    } catch (error) {
      logger.warn('Failed to backup config', {
        error: error.message
      });
    }
  }

  /**
   * 更新配置（部分更新）
   * @param {Object} updates - 要更新的配置项
   */
  updateConfig(updates) {
    const currentConfig = this.readConfig();
    const newConfig = { ...currentConfig, ...updates };
    this.saveConfig(newConfig);
  }

  /**
   * 重新加载配置
   */
  reloadConfig() {
    try {
      const newConfig = this.readConfig();
      this.inMemoryConfig = { ...newConfig };
      logger.info('Configuration reloaded');
      return newConfig;
    } catch (error) {
      logger.error('Failed to reload config', {
        error: error.message
      });
      throw new CustomError('Failed to reload configuration', 500);
    }
  }

  /**
   * 获取配置历史
   * @returns {Array} 配置历史记录
   */
  getConfigHistory() {
    return this.configHistory;
  }

  /**
   * 恢复到指定的配置版本
   * @param {number} index - 历史记录索引
   */
  revertToVersion(index) {
    if (index < 0 || index >= this.configHistory.length) {
      throw new CustomError('Invalid version index', 400);
    }

    const historicalConfig = this.configHistory[index];
    this.saveConfig(historicalConfig.config);
    logger.info('Reverted to historical configuration', {
      version: index,
      timestamp: historicalConfig.timestamp
    });
  }

  /**
   * 导出配置
   * @returns {Object} 完整配置对象
   */
  exportConfig() {
    return {
      current: { ...this.inMemoryConfig },
      environment: process.env.NODE_ENV,
      lastUpdated: new Date().toISOString(),
      history: this.getConfigHistory()
    };
  }

  /**
   * 导入配置
   * @param {Object} importedConfig - 导入的配置
   */
  importConfig(importedConfig) {
    // 过滤掉系统特定的配置项
    const filteredConfig = {};
    const allowedKeys = Object.keys(this.schema);
    
    for (const [key, value] of Object.entries(importedConfig)) {
      if (allowedKeys.includes(key)) {
        filteredConfig[key] = value;
      }
    }

    this.saveConfig(filteredConfig);
  }

  /**
   * 获取配置项
   * @param {string} key - 配置键
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(key, defaultValue = undefined) {
    return this.inMemoryConfig[key] ?? defaultValue;
  }

  /**
   * 设置配置项（内存中）
   * @param {string} key - 配置键
   * @param {*} value - 配置值
   */
  set(key, value) {
    this.inMemoryConfig[key] = value;
  }

  /**
   * 检查配置是否可用
   * @returns {boolean} 配置可用性
   */
  isConfigAvailable() {
    try {
      return Object.keys(this.inMemoryConfig).length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取配置差异
   * @param {Object} config1 - 配置1
   * @param {Object} config2 - 配置2
   * @returns {Object} 差异对象
   */
  getConfigDiff(config1, config2) {
    const diff = {
      added: {},
      modified: {},
      removed: []
    };

    // 检查修改和删除的项
    for (const [key, value] of Object.entries(config1)) {
      if (!config2.hasOwnProperty(key)) {
        diff.removed.push(key);
      } else if (config2[key] !== value) {
        diff.modified[key] = { old: value, new: config2[key] };
      }
    }

    // 检查新增的项
    for (const [key, value] of Object.entries(config2)) {
      if (!config1.hasOwnProperty(key)) {
        diff.added[key] = value;
      }
    }

    return diff;
  }
}

// 导出单例实例
const configManager = new ConfigManager();
export default configManager;