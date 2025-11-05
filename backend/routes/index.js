// backend/routes/index.js - 主路由文件
import express from 'express';
import { 
  chatRateLimiter, 
  apiRateLimiter,
  authRateLimiter 
} from '../middlewares/rateLimiter.js';
import { apiKeyAuth } from '../middlewares/security.js';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import logger from '../utils/logger.js';

// 导入路由模块
import chatRoutes from './chatRoutes.js';
import modelRoutes from './modelRoutes.js';
import toolRoutes from './toolRoutes.js';
import healthRoutes from './healthRoutes.js';
import systemRoutes from './systemRoutes.js';
import configRoutes from './configRoutes.js';

// 创建路由器
const router = express.Router();

// API 版本前缀
const apiVersion = '/v1';

// 路由配置
const routeConfig = [
  {
    path: '/health',
    routes: healthRoutes,
    middlewares: [],
    description: 'Health check endpoints'
  },
  {
    path: '/chat',
    routes: chatRoutes,
    middlewares: [chatRateLimiter, apiKeyAuth],
    description: 'Chat API endpoints'
  },
  {
    path: '/models',
    routes: modelRoutes,
    middlewares: [apiRateLimiter],
    description: 'Model management endpoints'
  },
  {
    path: '/tools',
    routes: toolRoutes,
    middlewares: [apiRateLimiter, apiKeyAuth],
    description: 'Utility tools endpoints'
  },
  {
    path: '/system',
    routes: systemRoutes,
    middlewares: [apiKeyAuth],
    description: 'System management endpoints'
  },
  {
    path: '/config',
    routes: configRoutes,
    middlewares: [apiKeyAuth],
    description: 'Configuration management endpoints'
  }
];

// 注册路由
routeConfig.forEach(({ path, routes, middlewares, description }) => {
  logger.info(`Registering routes for ${apiVersion}${path} - ${description}`);
  
  // 应用中间件和路由
  router.use(`${apiVersion}${path}`, ...middlewares, routes);
});

// API 根路径
router.get(apiVersion, (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: 'v1',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `${apiVersion}/health`,
      chat: `${apiVersion}/chat`,
      models: `${apiVersion}/models`,
      tools: `${apiVersion}/tools`,
      system: `${apiVersion}/system`
    }
  });
});

// API 状态信息
router.get(`${apiVersion}/status`, asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
}));

// 404 处理 - 对于 API 路由
router.use(apiVersion, (req, res, next) => {
  const error = new Error(`API endpoint not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'API_ENDPOINT_NOT_FOUND';
  next(error);
});

// 导出路由器
export default router;

// 导出路由配置以便在其他地方使用
export { routeConfig };