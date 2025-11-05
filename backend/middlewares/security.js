// backend/middlewares/security.js - 安全中间件
import helmet from 'helmet';
import { getSecurityConfig } from '../config/config.js';
import logger from '../utils/logger.js';
import { BadRequestError } from '../utils/error.js';

const securityConfig = getSecurityConfig();

// Helmet安全配置
const helmetConfig = {
  // 启用所有默认的Helmet保护
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", ...securityConfig.allowedOrigins]
    }
  },
  
  // 禁用X-Powered-By头
  hidePoweredBy: true,
  
  // 防止点击劫持
  frameguard: {
    action: 'deny'
  },
  
  // 防止MIME类型嗅探
  noSniff: true,
  
  // 强制HTTPS（在生产环境）
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true
  } : false,
  
  // 阻止IE从站点下载文件
  ieNoOpen: true,
  
  // 启用XSS保护
  xssFilter: true
};

// 安全头部中间件
const securityHeaders = helmet(helmetConfig);

// 请求验证中间件
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // 验证请求体、查询参数或路径参数
      const { error, value } = schema.validate(
        { ...req.body, ...req.query, ...req.params },
        { abortEarly: false }
      );
      
      if (error) {
        logger.warn('Request validation failed', {
          errors: error.details,
          path: req.path,
          method: req.method
        });
        
        // 格式化验证错误
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        throw new BadRequestError('Validation failed', 'VALIDATION_ERROR', validationErrors);
      }
      
      // 将验证后的数据合并回请求对象
      req.validatedData = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// API密钥验证中间件
const apiKeyAuth = (req, res, next) => {
  if (!securityConfig.requireApiKey) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    logger.warn('API key missing', { path: req.path, method: req.method });
    return res.status(401).json({
      success: false,
      message: 'API key required',
      error: 'MISSING_API_KEY'
    });
  }
  
  if (apiKey !== securityConfig.apiKeys[0]) {
    logger.warn('Invalid API key', { path: req.path, method: req.method });
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      error: 'INVALID_API_KEY'
    });
  }
  
  logger.info('API key validated', { path: req.path, method: req.method });
  next();
};

// 防XSS中间件
const sanitizeInput = (req, res, next) => {
  // 简单的输入清理示例
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // 替换潜在的危险字符
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  // 清理请求体
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  // 清理查询参数
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  next();
};

// 资源访问控制中间件
const resourceAccessControl = (requiredPermission) => {
  return (req, res, next) => {
    // 这里可以实现更复杂的权限检查逻辑
    // 目前仅作为示例实现
    
    const userPermissions = req.user?.permissions || [];
    
    if (userPermissions.includes(requiredPermission) || 
        userPermissions.includes('ADMIN') || 
        !requiredPermission) {
      return next();
    }
    
    logger.warn('Permission denied', {
      path: req.path,
      method: req.method,
      requiredPermission,
      userPermissions
    });
    
    return res.status(403).json({
      success: false,
      message: 'Permission denied',
      error: 'PERMISSION_DENIED'
    });
  };
};

export {
  securityHeaders,
  validateRequest,
  apiKeyAuth,
  sanitizeInput,
  resourceAccessControl
};

export default securityHeaders;