// backend/server.js - 服务器入口文件
import express from 'express';
import dotenv from 'dotenv';
import cors from './middlewares/cors.js';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import security from './middlewares/security.js';
import router from './routes/index.js';
import logger from './utils/logger.js';
import config from './config/config.js';

// 加载环境变量
dotenv.config();

// 创建Express应用实例
const app = express();

// 中间件配置
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 使用安全中间件
app.use(security);

// 使用CORS中间件
app.use(cors);

// 使用请求日志中间件
app.use(requestLogger);

// 注册API路由
app.use('/api', router);

// 根路径处理
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Large Model AI API',
    version: process.env.npm_package_version || 'unknown',
    status: 'running',
    docs: '/api/docs'
  });
});

// 404处理
app.use('*', (req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = config.server.port || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.server.environment} mode`, {
    port: PORT,
    host: config.server.host
  });
});

// 优雅关闭处理
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // 关闭服务器
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // 设置超时，强制关闭
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// 监听系统信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// 监听未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack
  });
  process.exit(1);
});

export default app;