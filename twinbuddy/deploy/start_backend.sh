#!/bin/bash
# TwinBuddy v3 — 后端启动脚本
# 用法: bash start_backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"
LOG_DIR="$(dirname "$SCRIPT_DIR")/logs"
PID_FILE="$LOG_DIR/backend.pid"

mkdir -p "$LOG_DIR"

echo "🚀 启动 TwinBuddy 后端..."

# 检查依赖
if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
    echo "❌ 缺少依赖，正在安装..."
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# 检查端口
if lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  端口 8000 已被占用，先停止旧进程..."
    kill "$(lsof -t -i:8000)" 2>/dev/null || true
    sleep 1
fi

cd "$BACKEND_DIR"

# 启动 uvicorn
nohup python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    > "$LOG_DIR/backend.log" 2>&1 &

echo $! > "$PID_FILE"
sleep 2

# 验证
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ 后端启动成功: http://localhost:8000"
    echo "📋 API 文档: http://localhost:8000/docs"
else
    echo "❌ 后端启动失败，查看日志:"
    tail -30 "$LOG_DIR/backend.log"
    exit 1
fi
