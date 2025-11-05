// src/components/AppContainer.js
import { appState } from '../state/app-state.js';
import { ModelSelector } from './ModelSelector.js';
import { ModeSwitcher } from './ModeSwitcher.js';
import { MessageInput } from './MessageInput.js';
import { ResponseDisplay } from './ResponseDisplay.js';
import { StatusIndicator } from './StatusIndicator.js';
import { storageService } from '../services/storage-service.js';

// 动态导入，确保组件在使用前已定义
const dynamicImports = async () => {
  if (!window.ModelSelector) {
    // 这里可以添加动态导入逻辑
  }
};

dynamicImports();

export class AppContainer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.components = {};
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    
    // 初始化应用
    this.initialize();
  }
  
  async initialize() {
    // 加载用户偏好设置
    const preferences = storageService.loadUserPreferences();
    if (preferences) {
      appState.setCurrentMode(preferences.defaultMode || 'mock');
      // 稍后会加载模型列表
    }
    
    // 加载模型配置
    await this.loadModels();
    
    // 渲染应用
    this.render(appState.getState());
  }
  
  async loadModels() {
    try {
      // 这里应该从配置文件或API加载模型列表
      // 暂时使用模拟数据
      const models = [
        { id: 'cozeV2', name: 'Coze V2' },
        { id: 'cozeV3', name: 'Coze V3' },
        { id: 'deepseek', name: 'DeepSeek' },
        { id: 'kimi-k2', name: 'Kimi K2' }
      ];
      
      appState.setState({ models });
      
      // 如果有默认模型，设置当前模型
      const preferences = storageService.loadUserPreferences();
      if (preferences.defaultModel && models.some(m => m.id === preferences.defaultModel)) {
        appState.setCurrentModel(preferences.defaultModel);
      } else if (models.length > 0) {
        appState.setCurrentModel(models[0].id);
      }
    } catch (error) {
      console.error('加载模型失败:', error);
      appState.setError('无法加载模型配置');
    }
  }
  
  render(state) {
    // 渲染应用容器
    this.rootElement.innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <h1>AI对话助手</h1>
          <div class="header-controls">
            <div id="mode-switcher"></div>
            <div id="model-selector"></div>
          </div>
        </header>
        
        <main class="app-main">
          <div class="chat-container">
            <div id="status-indicator"></div>
            <div id="response-display"></div>
            <div id="message-input"></div>
          </div>
        </main>
        
        <footer class="app-footer">
          <p>© 2025 AI对话助手 - 重构版</p>
        </footer>
      </div>
    `;
    
    // 初始化子组件
    this.initializeComponents();
  }
  
  initializeComponents() {
    // 初始化模式切换器
    if (!this.components.modeSwitcher) {
      const modeSwitcherElement = document.getElementById('mode-switcher');
      if (modeSwitcherElement) {
        try {
          this.components.modeSwitcher = new ModeSwitcher(modeSwitcherElement);
        } catch (error) {
          console.error('初始化模式切换器失败:', error);
        }
      }
    }
    
    // 初始化模型选择器
    if (!this.components.modelSelector) {
      const modelSelectorElement = document.getElementById('model-selector');
      if (modelSelectorElement) {
        try {
          this.components.modelSelector = new ModelSelector(modelSelectorElement);
        } catch (error) {
          console.error('初始化模型选择器失败:', error);
        }
      }
    }
    
    // 初始化状态指示器
    if (!this.components.statusIndicator) {
      const statusIndicatorElement = document.getElementById('status-indicator');
      if (statusIndicatorElement) {
        try {
          this.components.statusIndicator = new StatusIndicator(statusIndicatorElement);
        } catch (error) {
          console.error('初始化状态指示器失败:', error);
        }
      }
    }
    
    // 初始化响应显示组件
    if (!this.components.responseDisplay) {
      const responseDisplayElement = document.getElementById('response-display');
      if (responseDisplayElement) {
        try {
          this.components.responseDisplay = new ResponseDisplay(responseDisplayElement);
        } catch (error) {
          console.error('初始化响应显示组件失败:', error);
        }
      }
    }
    
    // 初始化消息输入组件
    if (!this.components.messageInput) {
      const messageInputElement = document.getElementById('message-input');
      if (messageInputElement) {
        try {
          this.components.messageInput = new MessageInput(messageInputElement);
        } catch (error) {
          console.error('初始化消息输入组件失败:', error);
        }
      }
    }
  }
  
  // 保存当前应用状态
  saveState() {
    const currentState = appState.getState();
    storageService.saveUserPreferences({
      defaultMode: currentState.currentMode,
      defaultModel: currentState.currentModel
    });
  }
  
  // 清理资源
  destroy() {
    // 保存状态
    this.saveState();
    
    // 取消订阅状态更新
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // 销毁所有子组件
    Object.values(this.components).forEach(component => {
      if (component && component.destroy) {
        component.destroy();
      }
    });
  }
}

// 为了兼容性，将类挂载到window对象
defineComponent('AppContainer', AppContainer);

// 辅助函数：定义组件到全局
function defineComponent(name, componentClass) {
  if (typeof window !== 'undefined') {
    window[name] = componentClass;
  }
}