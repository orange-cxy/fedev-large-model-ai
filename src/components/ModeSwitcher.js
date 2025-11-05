// src/components/ModeSwitcher.js
import { appState } from '../state/app-state.js';
import '../styles/components/ModeSwitcher.css';

export class ModeSwitcher {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    this.render(appState.getState());
  }
  
  render(state) {
    const { currentMode } = state;
    
    this.rootElement.innerHTML = `
      <div class="mode-switcher">
        <label class="switch-label">
          <input 
            type="checkbox" 
            class="mode-toggle"
            ${currentMode === 'real' ? 'checked' : ''}
          />
          <span class="switch-slider"></span>
          <span class="mode-text">
            ${currentMode === 'mock' ? '模拟模式' : '真实模式'}
          </span>
        </label>
      </div>
    `;
    
    // 添加事件监听
    this.addEventListeners();
  }
  
  addEventListeners() {
    const toggleElement = this.rootElement.querySelector('.mode-toggle');
    if (toggleElement) {
      toggleElement.addEventListener('change', (event) => {
        const newMode = event.target.checked ? 'real' : 'mock';
        this.handleModeChange(newMode);
      });
    }
  }
  
  handleModeChange(mode) {
    // 更新应用状态
    appState.setCurrentMode(mode);
    
    // 重置当前响应
    appState.updateResponse('');
    
    console.log(`模式已切换为: ${mode}`);
    
    // 显示模式切换提示
    this.showModeChangeNotification(mode);
  }
  
  showModeChangeNotification(mode) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'mode-notification';
    notification.textContent = mode === 'mock' 
      ? '已切换到模拟模式，使用本地数据' 
      : '已切换到真实模式，将调用实际API';
    
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
  
  // 获取当前模式
  getCurrentMode() {
    return appState.getState().currentMode;
  }
  
  // 清理资源
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // 清理通知元素
    const notification = document.querySelector('.mode-notification');
    if (notification && document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }
}

// 为了兼容性，将类挂载到window对象
if (typeof window !== 'undefined') {
  window.ModeSwitcher = ModeSwitcher;
}