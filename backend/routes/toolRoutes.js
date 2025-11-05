// backend/routes/toolRoutes.js - 工具相关路由
import express from 'express';
import { asyncErrorHandler } from '../middlewares/errorHandler.js';
import response from '../utils/response.js';
import logger from '../utils/logger.js';
import ToolService from '../services/toolService.js';
import { validateInput } from '../utils/error.js';

const router = express.Router();
const toolService = new ToolService();

/**
 * @route GET /tools
 * @description 获取所有可用工具
 * @access Public
 */
router.get('/', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get available tools requested');
    
    // 获取所有工具
    const tools = toolService.getAllTools();
    
    return response.success(
      res,
      {
        tools,
        total: tools.length,
        categories: [...new Set(tools.map(t => t.category))]
      },
      'Tools retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve tools', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /tools/:toolId
 * @description 获取工具详情
 * @access Public
 */
router.get('/:toolId', asyncErrorHandler(async (req, res) => {
  try {
    const { toolId } = req.params;
    logger.info(`Get tool details requested for ${toolId}`);
    
    // 获取工具详情
    const tool = toolService.getToolDetails(toolId);
    
    return response.success(
      res,
      tool,
      'Tool details retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve tool details', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /tools/tokenize
 * @description 文本分词和Token计算
 * @access API Key Required
 */
router.post('/tokenize', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Tokenization request received');
    
    // 验证输入数据
    const validationRules = {
      text: {
        presence: true,
        isString: true,
        minLength: 1
      },
      model: {
        optional: true,
        isString: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { text, model = 'gpt-4' } = req.body;
    
    // 计算token
    const tokensInfo = toolService.calculateTokens(text, model);
    
    return response.success(
      res,
      tokensInfo,
      'Tokenization completed successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Tokenization failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /tools/validate-input
 * @description 验证输入数据
 * @access API Key Required
 */
router.post('/validate-input', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Input validation request received');
    
    // 验证输入数据
    const validationRules = {
      input: {
        presence: true
      },
      rules: {
        presence: true,
        isObject: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { input, rules } = req.body;
    
    // 执行验证
    const validationResult = toolService.validateInput(input, rules);
    
    return response.success(
      res,
      validationResult,
      'Input validation completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Input validation failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /tools/format-output
 * @description 格式化输出数据
 * @access API Key Required
 */
router.post('/format-output', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Output formatting request received');
    
    // 验证输入数据
    const validationRules = {
      data: {
        presence: true
      },
      format: {
        presence: true,
        isString: true,
        allowedValues: ['json', 'xml', 'text', 'html']
      },
      options: {
        optional: true,
        isObject: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { data, format, options = {} } = req.body;
    
    // 格式化输出
    const formattedOutput = toolService.formatOutput(data, format, options);
    
    // 设置适当的内容类型
    let contentType = 'application/json';
    switch (format) {
      case 'xml':
        contentType = 'application/xml';
        break;
      case 'text':
        contentType = 'text/plain';
        break;
      case 'html':
        contentType = 'text/html';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    
    // 如果是JSON格式，使用response工具
    if (format === 'json') {
      return response.success(
        res,
        formattedOutput,
        'Output formatted successfully',
        response.STATUS_CODES.OK
      );
    } else {
      // 其他格式直接返回
      return res.status(response.STATUS_CODES.OK).send(formattedOutput);
    }
  } catch (error) {
    logger.error('Output formatting failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /tools/calculate-cost
 * @description 计算API调用成本
 * @access API Key Required
 */
router.post('/calculate-cost', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Cost calculation request received');
    
    // 验证输入数据
    const validationRules = {
      model: {
        presence: true,
        isString: true
      },
      inputTokens: {
        presence: true,
        isNumber: true,
        min: 0
      },
      outputTokens: {
        presence: true,
        isNumber: true,
        min: 0
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { model, inputTokens, outputTokens } = req.body;
    
    // 计算成本
    const costInfo = toolService.calculateCost(model, inputTokens, outputTokens);
    
    return response.success(
      res,
      costInfo,
      'Cost calculation completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Cost calculation failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route POST /tools/extract-entities
 * @description 从文本中提取实体
 * @access API Key Required
 */
router.post('/extract-entities', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Entity extraction request received');
    
    // 验证输入数据
    const validationRules = {
      text: {
        presence: true,
        isString: true,
        minLength: 1
      },
      types: {
        optional: true,
        isArray: true
      }
    };
    
    validateInput(req.body, validationRules);
    
    const { text, types } = req.body;
    
    // 提取实体
    const entities = toolService.extractEntities(text, types);
    
    return response.success(
      res,
      {
        entities,
        total: entities.length
      },
      'Entity extraction completed',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Entity extraction failed', { error: error.message });
    throw error;
  }
}));

/**
 * @route GET /tools/categories
 * @description 获取所有工具类别
 * @access Public
 */
router.get('/categories', asyncErrorHandler(async (req, res) => {
  try {
    logger.info('Get tool categories requested');
    
    // 获取所有工具
    const tools = toolService.getAllTools();
    
    // 提取唯一类别
    const categories = [...new Set(tools.map(t => t.category))];
    
    // 获取每个类别的工具数量
    const categoryCounts = categories.map(category => ({
      category,
      count: tools.filter(t => t.category === category).length
    }));
    
    return response.success(
      res,
      {
        categories,
        categoryCounts,
        totalCategories: categories.length
      },
      'Tool categories retrieved successfully',
      response.STATUS_CODES.OK
    );
  } catch (error) {
    logger.error('Failed to retrieve tool categories', { error: error.message });
    throw error;
  }
}));

export default router;