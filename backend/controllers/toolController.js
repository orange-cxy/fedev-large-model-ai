// backend/controllers/toolController.js - 工具控制器
import ToolService from '../services/toolService.js';
import logger from '../utils/logger.js';
import response from '../utils/response.js';

class ToolController {
  constructor() {
    this.toolService = new ToolService();
  }

  /**
   * 获取所有可用工具
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getAllTools(req, res, next) {
    try {
      logger.info('Get available tools requested');
      
      // 获取所有工具
      const tools = this.toolService.getAllTools();
      
      // 提取唯一类别
      const categories = [...new Set(tools.map(t => t.category))];
      
      logger.info('Tools retrieved successfully', {
        totalTools: tools.length,
        categories: categories.length
      });
      
      return response.success(
        res,
        {
          tools,
          total: tools.length,
          categories
        },
        'Tools retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Failed to retrieve tools', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取工具详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getToolDetails(req, res, next) {
    try {
      const { toolId } = req.params;
      
      logger.info(`Get tool details requested for ${toolId}`);
      
      // 获取工具详情
      const tool = this.toolService.getToolDetails(toolId);
      
      logger.info(`Tool details retrieved successfully for ${toolId}`);
      
      return response.success(
        res,
        tool,
        'Tool details retrieved successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error(`Failed to retrieve tool details for ${req.params.toolId}`, {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 文本分词和Token计算
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async tokenizeText(req, res, next) {
    try {
      const { text, model = 'gpt-4' } = req.body;
      
      logger.info('Tokenization request received', {
        model,
        userId: req.user?.id,
        textLength: text?.length || 0
      });
      
      // 计算token
      const tokensInfo = this.toolService.calculateTokens(text, model);
      
      logger.info('Tokenization completed successfully', {
        model,
        tokens: tokensInfo.totalTokens
      });
      
      return response.success(
        res,
        tokensInfo,
        'Tokenization completed successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Tokenization failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 验证输入数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async validateInputData(req, res, next) {
    try {
      const { input, rules } = req.body;
      
      logger.info('Input validation request received', {
        userId: req.user?.id,
        ruleCount: Object.keys(rules).length
      });
      
      // 执行验证
      const validationResult = this.toolService.validateInput(input, rules);
      
      logger.info('Input validation completed', {
        valid: validationResult.isValid
      });
      
      return response.success(
        res,
        validationResult,
        'Input validation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Input validation failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 格式化输出数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async formatOutputData(req, res, next) {
    try {
      const { data, format, options = {} } = req.body;
      
      logger.info('Output formatting request received', {
        format,
        userId: req.user?.id
      });
      
      // 格式化输出
      const formattedOutput = this.toolService.formatOutput(data, format, options);
      
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
      
      logger.info('Output formatting completed successfully', {
        format
      });
      
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
      logger.error('Output formatting failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 计算API调用成本
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async calculateAPICost(req, res, next) {
    try {
      const { model, inputTokens, outputTokens } = req.body;
      
      logger.info('Cost calculation request received', {
        model,
        inputTokens,
        outputTokens,
        userId: req.user?.id
      });
      
      // 计算成本
      const costInfo = this.toolService.calculateCost(model, inputTokens, outputTokens);
      
      logger.info('Cost calculation completed', {
        model,
        totalCost: costInfo.totalCost
      });
      
      return response.success(
        res,
        costInfo,
        'Cost calculation completed',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Cost calculation failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 从文本中提取实体
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async extractEntitiesFromText(req, res, next) {
    try {
      const { text, types } = req.body;
      
      logger.info('Entity extraction request received', {
        types: types?.join(',') || 'all',
        userId: req.user?.id,
        textLength: text?.length || 0
      });
      
      // 提取实体
      const entities = this.toolService.extractEntities(text, types);
      
      logger.info('Entity extraction completed', {
        entityCount: entities.length
      });
      
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
      logger.error('Entity extraction failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 获取所有工具类别
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async getToolCategories(req, res, next) {
    try {
      logger.info('Get tool categories requested');
      
      // 获取所有工具
      const tools = this.toolService.getAllTools();
      
      // 提取唯一类别
      const categories = [...new Set(tools.map(t => t.category))];
      
      // 获取每个类别的工具数量
      const categoryCounts = categories.map(category => ({
        category,
        count: tools.filter(t => t.category === category).length
      }));
      
      logger.info('Tool categories retrieved successfully', {
        totalCategories: categories.length
      });
      
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
      logger.error('Failed to retrieve tool categories', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 解析JSON字符串
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async parseJSON(req, res, next) {
    try {
      const { jsonString } = req.body;
      
      logger.info('JSON parsing request received', {
        userId: req.user?.id
      });
      
      // 解析JSON
      const parsedData = this.toolService.parseJSON(jsonString);
      
      logger.info('JSON parsing completed successfully');
      
      return response.success(
        res,
        parsedData,
        'JSON parsing completed successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('JSON parsing failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  /**
   * 生成唯一ID
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express下一个中间件函数
   */
  async generateUniqueId(req, res, next) {
    try {
      const { prefix, suffix, length = 16 } = req.body;
      
      logger.info('Unique ID generation requested', {
        prefix,
        suffix,
        length,
        userId: req.user?.id
      });
      
      // 生成唯一ID
      const uniqueId = this.toolService.generateUniqueId(prefix, suffix, length);
      
      logger.info('Unique ID generated successfully');
      
      return response.success(
        res,
        { id: uniqueId },
        'Unique ID generated successfully',
        response.STATUS_CODES.OK
      );
    } catch (error) {
      logger.error('Unique ID generation failed', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
}

export default new ToolController();