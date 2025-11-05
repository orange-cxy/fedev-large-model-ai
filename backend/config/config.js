// backend/config/config.js - 配置管理模块
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// 配置验证函数
const validateConfig = (config) => {
  const requiredFields = ['PORT', 'NODE_ENV', 'API_KEY_SECRET'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration: ${missingFields.join(', ')}`);
  }
};

// 配置对象
const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
  
  // API配置
  api: {
    keySecret: process.env.API_KEY_SECRET,
    baseUrl: '/api/v1',
  },
  
  // CORS配置
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:8080']
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? 
      eval(process.env.RATE_LIMIT_WINDOW_MS) : 
      15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT_MAX ? 
      parseInt(process.env.RATE_LIMIT_MAX, 10) : 
      100
  },
  
  // 日志配置
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  
  // AI模型配置
  aiModel: {
    apiUrl: process.env.AI_MODEL_API_URL,
    apiKey: process.env.AI_MODEL_API_KEY,
    timeout: process.env.AI_MODEL_TIMEOUT ? 
      parseInt(process.env.AI_MODEL_TIMEOUT, 10) : 
      30000
  },
  
  // 缓存配置
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: process.env.CACHE_TTL ? 
      parseInt(process.env.CACHE_TTL, 10) : 
      3600000 // 1小时
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 性能监控配置
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    port: process.env.METRICS_PORT ? 
      parseInt(process.env.METRICS_PORT, 10) : 
      9090
  }
};

// 验证配置
validateConfig(config.api);

// 导出配置
export default config;

// 导出获取特定配置的便捷函数
export const getServerConfig = () => config.server;
export const getApiConfig = () => config.api;
export const getCorsConfig = () => config.cors;
export const getRateLimitConfig = () => config.rateLimit;
export const getLoggerConfig = () => config.logger;
export const getAiModelConfig = () => config.aiModel;
export const getCacheConfig = () => config.cache;
export const getJwtConfig = () => config.jwt;
export const getMetricsConfig = () => config.metrics;