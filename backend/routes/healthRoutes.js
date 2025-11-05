// backend/routes/healthRoutes.js - 健康检查路由
import express from 'express';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import response from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route GET /health
 * @description 基本健康检查端点
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Health check requested');
    
    // 执行基本的健康检查操作
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    return response.success(
      res,
      healthStatus,
      'Service is healthy',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /health/detailed
 * @description 详细健康检查端点
 * @access Public
 */
router.get('/detailed', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Detailed health check requested');
    
    // 收集详细的健康状态信息
    const detailedStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      memory: {
        usage: process.memoryUsage(),
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      cpu: {
        cpus: process.cpuUsage()
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch
      },
      services: {
        database: 'connected', // 模拟数据库状态
        cache: 'connected',    // 模拟缓存状态
        models: 'available'    // 模拟模型服务状态
      }
    };
    
    return response.success(
      res,
      detailedStatus,
      'Detailed health check completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /health/metrics
 * @description 性能指标端点
 * @access Public
 */
router.get('/metrics', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Metrics requested');
    
    // 模拟性能指标
    const metrics = {
      requestCount: 0, // 实际应用中应该从监控系统获取
      errorRate: 0,
      avgResponseTime: 0,
      activeConnections: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    
    return response.success(
      res,
      metrics,
      'Performance metrics retrieved',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Metrics retrieval failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /health/readiness
 * @description 就绪检查端点（用于Kubernetes等容器编排系统）
 * @access Public
 */
router.get('/readiness', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Readiness check requested');
    
    // 模拟就绪检查逻辑
    const isReady = true; // 在实际应用中，这里应该检查依赖服务是否就绪
    
    if (isReady) {
      return response.success(
        res,
        { ready: true, timestamp: new Date().toISOString() },
        'Service is ready',
        response.STATUS_CODES.OK
      );
    } else {
      return response.error(
        res,
        'Service not ready',
        response.STATUS_CODES.SERVICE_UNAVAILABLE,
        { ready: false }
      );
    }
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    return response.error(
      res,
      'Readiness check failed',
      response.STATUS_CODES.SERVICE_UNAVAILABLE,
      { error: error.message }
    );
  }
}));

/**
 * @route GET /health/liveness
 * @description 存活检查端点（用于Kubernetes等容器编排系统）
 * @access Public
 */
router.get('/liveness', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Liveness check requested');
    
    // 存活检查只需要确认服务还在运行
    return response.success(
      res,
      { alive: true, timestamp: new Date().toISOString() },
      'Service is alive',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    // 注意：这个端点即使出错也应该返回500，而不是使用错误处理中间件
    // 这样Kubernetes等系统才能检测到服务故障
    logger.error('Liveness check failed', { error: error.message });
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Service is not alive',
      data: null,
      error: 'LIVENESS_FAILED'
    });
  }
}));

/**
 * @route GET /health/ping
 * @description 简单的ping端点（最基本的连通性测试）
 * @access Public
 */
router.get('/ping', (req, res) => {
  // 这个端点故意不使用错误处理中间件，以确保即使在高负载下也能响应
  res.status(200).send('pong');
});

export default router;