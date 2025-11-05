// backend/middlewares/requestLogger.js - 请求日志中间件
import logger from '../utils/logger.js';

// 请求日志中间件
const requestLogger = (req, res, next) => {
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 生成请求ID
  const requestId = generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  
  // 记录请求信息，但不记录敏感数据
  const logData = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    headers: {}
  };
  
  // 安全地记录部分请求头
  const safeHeaders = ['content-type', 'accept', 'x-api-version'];
  safeHeaders.forEach(header => {
    if (req.headers[header]) {
      logData.headers[header] = req.headers[header];
    }
  });
  
  // 记录请求开始
  logger.info('Request started', logData);
  
  // 重写响应的end方法以记录响应信息
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // 记录响应时间
    const responseTime = Date.now() - startTime;
    
    // 构建响应日志数据
    const responseLogData = {
      requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.getHeader('content-length') || 0
    };
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('Request failed', { ...responseLogData, ...logData });
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with error', { ...responseLogData, ...logData });
    } else if (res.statusCode >= 200) {
      logger.info('Request completed', { ...responseLogData, ...logData });
    }
    
    // 调用原始的end方法
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// 生成请求ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  if (err) {
    const errorData = {
      requestId: req.requestId || 'unknown',
      method: req.method,
      path: req.path,
      ip: req.ip,
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500
    };
    
    // 记录详细的错误信息
    logger.error('Error occurred during request', errorData);
  }
  next(err);
};

// 忽略路径的日志中间件
const selectiveLogger = (options = {}) => {
  const { ignorePaths = [] } = options;
  
  return (req, res, next) => {
    // 检查是否需要忽略此路径的日志
    const shouldIgnore = ignorePaths.some(path => 
      req.path.startsWith(path) || req.path === path
    );
    
    if (shouldIgnore) {
      return next();
    }
    
    // 否则使用标准请求日志
    requestLogger(req, res, next);
  };
};

export { requestLogger, errorLogger, selectiveLogger };
export default requestLogger;