// backend/utils/helpers.js - 通用工具函数
import crypto from 'crypto';
import logger from './logger.js';

/**
 * 生成唯一ID
 * @param {number} length - ID长度
 * @returns {string} 唯一ID
 */
export const generateId = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * 生成请求ID
 * @returns {string} 请求ID
 */
export const generateRequestId = () => {
  return `req_${crypto.randomUUID()}`;
};

/**
 * 格式化时间戳
 * @param {number|Date} timestamp - 时间戳
 * @returns {string} 格式化的时间字符串
 */
export const formatTimestamp = (timestamp) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toISOString();
};

/**
 * 验证API密钥格式
 * @param {string} apiKey - API密钥
 * @returns {boolean} 是否有效
 */
export const validateApiKeyFormat = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  // 简单的API密钥格式验证：至少32字符，只包含字母数字和特定符号
  const apiKeyRegex = /^[A-Za-z0-9-_]{32,}$/;
  return apiKeyRegex.test(apiKey);
};

/**
 * 加密敏感数据
 * @param {string} data - 要加密的数据
 * @param {string} secret - 加密密钥
 * @returns {string} 加密后的数据
 */
export const encryptSensitiveData = (data, secret) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    logger.error('Failed to encrypt sensitive data', { error: error.message });
    throw new Error('Encryption failed');
  }
};

/**
 * 解密敏感数据
 * @param {string} encryptedData - 加密的数据
 * @param {string} secret - 解密密钥
 * @returns {string} 解密后的数据
 */
export const decryptSensitiveData = (encryptedData, secret) => {
  try {
    const [ivHex, encryptedText] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedText, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    logger.error('Failed to decrypt sensitive data', { error: error.message });
    throw new Error('Decryption failed');
  }
};

/**
 * 安全比较两个字符串（防时序攻击）
 * @param {string} a - 第一个字符串
 * @param {string} b - 第二个字符串
 * @returns {boolean} 是否相等
 */
export const secureCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a),
      Buffer.from(b)
    );
  } catch (error) {
    return false;
  }
};

/**
 * 计算文本的Token数量（简单估算）
 * @param {string} text - 文本内容
 * @returns {number} Token数量
 */
export const calculateTokenCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  // 简单的Token估算：假设平均每个Token包含4个字符
  // 这是一个粗略的估算，实际使用中应该使用特定模型的Tokenizer
  const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherCharCount = text.length - chineseCharCount;
  
  // 中文每个字符算1个Token，其他字符每4个算1个Token
  return chineseCharCount + Math.ceil(otherCharCount / 4);
};

/**
 * 截断文本到指定的Token数量
 * @param {string} text - 原始文本
 * @param {number} maxTokens - 最大Token数量
 * @returns {string} 截断后的文本
 */
export const truncateTextByTokens = (text, maxTokens) => {
  if (!text || typeof text !== 'string' || maxTokens <= 0) return text;
  
  const currentTokens = calculateTokenCount(text);
  if (currentTokens <= maxTokens) return text;
  
  // 简单的截断算法，实际使用中应该使用特定模型的Tokenizer
  const ratio = maxTokens / currentTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 留一些缓冲
  
  return text.substring(0, targetLength) + '...';
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * 延迟执行函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 重试函数
 * @param {Function} fn - 要重试的函数
 * @param {number} retries - 最大重试次数
 * @param {number} delayMs - 重试间隔
 * @returns {Promise} Promise对象
 */
export const retry = async (fn, retries = 3, delayMs = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    logger.warn(`Operation failed, retrying ${retries} more times`, { error: error.message });
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs * 2); // 指数退避
  }
};

/**
 * 验证URL格式
 * @param {string} url - URL字符串
 * @returns {boolean} 是否有效
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 清理和验证用户输入
 * @param {*} input - 用户输入
 * @param {string} type - 输入类型
 * @returns {*} 清理后的输入
 */
