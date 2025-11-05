// src/services/markdown-service.js

// 安全的Markdown渲染函数
export function safeMarkdownRender(markdown) {
  // 由于我们没有直接导入marked库，这里使用window.marked
  // 在实际项目中，应该正确导入marked库
  if (typeof window !== 'undefined' && window.marked) {
    try {
      // 设置marked选项
      window.marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false, // 注意：在生产环境中应该使用DOMPurify进行净化
        headerIds: false
      });
      
      let html = window.marked(markdown || '');
      
      // 基础的HTML净化（简单实现，生产环境建议使用DOMPurify）
      html = sanitizeBasicHTML(html);
      
      return html;
    } catch (error) {
      console.error('Markdown渲染失败:', error);
      // 返回转义后的原始文本
      return escapeHtml(markdown || '');
    }
  } else {
    // 如果marked不可用，返回转义后的文本
    return escapeHtml(markdown || '');
  }
}

// 基础HTML净化函数
function sanitizeBasicHTML(html) {
  // 移除危险的标签和属性
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'];
  const allowedAttributes = ['href', 'title'];
  
  // 使用DOM解析器进行更安全的操作
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 过滤所有元素
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    } else {
      // 过滤属性
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.name === 'href') {
          // 确保链接是安全的
          const href = attr.value;
          if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
            el.removeAttribute('href');
          }
        }
      });
    }
  });
  
  return doc.body.innerHTML;
}

// HTML转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 导出Markdown预览组件所需的工具函数
export function extractCodeBlocks(markdown) {
  const codeBlockRegex = /```([\w]*?)\n([\s\S]*?)```/g;
  const codeBlocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2]
    });
  }
  
  return codeBlocks;
}

// 生成Markdown目录
export function generateMarkdownTOC(markdown) {
  const headingRegex = /^(#{1,6})\s+([^\n]+)/gm;
  const tocItems = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    
    tocItems.push({
      level,
      text,
      id
    });
  }
  
  return tocItems;
}