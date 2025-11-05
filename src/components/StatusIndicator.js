// src/components/StatusIndicator.js
import { appState } from '../state/app-state.js';
import '../styles/components/StatusIndicator.css';

export class StatusIndicator {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    this.render(appState.getState());
  }
  
  render(state) {
    const { currentMode, currentModel, isLoading, error } = state;
    
    // 构建状态信息
    const statusInfo = [];
    
    // 模式信息
    statusInfo.push({
      icon: currentMode === 'mock' ? '🔄' : '🌐',
      text: currentMode === 'mock' ? '模拟模式' : '真实模式',
      type: 'mode'
    });
    
    // 模型信息
    if (currentModel) {
      statusInfo.push({
        icon: '🤖',
        text: `模型: ${currentModel}`,
        type: 'model'
      });
    }
    
    // 加载状态
    if (isLoading) {
      statusInfo.push({
        icon: '⏳',
        text: '处理中...',
        type: 'loading'
      });
    }
    
    // 错误状态
    if (error) {
      statusInfo.push({
        icon: '❌',
        text: '发生错误',
        type: 'error'
      });
    }
    
    // 渲染状态项
    const statusItemsHtml = statusInfo.map(item => `
      <div class="status-item status-${item.type}">
        <span class="status-icon">${item.icon}</span>
        <span class="status-text">${item.text}</span>
      </div>
    `).join('');
    
    // 渲染清除历史按钮
    const clearHistoryButton = !isLoading ? `
      <button id="clear-history" class="clear-history-btn" title="清除对话历史">
        🗑️ 清除历史
      </button>
    ` : '';
    
    this.rootElement.innerHTML = `
      <div class="status-indicator">
        <div class="status-items">
          ${statusItemsHtml}
        </div>
        ${clearHistoryButton}
      </div>
    `;
    
    // 添加事件监听
    this.addEventListeners();
  }
  
  addEventListeners() {
    const clearHistoryButton = this.rootElement.querySelector('#clear-history');
    if (clearHistoryButton) {
      clearHistoryButton.addEventListener('click', () => {
        this.handleClearHistory();
      });
    }
  }
  
  handleClearHistory() {
    // 确认对话框
    if (confirm('确定要清除所有对话历史吗？此操作不可撤销。')) {
      // 清除应用状态中的历史记录
      appState.setState({
        conversationHistory: [],
        currentResponse: ''
      });
      
      // 显示确认消息
      this.showNotification('对话历史已清除');
    }
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'status-notification';
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
  
  // 获取当前状态摘要
  getStatusSummary() {
    const state = appState.getState();
    return {
      mode: state.currentMode,
      model: state.currentModel,
      loading: state.isLoading,
      error: state.error,
      historyLength: state.conversationHistory.length
    };
  }
  
  // 清理资源
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // 清理通知元素
    const notifications = document.querySelectorAll('.status-notification');
    notifications.forEach(notification => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    });
  }
}

// 为了兼容性，将类挂载到window对象
if (typeof window !== 'undefined') {
  window.StatusIndicator = StatusIndicator;
}