// src/components/ModelSelector.js
import { appState } from '../state/app-state.js';
import '../styles/components/ModelSelector.css';

export class ModelSelector {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.unsubscribe = appState.subscribe(this.render.bind(this));
    this.render(appState.getState());
  }
  
  render(state) {
    const { models, currentModel } = state;
    
    if (!models || models.length === 0) {
      this.rootElement.innerHTML = `
        <div class="model-selector">
          <select disabled>
            <option>加载中...</option>
          </select>
        </div>
      `;
      return;
    }
    
    this.rootElement.innerHTML = `
      <div class="model-selector">
        <label for="model-select">选择模型：</label>
        <select id="model-select">
          ${models.map(model => `
            <option value="${model.id}" ${currentModel === model.id ? 'selected' : ''}>
              ${model.name}
            </option>
          `).join('')}
        </select>
      </div>
    `;
    
    // 添加事件监听
    this.addEventListeners();
  }
  
  addEventListeners() {
    const selectElement = this.rootElement.querySelector('#model-select');
    if (selectElement) {
      selectElement.addEventListener('change', (event) => {
        const selectedModel = event.target.value;
        this.handleModelChange(selectedModel);
      });
    }
  }
  
  handleModelChange(modelId) {
    // 更新应用状态
    appState.setCurrentModel(modelId);
    
    // 重置当前响应
    appState.updateResponse('');
    
    console.log(`模型已切换为: ${modelId}`);
  }
  
  // 获取当前选中的模型
  getCurrentModel() {
    return appState.getState().currentModel;
  }
  
  // 获取所有可用模型
  getModels() {
    return appState.getState().models;
  }
  
  // 清理资源
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// 为了兼容性，将类挂载到window对象
if (typeof window !== 'undefined') {
  window.ModelSelector = ModelSelector;
}