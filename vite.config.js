import { defineConfig } from 'vite';

// 定义GitHub Pages的基础路径
// 默认情况下，GitHub Pages的路径格式为：https://<username>.github.io/<repository-name>/
// 请根据实际情况修改repository-name
const repositoryName = 'fedev-large-model-ai';

export default defineConfig({
  // 为GitHub Pages设置正确的基础路径
  base: `/${repositoryName}/`,
  
  // 构建输出配置
  build: {
    outDir: 'dist',
    // 确保生成的静态文件路径正确
    assetsDir: 'assets',
    // 生成源映射以帮助调试
    sourcemap: true,
    // 最小化构建
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    // 确保在开发环境中也能模拟GitHub Pages的路径结构
    base: `/${repositoryName}/`
  }
});