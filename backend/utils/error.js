// backend/utils/error.js - 错误处理工具模块

// 基础错误类
class BaseError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Bad Request错误
class BadRequestError extends BaseError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

// 401 Unauthorized错误
class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    super(message, 401, code, details);
  }
}

// 403 Forbidden错误
class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    super(message, 403, code, details);
  }
}

// 404 Not Found错误
class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    super(message, 404, code, details);
  }
}

// 409 Conflict错误
class ConflictError extends BaseError {
  constructor(message = 'Conflict', code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

// 422 Validation错误
class ValidationError extends BaseError {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details = null) {
    super(message, 422, code, details);
  }
}

// 500 Server错误
class ServerError extends BaseError {
  constructor(message = 'Internal server error', code = 'SERVER_ERROR', details = null) {
    super(message, 500, code, details);
  }
}

// 503 Service Unavailable错误
class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE', details = null) {
    super(message, 503, code, details);
  }
}

// API错误
class ApiError extends BaseError {
  constructor(message, statusCode, code, details = null, apiInfo = null) {
    super(message, statusCode, code, details);
    this.apiInfo = apiInfo;
  }
}

// 速率限制错误
class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED', details = null) {
    super(message, 429, code, details);
  }
}

// 错误处理工具
const errorUtil = {
  // 捕获异步错误
  catchAsync: fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  },
  
  // 验证环境变量
  validateEnv: (envVars) => {
    const missingVars = envVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new ServerError(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        'MISSING_ENV_VARS'
      );
    }
  },
  
  // 格式化错误响应
  formatErrorResponse: (error) => {
    return {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  },
  
  // 记录错误
  logError: (error) => {
    console.error('Error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.statusCode,
      details: error.details,
      stack: error.stack
    });
  }
};

// 导出错误类和工具
export {
  BaseError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServerError,
  ServiceUnavailableError,
  ApiError,
  RateLimitError,
  errorUtil
};