#!/bin/bash
# TwinBuddy v3 — 一键更新脚本
# 在服务器上执行: bash update.sh
# 自动: 拉取最新 → 构建前端 → 重启后端 → 验证

set -e

DEPLOY_DIR="/opt/twinbuddy"
LOG_DIR="$DEPLOY_DIR/logs"

echo "=========================================="
echo "  TwinBuddy v3 一键部署"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# 1. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
cd "$DEPLOY_DIR"
git pull origin main

# 2. 重构前端
echo ""
echo "📦 重建前端..."
cd "$DEPLOY_DIR/frontend"
npm install
npm run build

# 3. 同步 dist 到 /opt
echo ""
echo "📂 同步构建产物..."
rsync -av --delete "$DEPLOY_DIR/frontend/dist/" /opt/twinbuddy/frontend/dist/

# 4. 重启后端
echo ""
echo "🔄 重启后端..."

# 停止旧进程
if [ -f "$LOG_DIR/backend.pid" ]; then
    OLD_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "   停止旧进程 (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 2
    fi
fi

# 启动新进程
cd "$DEPLOY_DIR/backend"
nohup python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    > "$LOG_DIR/backend.log" 2>&1 &

echo $! > "$LOG_DIR/backend.pid"
sleep 3

# 5. 验证
echo ""
echo "🔍 验证服务..."

ERRORS=0

if curl -sf http://localhost:8000/health > /dev/null; then
    echo "   ✅ 后端健康检查通过"
else
    echo "   ❌ 后端健康检查失败"
    ERRORS=$((ERRORS+1))
fi

if [ -d "/opt/twinbuddy/frontend/dist" ]; then
    echo "   ✅ 前端 dist 目录存在"
else
    echo "   ❌ 前端 dist 目录不存在"
    ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "  🎉 部署成功！"
    echo "  访问: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/"
    echo "  API:  http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')/api/feed"
    echo "=========================================="
else
    echo ""
    echo "❌ 部署有 $ERRORS 个问题，请检查日志:"
    tail -20 "$LOG_DIR/backend.log"
    exit 1
fi
