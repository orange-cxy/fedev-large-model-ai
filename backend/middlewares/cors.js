// backend/middlewares/cors.js - CORS中间件
import cors from 'cors';
import { getCorsConfig } from '../config/config.js';
import logger from '../utils/logger.js';

const corsConfig = getCorsConfig();

// CORS配置
const corsOptions = {
  origin: (origin, callback) => {
    // 允许所有来源在开发环境
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 在生产环境中检查允许的来源
    if (corsConfig.allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // 允许的HTTP方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  // 允许的请求头
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'Access-Control-Allow-Origin'
  ],
  
  // 允许凭证
  credentials: true,
  
  // 预检请求的缓存时间
  maxAge: 86400, // 24小时
  
  // 暴露的响应头
  exposedHeaders: ['Content-Length', 'X-Request-Id']
};

// 创建CORS中间件实例
const corsMiddleware = cors(corsOptions);

// 预检请求处理
const preflightMiddleware = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    logger.info('Preflight request received', { path: req.path, origin: req.headers.origin });
    return res.status(204).end();
  }
  next();
};

export { corsMiddleware, preflightMiddleware };
export default corsMiddleware;