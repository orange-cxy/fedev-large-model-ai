// src/state/app-state.js
export class AppState {
  constructor() {
    this.state = {
      currentMode: 'mock', // 'mock' 或 'real'
      currentModel: null,
      models: [],
      isLoading: false,
      error: null,
      currentResponse: '',
      conversationHistory: []
    };
    this.listeners = new Set();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  getState() {
    return { ...this.state }; // 返回副本避免直接修改
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener); // 返回取消订阅函数
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // 便捷方法
  setCurrentMode(mode) {
    this.setState({ currentMode: mode });
  }
  
  setCurrentModel(model) {
    this.setState({ currentModel: model });
  }
  
  setLoading(loading) {
    this.setState({ isLoading: loading });
  }
  
  setError(error) {
    this.setState({ error: error });
  }
  
  updateResponse(content) {
    this.setState({ currentResponse: content });
  }
  
  addToHistory(message) {
    const newHistory = [...this.state.conversationHistory, message];
    this.setState({ conversationHistory: newHistory });
  }
}

export const appState = new AppState();