#!/bin/bash
# TwinBuddy v3 — 前端构建脚本
# 用法: bash build_frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

echo "📦 开始构建 TwinBuddy 前端..."

cd "$FRONTEND_DIR"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "⚙️  安装依赖..."
    npm install
fi

# 构建
echo "🔨 执行 npm run build..."
npm run build

# 验证 dist 目录
if [ -d "$DIST_DIR" ] && [ "$(ls -A $DIST_DIR)" ]; then
    echo "✅ 构建成功: $DIST_DIR"
    echo "📁 文件数: $(find $DIST_DIR -type f | wc -l)"
    echo "💾 总大小: $(du -sh $DIST_DIR | cut -f1)"
else
    echo "❌ 构建失败，dist 目录为空"
    exit 1
fi

# 复制到 /opt（服务器路径）
if [ -d "/opt/twinbuddy" ]; then
    echo "📂 同步到 /opt/twinbuddy/frontend/dist..."
    rsync -av --delete "$DIST_DIR/" /opt/twinbuddy/frontend/dist/
    echo "✅ 同步完成"
fi
