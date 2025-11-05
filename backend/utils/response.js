// backend/utils/response.js - API响应工具模块

// 成功响应
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    error: null
  });
};

// 错误响应
const error = (res, message = 'Error occurred', statusCode = 500, errorDetails = null) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    data: null,
    error: errorDetails || message
  });
};

// 分页响应
const paginated = (res, data, page, pageSize, totalCount, message = 'Success') => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message,
    data,
    meta: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage
    },
    error: null
  });
};

// 验证错误响应
const validationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    statusCode: 400,
    message,
    data: null,
    error: errors
  });
};

// 未授权响应
const unauthorized = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    statusCode: 401,
    message,
    data: null,
    error: 'Unauthorized'
  });
};

// 禁止访问响应
const forbidden = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    statusCode: 403,
    message,
    data: null,
    error: 'Forbidden'
  });
};

// 资源未找到响应
const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message,
    data: null,
    error: 'Not Found'
  });
};

// 服务器错误响应
const serverError = (res, message = 'Internal server error', errorDetails = null) => {
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message,
    data: null,
    error: errorDetails || 'Internal Server Error'
  });
};

// 服务不可用响应
const serviceUnavailable = (res, message = 'Service unavailable', errorDetails = null) => {
  return res.status(503).json({
    success: false,
    statusCode: 503,
    message,
    data: null,
    error: errorDetails || 'Service Unavailable'
  });
};

// 响应工具对象
const response = {
  success,
  error,
  paginated,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  serviceUnavailable,
  
  // 响应状态码常量
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    VALIDATION_ERROR: 422,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  }
};

export default response;