# Deepseek AI 前端开发项目

这是一个基于现代Web技术栈构建的AI交互前端项目，用于与Deepseek API进行交互，并支持模拟模式和真实模式的灵活切换。项目采用Vite作为构建工具，Express作为后端服务，实现了完整的AI对话功能。

* 项目地址：https://github.com/orange-cxy/fedev-large-model-ai
* 预览地址：https://orange-cxy.github.io/fedev-large-model-ai/

## 项目特点

- **双模式支持**：同时支持模拟模式和真实API调用模式，便于开发和测试
- **响应式设计**：适配各种设备尺寸，提供良好的用户体验
- **实时交互**：与AI模型进行实时对话交互
- **历史记录**：支持保存和加载历史对话记录
- **灵活配置**：多种模式切换方式，包括URL参数、本地存储和环境变量

## 技术栈

### 前端技术
- **HTML5**：语义化页面结构
- **CSS3**：现代样式和响应式设计
- **JavaScript (ES Modules)**：模块化前端开发
- **Vite**：下一代前端构建工具
- **Rolldown-Vite**：高性能的JavaScript打包器

### 后端技术
- **Node.js**：JavaScript运行时
- **Express**：轻量级Web框架
- **CORS**：处理跨域请求
- **File System**：本地文件存储

## 项目架构

项目采用前后端分离架构，通过模式切换机制支持不同环境下的API调用方式。

![Deepseek AI 项目架构](doc/readme_01.png)

* 前端应用：基于HTML5、CSS3和JavaScript构建，使用Vite作为构建工具
* 模式管理：支持多种模式切换方式，包括localStorage、URL参数和环境变量
* 后端服务：Node.js Express服务器，提供API端点和数据持久化
* 数据存储：本地JSON文件存储对话历史记录

### 架构说明

1. **前端应用**：
   - 基于原生HTML、CSS和JavaScript构建
   - 使用Vite作为构建工具，提供快速的开发体验
   - 实现响应式UI和用户交互逻辑

2. **模式管理**：
   - 支持通过localStorage、URL参数和环境变量三种方式切换运行模式
   - 在浏览器环境中通过import.meta.env获取环境变量

3. **Node.js后端**：
   - 使用Express框架提供API服务
   - 支持CORS跨域请求
   - 根据环境变量决定运行模式

4. **API服务**：
   - Mock模式：返回模拟的Deepseek API响应
   - 真实模式：调用实际的Deepseek API

5. **数据存储**：
   - 使用本地文件系统保存对话历史记录
   - 支持从历史记录中随机加载响应

## 项目结构

```
/Users/mac/beth-new-2025/beth/fedev-large-model-ai/
├── index.html         # 主HTML文件
├── public/            # 静态资源目录
│   └── vite.svg       # Vite图标
├── server.js          # Express服务器
├── src/               # 源代码目录
│   ├── main.js        # 主JavaScript文件
│   ├── style.css      # 样式文件
│   └── mode-config.js # 模式配置文件（动态生成）
├── styles/            # 额外样式目录
│   └── main.css       # 额外样式文件
├── git-auto-push.sh   # Git自动提交脚本
├── test-commit.txt    # 提交记录文件
├── package.json       # 项目配置和依赖
└── README.md          # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

项目支持两种开发模式：

1. **Mock模式**（默认）：
   ```bash
   npm run dev
   # 或者明确指定
   npm run dev:mock
   ```

2. **真实模式**：
   ```bash
   npm run dev:real
   ```

### 构建项目

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 核心功能

### 1. 模式切换
- 通过UI按钮手动切换模式
- 支持通过URL参数设置模式：`?mock=true` 或 `?mock=false`
- 模式状态保存在localStorage中

### 2. AI对话交互
- 在真实模式下调用Deepseek API
- 在模拟模式下返回预定义的响应
- 支持刷新响应以获取不同的模拟内容

### 3. 历史记录管理
- 自动保存对话历史到本地文件系统
- 从历史记录中随机加载响应内容
- 按时间戳组织历史记录文件

### 4. 环境适配
- 自动根据环境变量配置运行模式
- 在浏览器和Node.js环境中都能正确工作
- 动态生成配置文件以适应不同运行环境

## 配置说明

### 环境变量

- `NODE_ENV`: 设置为 `mock` 或 `real` 以切换运行模式

### 模式优先级

模式检测的优先级顺序：
1. localStorage（用户手动切换）
2. URL参数（通过查询字符串）
3. 配置文件（mode-config.js）
4. 环境变量（NODE_ENV）

## 未来优化点

1. **功能增强**
   - 添加更多的AI交互功能，如多轮对话支持
   - 实现更丰富的响应展示方式，如代码高亮、格式化文本等
   - 添加用户认证和个性化功能

2. **性能优化**
   - 实现响应缓存机制，减少重复API调用
   - 优化大型历史记录文件的加载和解析
   - 添加懒加载和代码分割，减小初始加载体积

3. **用户体验**
   - 实现更美观的UI设计和动画效果
   - 添加深色主题支持
   - 优化移动端体验

4. **架构改进**
   - 考虑使用TypeScript增强类型安全性
   - 引入状态管理库如Redux或Vuex（如果迁移到框架）
   - 实现更完善的错误处理和日志系统

5. **部署优化**
   - 添加Docker支持，简化部署流程
   - 实现CI/CD流程，自动化测试和部署
   - 添加性能监控和错误跟踪

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。在提交之前，请确保：

1. 遵循项目的代码风格和规范
2. 为新功能添加适当的测试
3. 更新相关文档
4. 在test-commit.txt中添加符合格式的提交记录

## 许可证

MIT License
