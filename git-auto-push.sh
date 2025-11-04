#!/bin/bash

# 自动Git提交和推送脚本
# 此脚本会自动检测修改的文件，生成提交消息，并执行推送

echo "开始自动Git操作..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
  echo "错误：当前目录不是Git仓库"
  exit 1
fi

# 获取所有修改和未跟踪的文件列表
MODIFIED_FILES=$(git status --short | awk '{print $2}' | tr '\n' ', ')

if [ -z "$MODIFIED_FILES" ]; then
  echo "没有检测到需要提交的修改文件"
  exit 0
fi

# 移除末尾的逗号和空格
MODIFIED_FILES=${MODIFIED_FILES%, }

# 生成提交消息
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
COMMIT_MESSAGE="自动提交 - 修改了 ${MODIFIED_FILES} - ${TIMESTAMP}"

echo "生成的提交消息: $COMMIT_MESSAGE"

# 添加所有修改的文件
echo "添加修改的文件..."
git add .

# 执行提交
echo "执行提交..."
git commit -m "$COMMIT_MESSAGE"

# 检查提交是否成功
if [ $? -eq 0 ]; then
  echo "提交成功！"
  
  # 执行推送
echo "执行推送..."
  git push
  
  if [ $? -eq 0 ]; then
    echo "推送成功！"
  else
    echo "推送失败，请检查网络连接或权限设置"
    exit 1
  fi
else
  echo "提交失败，请检查错误信息"
  exit 1
fi

echo "自动Git操作完成！"