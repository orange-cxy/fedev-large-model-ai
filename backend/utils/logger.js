// backend/utils/logger.js - 日志工具模块
import { getLoggerConfig, getServerConfig } from '../config/config.js';

const loggerConfig = getLoggerConfig();
const serverConfig = getServerConfig();

// 日志级别常量
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// 获取当前日志级别
const currentLevel = LOG_LEVELS[loggerConfig.level.toUpperCase()] || LOG_LEVELS.INFO;

// 格式化时间戳
const formatTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
};

// 格式化日志消息
const formatMessage = (level, message, metadata = {}) => {
  const timestamp = formatTimestamp();
  const levelStr = level.padEnd(5).toUpperCase();
  const metadataStr = Object.keys(metadata).length > 0 ? 
    ` | ${JSON.stringify(metadata)}` : '';
  
  return `[${timestamp}] [${levelStr}] ${message}${metadataStr}`;
};

// 日志记录函数
const log = (level, message, metadata = {}) => {
  const levelNum = LOG_LEVELS[level.toUpperCase()];
  
  if (levelNum >= currentLevel) {
    const formattedMessage = formatMessage(level, message, metadata);
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
};

// 日志器对象
const logger = {
  debug: (message, metadata = {}) => log('debug', message, metadata),
  info: (message, metadata = {}) => log('info', message, metadata),
  warn: (message, metadata = {}) => log('warn', message, metadata),
  error: (message, metadata = {}) => log('error', message, metadata),
  fatal: (message, metadata = {}) => log('fatal', message, metadata),
  
  // 记录请求日志
  logRequest: (req, res, next) => {
    if (serverConfig.isDevelopment) {
      const startTime = Date.now();
      const originalSend = res.send;
      
      // 重写res.send方法以捕获响应信息
      res.send = function(body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const statusCode = res.statusCode;
        
        logger.info(`Request: ${req.method} ${req.originalUrl}`, {
          statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
        
        return originalSend.call(this, body);
      };
    }
    next();
  },
  
  // 记录错误日志
  logError: (error, req = null, res = null, next = null) => {
    const errorData = {
      message: error.message,
      stack: error.stack
    };
    
    if (req) {
      errorData.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      };
    }
    
    if (error.code) {
      errorData.code = error.code;
    }
    
    if (error.status) {
      errorData.status = error.status;
    }
    
    logger.error('Error occurred', errorData);
    
    if (next) {
      next(error);
    }
  }
};

export default logger;