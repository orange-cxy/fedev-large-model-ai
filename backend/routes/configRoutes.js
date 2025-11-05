// backend/routes/configRoutes.js - 配置管理路由
import express from 'express';
import configController from '../controllers/configController.js';
import errorHandler from '../middlewares/errorHandler.js';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import logger from '../utils/logger.js';
import { validateAPIKey } from '../middlewares/security.js';
import { adminRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// 配置路由的前缀
const CONFIG_ROUTE_PREFIX = '/config';

/**
 * @swagger
 * tags:
 *   name: Configuration
 *   description: Configuration management endpoints
 */

/**
 * 应用中间件
 */
router.use((req, res, next) => {
  logger.info('Configuration API request received', {
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });
  next();
});

// 可选的API密钥验证
// 在生产环境中应该启用此验证
if (process.env.NODE_ENV === 'production') {
  router.use(validateAPIKey);
}

// 应用管理员速率限制
router.use(adminRateLimiter);

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get current configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  asyncErrorHandler(configController.getCurrentConfig)
);

/**
 * @swagger
 * /api/config:
 *   put:
 *     summary: Update configuration
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: Configuration updates
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid configuration data
 *       500:
 *         description: Internal server error
 */
router.put(
  '/',
  asyncErrorHandler(configController.updateConfig)
);

/**
 * @swagger
 * /api/config/validate:
 *   post:
 *     summary: Validate configuration
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: Configuration to validate
 *     responses:
 *       200:
 *         description: Validation completed
 *       400:
 *         description: Invalid configuration data
 */
router.post(
  '/validate',
  asyncErrorHandler(configController.validateConfig)
);

/**
 * @swagger
 * /api/config/reload:
 *   post:
 *     summary: Reload configuration from file
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration reloaded successfully
 *       500:
 *         description: Failed to reload configuration
 */
router.post(
  '/reload',
  asyncErrorHandler(configController.reloadConfig)
);

/**
 * @swagger
 * /api/config/history:
 *   get:
 *     summary: Get configuration history
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration history retrieved
 */
router.get(
  '/history',
  asyncErrorHandler(configController.getConfigHistory)
);

/**
 * @swagger
 * /api/config/revert/{version}:
 *   post:
 *     summary: Revert to specific configuration version
 *     tags: [Configuration]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         description: Version index to revert to
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuration reverted successfully
 *       400:
 *         description: Invalid version index
 */
router.post(
  '/revert/:version',
  asyncErrorHandler(configController.revertConfig)
);

/**
 * @swagger
 * /api/config/import:
 *   post:
 *     summary: Import configuration
 *     tags: [Configuration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: Configuration to import
 *     responses:
 *       200:
 *         description: Configuration imported successfully
 *       400:
 *         description: Invalid configuration data
 */
router.post(
  '/import',
  asyncErrorHandler(configController.importConfig)
);

/**
 * @swagger
 * /api/config/export:
 *   get:
 *     summary: Export configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration exported as JSON file
 */
router.get(
  '/export',
  asyncErrorHandler(configController.exportConfig)
);

/**
 * @swagger
 * /api/config/schema:
 *   get:
 *     summary: Get configuration schema
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration schema retrieved
 */
router.get(
  '/schema',
  asyncErrorHandler(configController.getConfigSchema)
);

/**
 * @swagger
 * /api/config/reset:
 *   post:
 *     summary: Reset configuration to defaults
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Configuration reset successfully
 *       500:
 *         description: Failed to reset configuration
 */
router.post(
  '/reset',
  asyncErrorHandler(configController.resetConfig)
);

// 错误处理中间件
router.use(errorHandler);

// 导出配置路由
router.ROUTE_PREFIX = CONFIG_ROUTE_PREFIX;
export default router;