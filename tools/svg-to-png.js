#!/usr/bin/env node

// SVG到PNG转换工具
// 使用方法: node tools/svg-to-png.js <svg文件路径> [输出PNG文件路径]

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES模块中获取__dirname的兼容方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkDependency() {
  try {
    // 检查是否安装了sharp
    require('sharp');
    return true;
  } catch (error) {
    console.log('未检测到sharp依赖，尝试安装...');
    try {
      execSync('npm install sharp --save-dev', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.error('安装sharp失败，请手动运行: npm install sharp --save-dev');
      return false;
    }
  }
}

async function convertSvgToPng(svgPath, outputPath) {
  try {
    // 确保文件存在
    if (!fs.existsSync(svgPath)) {
      console.error(`错误: 找不到SVG文件 ${svgPath}`);
      return false;
    }

    // 读取SVG内容
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // 如果未提供输出路径，自动生成
    if (!outputPath) {
      const fileName = path.basename(svgPath, '.svg');
      outputPath = path.join(path.dirname(svgPath), `${fileName}.png`);
    }

    // 写入临时SVG文件（因为sharp需要从文件读取）
    const tempSvgPath = path.join(__dirname, 'temp.svg');
    fs.writeFileSync(tempSvgPath, svgContent);

    // 动态导入sharp以避免在安装前报错
    const sharp = await import('sharp');
    const sharpInstance = sharp.default;

    // 转换SVG到PNG
    sharpInstance(tempSvgPath)
      .png()
      .toFile(outputPath)
      .then(() => {
        // 清理临时文件
        fs.unlinkSync(tempSvgPath);
        console.log(`✓ 转换成功! PNG文件已保存到: ${outputPath}`);
        console.log(`提示: 您可以将此PNG文件添加到README中，使用格式: ![架构图](path/to/architecture.png)`);
      })
      .catch(err => {
        // 清理临时文件
        if (fs.existsSync(tempSvgPath)) {
          fs.unlinkSync(tempSvgPath);
        }
        console.error('转换失败:', err.message);
      });

    return true;
  } catch (error) {
    console.error('发生错误:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node tools/svg-to-png.js <svg文件路径> [输出PNG文件路径]');
    console.log('');
    console.log('示例:');
    console.log('  node tools/svg-to-png.js architecture.svg');
    console.log('  node tools/svg-to-png.js input.svg output.png');
    console.log('');
    console.log('说明:');
    console.log('  - 如果不提供输出路径，将在同一目录生成同名PNG文件');
    console.log('  - 脚本会自动尝试安装所需依赖(sharp)');
    process.exit(1);
  }

  const svgPath = args[0];
  const outputPath = args[1];

  console.log(`开始转换 SVG: ${svgPath}`);
  
  if (checkDependency()) {
    await convertSvgToPng(svgPath, outputPath);
  }
}

// 执行主函数
main().catch(err => {
  console.error('脚本执行出错:', err);
  process.exit(1);
});