// src/components/ResponseDisplay.js
import { appState } from '../state/app-state.js';
import { safeMarkdownRender } from '../services/markdown-service.js';
import '../styles/components/ResponseDisplay.css';

export class ResponseDisplay {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    this.render(appState.getState());
  }
  
  render(state) {
    const { currentResponse, isLoading, error, conversationHistory } = state;
    
    // 渲染聊天历史
    const historyHtml = conversationHistory.map(msg => `
      <div class="message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}">
        <div class="message-header">
          <span class="sender">${msg.sender === 'user' ? '你' : 'AI'}</span>
          <span class="timestamp">${this.formatTimestamp(msg.timestamp)}</span>
        </div>
        <div class="message-content ${msg.sender === 'ai' ? 'markdown-content' : ''}">
          ${msg.sender === 'ai' ? safeMarkdownRender(msg.content) : msg.content}
        </div>
      </div>
    `).join('');
    
    // 渲染当前响应
    let currentResponseHtml = '';
    if (currentResponse) {
      currentResponseHtml = `
        <div class="message ai-message current-response">
          <div class="message-header">
            <span class="sender">AI</span>
            <span class="timestamp">${this.formatTimestamp(Date.now())}</span>
          </div>
          <div class="message-content markdown-content">
            ${safeMarkdownRender(currentResponse)}
          </div>
        </div>
      `;
    }
    
    // 渲染加载状态
    let loadingHtml = '';
    if (isLoading && !currentResponse) {
      loadingHtml = `
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
          <p>正在生成回复...</p>
        </div>
      `;
    }
    
    // 渲染错误状态
    let errorHtml = '';
    if (error) {
      errorHtml = `
        <div class="error-message">
          <p class="error-icon">⚠️</p>
          <p class="error-text">${error}</p>
        </div>
      `;
    }
    
    // 组合所有内容
    this.rootElement.innerHTML = `
      <div class="response-display">
        <div class="chat-history">
          ${historyHtml}
        </div>
        ${currentResponseHtml}
        ${loadingHtml}
        ${errorHtml}
        ${!historyHtml && !currentResponse && !isLoading && !error ? `
          <div class="empty-state">
            <p>没有对话历史</p>
            <p class="hint">请在下方输入框中输入您的问题</p>
          </div>
        ` : ''}
      </div>
    `;
    
    // 自动滚动到底部
    this.scrollToBottom();
    
    // 高亮代码块（如果有）
    this.highlightCodeBlocks();
  }
  
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  scrollToBottom() {
    try {
      this.rootElement.scrollTop = this.rootElement.scrollHeight;
    } catch (error) {
      console.error('滚动失败:', error);
    }
  }
  
  highlightCodeBlocks() {
    // 简单的代码高亮（生产环境可以使用语法高亮库）
    const codeBlocks = this.rootElement.querySelectorAll('pre code');
    codeBlocks.forEach(code => {
      // 添加代码块样式
      code.classList.add('code-block');
      
      // 尝试添加语言类（如果有）
      const languageClass = Array.from(code.parentElement.classList).find(cls => 
        cls.startsWith('language-')
      );
      
      if (languageClass) {
        const lang = languageClass.replace('language-', '');
        code.dataset.language = lang;
      }
    });
  }
  
  // 复制当前响应
  copyCurrentResponse() {
    const state = appState.getState();
    if (state.currentResponse) {
      navigator.clipboard.writeText(state.currentResponse)
        .then(() => this.showNotification('已复制到剪贴板'))
        .catch(err => console.error('复制失败:', err));
    }
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'response-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }
  
  // 清理资源
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // 清理通知元素
    const notifications = document.querySelectorAll('.response-notification');
    notifications.forEach(notification => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    });
  }
}

// 为了兼容性，将类挂载到window对象
if (typeof window !== 'undefined') {
  window.ResponseDisplay = ResponseDisplay;
}