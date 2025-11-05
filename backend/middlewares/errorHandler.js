// backend/middlewares/errorHandler.js - 错误处理中间件
import logger from '../utils/logger.js';
import response from '../utils/response.js';
import { BaseError } from '../utils/error.js';

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 确保是一个有效的错误对象
  if (!err || typeof err !== 'object') {
    err = new Error('Unknown error occurred');
  }
  
  // 请求ID用于跟踪
  const requestId = req.requestId || 'unknown';
  
  // 构建错误数据
  const errorData = {
    requestId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    errorType: err.name || 'Error',
    message: err.message,
    statusCode: err.statusCode || 500
  };
  
  // 如果是我们自定义的错误类
  if (err instanceof BaseError) {
    errorData.code = err.code;
    errorData.details = err.details;
    
    // 记录操作错误（非服务器错误）
    if (err.statusCode < 500) {
      logger.warn('Operational error', errorData);
    } else {
      logger.error('Server error', { ...errorData, stack: err.stack });
    }
    
    // 发送适当的错误响应
    return response.error(
      res,
      err.message,
      err.statusCode,
      {
        code: err.code,
        details: err.details
      }
    );
  }
  
  // 处理Multer错误
  if (err.name === 'MulterError') {
    logger.warn('File upload error', { ...errorData, multerError: err.code });
    
    let errorMessage = 'File upload failed';
    let statusCode = 400;
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size exceeds the limit';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected file format';
        break;
      default:
        statusCode = 500;
        errorMessage = 'File upload error';
    }
    
    return response.error(res, errorMessage, statusCode, { code: err.code });
  }
  
  // 处理JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('JSON parsing error', errorData);
    return response.error(res, 'Invalid JSON syntax', 400, { code: 'INVALID_JSON' });
  }
  
  // 处理验证错误（如果使用了Joi或其他验证库）
  if (err.name === 'ValidationError' || err.details) {
    logger.warn('Validation error', { ...errorData, details: err.details });
    return response.validationError(res, err.details || err.message);
  }
  
  // 处理404错误（未找到路由）
  if (err.statusCode === 404 || err.code === 'ENOENT') {
    logger.warn('Resource not found', errorData);
    return response.notFound(res);
  }
  
  // 处理数据库错误
  if (err.name === 'MongoError' || err.name === 'SequelizeError') {
    logger.error('Database error', { ...errorData, stack: err.stack, dbError: err.name });
    
    // 根据数据库错误类型返回不同的响应
    if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
      return response.error(res, 'Resource already exists', 409, { code: 'DUPLICATE_RESOURCE' });
    }
    
    return response.serverError(res, 'Database operation failed', { code: 'DATABASE_ERROR' });
  }
  
  // 处理网络错误
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    logger.error('Network error', { ...errorData, stack: err.stack, networkError: err.code });
    return response.serviceUnavailable(res, 'Service temporarily unavailable');
  }
  
  // 默认情况下，记录详细的服务器错误
  logger.error('Unhandled error', { ...errorData, stack: err.stack });
  
  // 在开发环境中返回详细错误，生产环境中返回通用错误
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = isDevelopment ? {
    message: err.message,
    stack: err.stack,
    code: 'UNHANDLED_ERROR'
  } : {
    message: 'An unexpected error occurred',
    code: 'UNHANDLED_ERROR'
  };
  
  return response.serverError(
    res,
    isDevelopment ? err.message : 'An unexpected error occurred',
    500,
    errorResponse
  );
};

// 未处理的路由中间件
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

// 异步错误捕获中间件
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        // 确保错误被正确传递给错误处理中间件
        if (!error.statusCode) {
          error.statusCode = 500;
        }
        next(error);
      });
  };
};

// 重试机制中间件（用于特定API端点）
const retryMiddleware = (options = {}) => {
  const { maxRetries = 3, retryableErrors = [], delayMs = 1000 } = options;
  
  return (err, req, res, next) => {
    // 检查是否是可重试的错误
    const isRetryable = retryableErrors.some(
      errorType => err.code === errorType || err.name === errorType
    );
    
    if (isRetryable) {
      // 增加重试计数
      req.retryCount = (req.retryCount || 0) + 1;
      
      if (req.retryCount <= maxRetries) {
        logger.info(`Retrying request (${req.retryCount}/${maxRetries})`, {
          path: req.path,
          method: req.method,
          error: err.message
        });
        
        // 延迟重试
        setTimeout(() => {
          // 重新执行请求处理函数
          return next();
        }, delayMs * req.retryCount); // 指数退避
      } else {
        logger.warn(`Max retries reached (${maxRetries})`, {
          path: req.path,
          method: req.method,
          error: err.message
        });
        next(err);
      }
    } else {
      next(err);
    }
  };
};

export {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  retryMiddleware
};

export default errorHandler;