export const sanitizeInput = (input, type = 'string') => {
  if (input === null || input === undefined) return null;
  
  switch (type) {
    case 'string':
      const sanitized = String(input).trim();
      // 移除潜在的危险字符
      return sanitized.replace(/[<>"']/g, '');
    
    case 'number':
      const num = Number(input);
      return isNaN(num) ? 0 : num;
    
    case 'boolean':
      return Boolean(input);
    
    case 'object':
      if (typeof input !== 'object') return {};
      // 递归清理对象
      const cleaned = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          cleaned[key] = sanitizeInput(input[key]);
        }
      }
      return cleaned;
    
    default:
      return String(input).trim();
  }
};

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 扩展名
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * 验证文件类型
 * @param {string} filename - 文件名
 * @param {Array} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否允许
 */
export const validateFileType = (filename, allowedTypes) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

/**
 * 计算对象大小（字节）
 * @param {Object} obj - 对象
 * @returns {number} 大小（字节）
 */
export const getObjectSize = (obj) => {
  try {
    const jsonString = JSON.stringify(obj);
    return Buffer.byteLength(jsonString, 'utf8');
  } catch (error) {
    logger.error('Failed to calculate object size', { error: error.message });
    return 0;
  }
};

/**
 * 格式化字节数
 * @param {number} bytes - 字节数
 * @returns {string} 格式化的字符串
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 合并两个对象，深度合并
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @returns {Object} 合并后的对象
 */
export const mergeObjects = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && key in result && result[key] instanceof Object) {
        result[key] = mergeObjects(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};

/**
 * 从对象中移除空值
 * @param {Object} obj - 对象
 * @returns {Object} 清理后的对象
 */
export const removeEmptyValues = (obj) => {
  const result = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleaned = removeEmptyValues(value);
          if (Object.keys(cleaned).length > 0) {
            result[key] = cleaned;
          }
        } else {
          result[key] = value;
        }
      }
    }
  }
  
  return result;
};

/**
 * 限流函数（基于令牌桶算法）
 * @param {number} rate - 每秒允许的请求数
 * @returns {Function} 限流函数
 */
export const createRateLimiter = (rate) => {
  let tokens = rate;
  let lastRefill = Date.now();
  
  return () => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillAmount = (elapsed / 1000) * rate;
    
    if (refillAmount > 0) {
      tokens = Math.min(tokens + refillAmount, rate);
      lastRefill = now;
    }
    
    if (tokens >= 1) {
      tokens--;
      return true;
    }
    
    return false;
  };
};

/**
 * 批量处理函数
 * @param {Array} items - 要处理的项目数组
 * @param {Function} processFn - 处理函数
 * @param {number} batchSize - 批次大小
 * @returns {Promise<Array>} 处理结果数组
 */
export const processBatch = async (items, processFn, batchSize = 10) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * 生成错误响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - 状态码
 * @param {Object} details - 错误详情
 * @returns {Object} 错误对象
 */
export const createErrorResponse = (message, statusCode, details = {}) => {
  return {
    error: true,
    message,
    statusCode,
    details,
    timestamp: formatTimestamp(Date.now())
  };
};

/**
 * 生成成功响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object} 成功响应对象
 */
export const createSuccessResponse = (data, message = 'Operation successful') => {
  return {
    error: false,
    message,
    data,
    timestamp: formatTimestamp(Date.now())
  };
};

/**
 * 验证请求参数
 * @param {Object} params - 请求参数
 * @param {Object} schema - 验证模式
 * @returns {Object} 验证结果
 */
export const validateParams = (params, schema) => {
  const errors = [];
  const validated = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key];
    
    // 检查必填项
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`'${key}' is required`);
      continue;
    }
    
    // 如果不是必填项且值为空，跳过验证
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // 类型验证
    if (rules.type && typeof value !== rules.type) {
      errors.push(`'${key}' must be of type ${rules.type}`);
      continue;
    }
    
    // 长度验证
    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`'${key}' must be at least ${rules.minLength} characters long`);
      continue;
    }
    
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`'${key}' must not exceed ${rules.maxLength} characters`);
      continue;
    }
    
    // 范围验证
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`'${key}' must be at least ${rules.min}`);
      continue;
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`'${key}' must not exceed ${rules.max}`);
      continue;
    }
    
    // 枚举验证
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`'${key}' must be one of: ${rules.enum.join(', ')}`);
      continue;
    }
    
    // 正则验证
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`'${key}' format is invalid`);
      continue;
    }
    
    validated[key] = value;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: validated
  };
};