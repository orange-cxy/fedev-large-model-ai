#!/bin/bash

# 自动Git提交和推送脚本
# 此脚本从test-commit.txt文件中提取最新的commit记录，添加所有修改的文件，并执行提交和推送

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

# 检查test-commit.txt文件是否存在
if [ ! -f "test-commit.txt" ]; then
  echo "错误：test-commit.txt文件不存在"
  exit 1
fi

# 从test-commit.txt文件中提取最新的commit记录
# 过滤出以 feat: | bug: | refactor: | doc: 开头的最新行
LATEST_COMMIT=$(grep -E "^(feat|bug|refactor|doc):" test-commit.txt | tail -n 1)

if [ -z "$LATEST_COMMIT" ]; then
  echo "错误：未在test-commit.txt文件中找到有效的commit记录"
  echo "请使用格式: feat: | bug: | refactor: | doc: 开头的记录"
  exit 1
fi

# 设置提交消息为从文件中提取的记录
COMMIT_MESSAGE="$LATEST_COMMIT"

echo "使用的提交消息: $COMMIT_MESSAGE"

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