# 通用原生HTML/CSS/JS项目

这是一个基于原生HTML、CSS和JavaScript构建的通用项目模板。它提供了一个现代化、响应式的网站基础结构，包含基本的页面布局、样式和交互功能。

## 项目特点

- **响应式设计**：适配各种屏幕尺寸，从移动设备到桌面
- **语义化HTML**：使用适当的HTML5元素确保良好的可访问性和SEO
- **模块化CSS**：基于CSS变量的主题系统，易于维护和扩展
- **交互功能**：包含表单验证、响应式导航、滚动动画等
- **性能优化**：轻量级设计，无外部依赖

## 项目结构

```
/Users/mac/beth-new-2025/beth/fedev-large-model-ai/
├── index.html         # 主HTML文件
├── styles/            # CSS样式文件目录
│   └── main.css       # 主样式文件
├── scripts/           # JavaScript文件目录
│   └── main.js        # 主JavaScript文件
├── README.md          # 项目文档
└── .gitignore         # Git忽略文件
```

## 快速开始

1. 将项目克隆到本地
   ```bash
   git clone <repository-url>
   cd fedev-large-model-ai
   ```

2. 在浏览器中打开 `index.html` 文件即可查看项目

## 功能模块

### 1. 响应式导航栏
- 在桌面端显示水平导航
- 在移动端自动切换为汉堡菜单
- 滚动时高亮当前页面部分

### 2. 英雄区域
- 引人注目的头部区域
- 带有悬停效果的CTA按钮
- 平滑滚动到页面其他部分

### 3. 服务展示
- 响应式网格布局
- 滚动时的渐入动画效果
- 悬停时的卡片提升效果

### 4. 联系表单
- 客户端表单验证
- 提交状态反馈
- 成功/错误通知

### 5. 页脚区域
- 版权信息
- 社交媒体链接
- 响应式布局

## 自定义与扩展

### 修改主题颜色
在 `styles/main.css` 文件中，您可以通过修改CSS变量来更改主题颜色：

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --dark-color: #34495e;
    --light-color: #ecf0f1;
    --accent-color: #e74c3c;
    --text-color: #2c3e50;
    --light-text: #7f8c8d;
    --white: #ffffff;
}
```

### 添加新的页面部分
1. 在 `index.html` 中添加新的 `<section>` 元素
2. 在 `styles/main.css` 中添加相应的样式
3. 在 `scripts/main.js` 中添加必要的交互功能

### 表单提交处理
默认情况下，表单提交是模拟的。要实现实际的表单提交，您需要修改 `scripts/main.js` 中的表单提交事件处理程序：

```javascript
// 查找这段代码并替换为实际的API请求
setTimeout(function() {
    // 在实际应用中，这里应该是AJAX请求
    console.log('表单提交数据:', { name, email, message });
    
    // 重置表单
    contactForm.reset();
    
    // 恢复按钮状态
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
    
    // 显示成功消息
    showNotification('留言发送成功！', 'success');
}, 1500);
```

## 浏览器兼容性

该项目兼容所有现代浏览器，包括：
- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

对于旧版浏览器，可能需要添加适当的polyfills。

## 性能建议

1. 压缩CSS和JavaScript文件以减小文件大小
2. 优化任何添加的图像资源
3. 考虑使用内容分发网络（CDN）来托管静态资源
4. 添加适当的缓存策略

## 许可证

该项目采用MIT许可证。详情请查看LICENSE文件。