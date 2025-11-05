// backend/middlewares/rateLimiter.js - 速率限制中间件
import rateLimit from 'express-rate-limit';
import { getRateLimitConfig } from '../config/config.js';
import logger from '../utils/logger.js';
import response from '../utils/response.js';

const rateLimitConfig = getRateLimitConfig();

// 创建内存存储的速率限制器
const createRateLimiter = (options = {}) => {
  const { 
    windowMs = rateLimitConfig.windowMs, 
    max = rateLimitConfig.maxRequests,
    message = 'Too many requests, please try again later',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    keyGenerator = (req) => {
      // 使用IP地址作为限流键，也可以根据需要使用其他标识
      return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      statusCode: 429,
      message,
      data: null,
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    keyGenerator,
    
    // 处理限流触发事件
    handler: (req, res, options) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      logger.warn(`Rate limit exceeded for IP: ${ip}`, {
        path: req.path,
        method: req.method,
        ip,
        windowMs: options.windowMs,
        max: options.max
      });
      
      return response.error(
        res,
        options.message.message,
        429,
        options.message.error
      );
    },
    
    // 记录请求
    onLimitReached: (req, res, options) => {
      logger.warn('Rate limit reached', { path: req.path, ip: req.ip });
    }
  });
};

// 全局API速率限制器
const apiRateLimiter = createRateLimiter();

// 认证API速率限制器（更严格）
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5 // 每分钟最多5次请求
});

// 聊天API速率限制器
const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30 // 每分钟最多30次请求
});

// 模型API速率限制器（根据不同模型设置不同限制）
const modelRateLimiter = (modelType) => {
  const modelLimits = {
    'gpt-3.5': {
      windowMs: 60 * 1000,
      max: 20
    },
    'gpt-4': {
      windowMs: 60 * 1000,
      max: 10
    },
    'default': {
      windowMs: 60 * 1000,
      max: 15
    }
  };

  const limitConfig = modelLimits[modelType] || modelLimits.default;
  
  return createRateLimiter({
    ...limitConfig,
    keyGenerator: (req) => {
      // 使用IP和模型类型组合作为键
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      return `${ip}:${modelType}`;
    }
  });
};

export { 
  apiRateLimiter, 
  authRateLimiter, 
  chatRateLimiter, 
  modelRateLimiter,
  createRateLimiter
};

export default apiRateLimiter;