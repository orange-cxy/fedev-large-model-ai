// src/components/MessageInput.js
import { appState } from '../state/app-state.js';
import { apiService } from '../services/api-service.js';
import '../styles/components/MessageInput.css';

export class MessageInput {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    this.render(appState.getState());
  }
  
  render(state) {
    const { isLoading } = state;
    
    this.rootElement.innerHTML = `
      <div class="message-input-container">
        <div class="input-wrapper">
          <textarea 
            id="message-textarea" 
            placeholder="请输入您的问题..."
            rows="3"
            ${isLoading ? 'disabled' : ''}
          ></textarea>
          <div class="input-actions">
            <button 
              id="clear-button" 
              class="action-button"
              title="清空输入"
            >
              清空
            </button>
            <button 
              id="send-button" 
              class="send-button"
              ${isLoading ? 'disabled' : ''}
              title="发送消息 (Ctrl+Enter)"
            >
              ${isLoading ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 添加事件监听
    this.addEventListeners();
  }
  
  addEventListeners() {
    const textarea = this.rootElement.querySelector('#message-textarea');
    const sendButton = this.rootElement.querySelector('#send-button');
    const clearButton = this.rootElement.querySelector('#clear-button');
    
    if (textarea) {
      // 监听Enter键发送消息（Ctrl+Enter换行）
      textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          this.handleSendMessage();
        }
      });
      
      // 自动调整文本区域高度
      textarea.addEventListener('input', () => {
        this.adjustTextareaHeight(textarea);
      });
    }
    
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearInput();
      });
    }
  }
  
  handleSendMessage() {
    const textarea = this.rootElement.querySelector('#message-textarea');
    if (!textarea) return;
    
    const message = textarea.value.trim();
    if (!message) {
      this.showNotification('请输入问题内容', 'warning');
      return;
    }
    
    // 检查是否选择了模型
    const currentModel = appState.getState().currentModel;
    if (!currentModel) {
      this.showNotification('请先选择一个模型', 'error');
      return;
    }
    
    // 清空输入框
    this.clearInput();
    
    // 发送消息到API服务
    this.sendToApi(message);
  }
  
  async sendToApi(message) {
    try {
      // 发送消息并处理流式响应
      await apiService.fetchModelResponse(
        message, 
        (chunk) => {
          // 这里可以添加额外的流处理逻辑
          console.log('收到流数据:', chunk);
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      this.showNotification('发送失败，请重试', 'error');
    }
  }
  
  clearInput() {
    const textarea = this.rootElement.querySelector('#message-textarea');
    if (textarea) {
      textarea.value = '';
      this.adjustTextareaHeight(textarea);
    }
  }
  
  adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  }
  
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // 清理资源
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // 清理通知元素
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    });
  }
}

// 为了兼容性，将类挂载到window对象
if (typeof window !== 'undefined') {
  window.MessageInput = MessageInput;
}