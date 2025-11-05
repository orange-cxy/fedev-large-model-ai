// backend/services/toolService.js - 工具服务
import logger from '../utils/logger.js';
import { BadRequestError, ServerError } from '../utils/error.js';
import { getToolConfig } from '../config/config.js';

const toolConfig = getToolConfig();

// 工具服务类
class ToolService {
  constructor() {
    // 注册可用工具
    this.tools = {
      validateInput: this.validateInput.bind(this),
      formatOutput: this.formatOutput.bind(this),
      calculateTokens: this.calculateTokens.bind(this),
      sanitizeText: this.sanitizeText.bind(this),
      extractKeywords: this.extractKeywords.bind(this),
      formatCode: this.formatCode.bind(this),
      summarizeText: this.summarizeText.bind(this),
      detectLanguage: this.detectLanguage.bind(this)
    };
    
    // 工具执行统计
    this.toolStats = {};
  }
  
  /**
   * 执行工具
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @returns {Promise<Object>} 工具执行结果
   */
  async executeTool(toolName, params = {}) {
    try {
      logger.info('Executing tool', { toolName, hasParams: Object.keys(params).length > 0 });
      
      // 验证工具是否存在
      if (!this.tools[toolName]) {
        throw new BadRequestError(`Tool not found: ${toolName}`);
      }
      
      // 检查工具是否启用
      if (!toolConfig.enabledTools.includes(toolName)) {
        throw new BadRequestError(`Tool disabled: ${toolName}`);
      }
      
      const startTime = Date.now();
      
      // 执行工具
      const result = await this.tools[toolName](params);
      
      const executionTime = Date.now() - startTime;
      
      // 记录执行统计
      this.recordToolUsage(toolName, executionTime);
      
      logger.info('Tool executed successfully', { 
        toolName, 
        executionTime: `${executionTime}ms` 
      });
      
      return {
        success: true,
        tool: toolName,
        result,
        executionTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Tool execution failed', {
        toolName,
        error: error.message,
        stack: error.stack
      });
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new ServerError(
        `Tool execution failed: ${error.message}`,
        'TOOL_EXECUTION_FAILED'
      );
    }
  }
  
  /**
   * 获取所有可用工具
   * @returns {Array} 可用工具列表
   */
  getAvailableTools() {
    return toolConfig.enabledTools.map(toolName => ({
      name: toolName,
      description: this.getToolDescription(toolName),
      parameters: this.getToolParameters(toolName)
    }));
  }
  
  /**
   * 获取工具描述
   */
  getToolDescription(toolName) {
    const descriptions = {
      validateInput: 'Validates input data against schema',
      formatOutput: 'Formats output data according to specified format',
      calculateTokens: 'Calculates token count for text',
      sanitizeText: 'Sanitizes text to remove harmful content',
      extractKeywords: 'Extracts keywords from text',
      formatCode: 'Formats code with proper indentation',
      summarizeText: 'Creates a summary of the given text',
      detectLanguage: 'Detects language of the given text'
    };
    
    return descriptions[toolName] || 'No description available';
  }
  
  /**
   * 获取工具参数信息
   */
  getToolParameters(toolName) {
    const parameters = {
      validateInput: [
        { name: 'data', type: 'object', required: true, description: 'Data to validate' },
        { name: 'schema', type: 'object', required: true, description: 'Validation schema' }
      ],
      formatOutput: [
        { name: 'data', type: 'any', required: true, description: 'Data to format' },
        { name: 'format', type: 'string', required: true, description: 'Format type (json, csv, text)' },
        { name: 'options', type: 'object', required: false, description: 'Formatting options' }
      ],
      calculateTokens: [
        { name: 'text', type: 'string', required: true, description: 'Text to count tokens for' },
        { name: 'model', type: 'string', required: false, description: 'Model for token calculation' }
      ],
      sanitizeText: [
        { name: 'text', type: 'string', required: true, description: 'Text to sanitize' },
        { name: 'options', type: 'object', required: false, description: 'Sanitization options' }
      ],
      extractKeywords: [
        { name: 'text', type: 'string', required: true, description: 'Text to extract keywords from' },
        { name: 'count', type: 'number', required: false, description: 'Number of keywords to extract' }
      ],
      formatCode: [
        { name: 'code', type: 'string', required: true, description: 'Code to format' },
        { name: 'language', type: 'string', required: true, description: 'Programming language' },
        { name: 'options', type: 'object', required: false, description: 'Formatting options' }
      ],
      summarizeText: [
        { name: 'text', type: 'string', required: true, description: 'Text to summarize' },
        { name: 'maxLength', type: 'number', required: false, description: 'Maximum summary length' },
        { name: 'type', type: 'string', required: false, description: 'Summary type (brief, detailed)' }
      ],
      detectLanguage: [
        { name: 'text', type: 'string', required: true, description: 'Text to detect language for' }
      ]
    };
    
    return parameters[toolName] || [];
  }
  
  /**
   * 记录工具使用情况
   */
  recordToolUsage(toolName, executionTime) {
    if (!this.toolStats[toolName]) {
      this.toolStats[toolName] = {
        totalExecutions: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        lastExecution: null
      };
    }
    
    const stats = this.toolStats[toolName];
    stats.totalExecutions += 1;
    stats.totalExecutionTime += executionTime;
    stats.averageExecutionTime = Math.round(stats.totalExecutionTime / stats.totalExecutions);
    stats.lastExecution = new Date().toISOString();
  }
  
  /**
   * 获取工具统计信息
   */
  getToolStats() {
    return this.toolStats;
  }
  
  // =================== 具体工具实现 ===================
  
  /**
   * 验证输入
   */
  validateInput({ data, schema }) {
    if (!data || !schema) {
      throw new BadRequestError('Data and schema are required');
    }
    
    const validationResults = [];
    
    // 简单验证实现
    Object.keys(schema).forEach(field => {
      const fieldSchema = schema[field];
      const value = data[field];
      
      // 检查必填字段
      if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        validationResults.push({
          field,
          error: 'Field is required'
        });
        return;
      }
      
      // 检查类型
      if (value !== undefined && fieldSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldSchema.type && !(fieldSchema.type === 'number' && actualType === 'string' && !isNaN(value))) {
          validationResults.push({
            field,
            error: `Expected type ${fieldSchema.type}, got ${actualType}`
          });
        }
      }
      
      // 检查最小长度
      if (value && fieldSchema.minLength && String(value).length < fieldSchema.minLength) {
        validationResults.push({
          field,
          error: `Minimum length is ${fieldSchema.minLength}`
        });
      }
      
      // 检查最大长度
      if (value && fieldSchema.maxLength && String(value).length > fieldSchema.maxLength) {
        validationResults.push({
          field,
          error: `Maximum length is ${fieldSchema.maxLength}`
        });
      }
    });
    
    return {
      isValid: validationResults.length === 0,
      errors: validationResults,
      data: validationResults.length === 0 ? data : null
    };
  }
  
  /**
   * 格式化输出
   */
  formatOutput({ data, format, options = {} }) {
    if (!data || !format) {
      throw new BadRequestError('Data and format are required');
    }
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, options.indent || 2);
        
      case 'csv':
        if (!Array.isArray(data)) {
          throw new BadRequestError('CSV format requires array data');
        }
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
          headers.map(header => {
            const value = row[header];
            const needsQuotes = String(value).includes(',') || String(value).includes('"') || String(value).includes('\n');
            return needsQuotes ? `"${String(value).replace(/"/g, '""')}"` : String(value);
          }).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
        
      case 'text':
        return String(data);
        
      default:
        throw new BadRequestError(`Unsupported format: ${format}`);
    }
  }
  
  /**
   * 计算Token数量
   */
  calculateTokens({ text, model = 'gpt-3.5-turbo' }) {
    if (!text) {
      throw new BadRequestError('Text is required');
    }
    
    // 基于模型的token计算方法
    const modelConfigs = {
      'gpt-3.5-turbo': { charPerToken: 4 },
      'gpt-4': { charPerToken: 3.5 },
      'claude-3-opus': { charPerToken: 4 },
      'claude-3-sonnet': { charPerToken: 4 },
      'claude-3-haiku': { charPerToken: 4 },
      'llama3-8b': { charPerToken: 4 },
      'llama3-70b': { charPerToken: 4 },
      'default': { charPerToken: 4 }
    };
    
    const config = modelConfigs[model] || modelConfigs.default;
    
    // 计算字符数（包括空格）
    const charCount = text.length;
    
    // 估算token数
    const estimatedTokens = Math.ceil(charCount / config.charPerToken);
    
    // 对于中文和其他非拉丁字符，调整估算
    const nonLatinChars = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\u30a0-\u30ff]/g) || []).length;
    const adjustedTokens = Math.ceil((charCount + nonLatinChars) / config.charPerToken);
    
    return {
      charCount,
      estimatedTokens,
      adjustedTokens,
      model,
      calculationMethod: 'character-based-estimate'
    };
  }
  
  /**
   * 清理文本
   */
  sanitizeText({ text, options = {} }) {
    if (!text) {
      throw new BadRequestError('Text is required');
    }
    
    let sanitized = text;
    
    // 移除危险字符和HTML标签
    if (options.removeHtml !== false) {
      sanitized = sanitized.replace(/<[^>]*>?/gm, '');
    }
    
    // 转义特殊字符
    if (options.escapeHtml !== false) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    
    // 移除控制字符（除了换行和制表符）
    if (options.removeControlChars !== false) {
      sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
    
    // 修剪空白
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }
    
    // 限制长度
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength) + '...';
    }
    
    return {
      originalLength: text.length,
      sanitizedLength: sanitized.length,
      sanitizedText: sanitized,
      appliedOptions: Object.keys(options).filter(key => options[key] !== false)
    };
  }
  
  /**
   * 提取关键词
   */
  extractKeywords({ text, count = 10 }) {
    if (!text) {
      throw new BadRequestError('Text is required');
    }
    
    // 简单的关键词提取实现
    // 将文本转换为小写并移除标点符号
    const cleanText = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fff]/g, '');
    
    // 分词
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    // 过滤停用词
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of',
      'for', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
    
    const filteredWords = words.filter(word => !stopWords.has(word));
    
    // 计算词频
    const wordFrequency = {};
    filteredWords.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // 排序并返回前N个关键词
    const sortedKeywords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([word, frequency]) => ({ word, frequency }));
    
    return {
      keywords: sortedKeywords,
      totalUniqueWords: Object.keys(wordFrequency).length,
      totalWordsProcessed: words.length
    };
  }
  
  /**
   * 格式化代码
   */
  formatCode({ code, language, options = {} }) {
    if (!code || !language) {
      throw new BadRequestError('Code and language are required');
    }
    
    // 简单的代码格式化
    const indentSize = options.indentSize || 2;
    const indentChar = options.indentWithTabs ? '\t' : ' '.repeat(indentSize);
    
    // 按语言进行不同的格式化处理
    let formattedCode = code;
    
    // 基本的缩进处理
    const lines = code.split('\n');
    let indentLevel = 0;
    const formattedLines = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // 减少缩进级别
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // 添加缩进
      if (trimmedLine) {
        formattedLines.push(indentChar.repeat(indentLevel) + trimmedLine);
      } else {
        formattedLines.push(''); // 保留空行
      }
      
      // 增加缩进级别
      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
        indentLevel++;
      } else if (language === 'python' && !trimmedLine.startswith('#') && trimmedLine.endsWith(':')) {
        indentLevel++;
      }
    });
    
    formattedCode = formattedLines.join('\n');
    
    return {
      formattedCode,
      originalLineCount: lines.length,
      formattedLineCount: formattedLines.length,
      language,
      formattingOptions: { indentSize, indentWithTabs: !!options.indentWithTabs }
    };
  }
  
  /**
   * 文本摘要
   */
  summarizeText({ text, maxLength = 150, type = 'brief' }) {
    if (!text) {
      throw new BadRequestError('Text is required');
    }
    
    // 如果文本已经很短，直接返回
    if (text.length <= maxLength) {
      return {
        summary: text,
        originalLength: text.length,
        summaryLength: text.length,
        compressionRatio: 1,
        type
      };
    }
    
    // 简单的摘要实现：提取前几个句子
    const sentences = text.split(/[.!?]\s+/);
    let summary = '';
    let currentLength = 0;
    
    for (const sentence of sentences) {
      if (currentLength + sentence.length > maxLength) {
        // 如果是最后一个句子，截断它
        if (summary) {
          const remainingLength = maxLength - currentLength - 3;
          summary += ' ' + sentence.substring(0, remainingLength) + '...';
        } else {
          summary = sentence.substring(0, maxLength - 3) + '...';
        }
        break;
      }
      
      if (summary) {
        summary += ' ' + sentence;
      } else {
        summary = sentence;
      }
      currentLength = summary.length;
    }
    
    // 确保摘要以适当的标点符号结束
    if (!/[.!?]$/.test(summary)) {
      summary += '.';
    }
    
    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: (summary.length / text.length).toFixed(2),
      type
    };
  }
  
  /**
   * 语言检测
   */
  detectLanguage({ text }) {
    if (!text) {
      throw new BadRequestError('Text is required');
    }
    
    // 简单的语言检测实现
    const languagePatterns = [
      { code: 'en', name: 'English', pattern: /[a-zA-Z]/g, threshold: 0.5 },
      { code: 'zh', name: 'Chinese', pattern: /[\u4e00-\u9fff]/g, threshold: 0.3 },
      { code: 'ja', name: 'Japanese', pattern: /[\u3040-\u30ff]/g, threshold: 0.3 },
      { code: 'ko', name: 'Korean', pattern: /[\uac00-\ud7af]/g, threshold: 0.3 },
      { code: 'es', name: 'Spanish', pattern: /[a-zA-Záéíóúüñ]/gi, threshold: 0.5 },
      { code: 'fr', name: 'French', pattern: /[a-zA-Zéèêëàâäôöûüç]/gi, threshold: 0.5 },
      { code: 'de', name: 'German', pattern: /[a-zA-Zäöüß]/gi, threshold: 0.5 },
      { code: 'ru', name: 'Russian', pattern: /[\u0400-\u04ff]/g, threshold: 0.3 },
      { code: 'ar', name: 'Arabic', pattern: /[\u0600-\u06ff]/g, threshold: 0.3 }
    ];
    
    // 去除空白字符
    const cleanText = text.replace(/\s+/g, '');
    if (cleanText.length === 0) {
      return { language: 'unknown', confidence: 0 };
    }
    
    let bestMatch = { code: 'unknown', name: 'Unknown', confidence: 0 };
    
    languagePatterns.forEach(lang => {
      const matches = cleanText.match(lang.pattern);
      const matchCount = matches ? matches.length : 0;
      const confidence = matchCount / cleanText.length;
      
      if (confidence > bestMatch.confidence && confidence >= lang.threshold) {
        bestMatch = {
          code: lang.code,
          name: lang.name,
          confidence: parseFloat(confidence.toFixed(2))
        };
      }
    });
    
    return bestMatch;
  }
}

// 导出工具服务实例
const toolService = new ToolService();
export default toolService;