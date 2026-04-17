# TwinBuddy v3 部署指南

> 适用：黑客松演示 / 生产服务器
> 日期：2026年4月18日

---

## 一、架构概览

```
                        ┌─────────────────────┐
  用户扫码访问           │    服务器 (Linux)     │
  http://your-server/   │                      │
  ───────────────────► │  ┌────────────────┐  │
                       │  │   Nginx :80    │  │
                       │  │                 │  │
                       │  │  /        → dist/     │  ← 前端静态文件
                       │  │  /api/*  → :8000     │  ← 反向代理到 FastAPI
                       │  └────────────────┘  │
                       │         ▲            │
                       │         │            │
                       │  ┌──────┴──────────┐ │
                       │  │  FastAPI :8000  │ │
                       │  │  /api/onboarding│ │
                       │  │  /api/feed      │ │
                       │  │  /api/negotiate │ │
                       │  └─────────────────┘ │
                       └─────────────────────┘
```

---

## 二、文件清单

```
twinbuddy/
├── frontend/                  # 前端源码
│   ├── dist/                  # ⭐ 打包输出（npm run build 后生成）
│   └── package.json
│
├── backend/                   # 后端源码
│   ├── main.py               # FastAPI 入口（端口 8000）
│   ├── api/frontend_api.py   # 前端对接 API
│   └── requirements.txt
│
└── deploy/                    # ⭐ 部署资源
    ├── DEPLOYMENT.md         # 本文件
    ├── start_backend.sh       # 后端启动脚本
    ├── build_frontend.sh      # 前端构建脚本
    ├── nginx.conf             # Nginx 配置
    ├── update.sh              # 一键更新脚本（构建+部署）
    └── qr.sh                  # 生成访问二维码
```

---

## 三、快速部署（服务器端）

### 第一步：上传代码

```bash
# 方式 A：git clone
git clone <your-repo-url> /opt/twinbuddy
cd /opt/twinbuddy

# 方式 B：scp 上传（本地执行）
scp -r twinbuddy/ root@your-server:/opt/
```

### 第二步：安装后端依赖

```bash
cd /opt/twinbuddy/backend
pip install -r requirements.txt
```

### 第三步：安装前端依赖并构建

```bash
cd /opt/twinbuddy/frontend
npm install
npm run build      # ⭐ 输出到 dist/
```

### 第四步：配置 Nginx

```bash
# 复制 nginx 配置
sudo cp /opt/twinbuddy/deploy/nginx.conf /etc/nginx/sites-available/twinbuddy

# 启用站点
sudo ln -sf /etc/nginx/sites-available/twinbuddy /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 第五步：启动后端（生产模式）

```bash
cd /opt/twinbuddy/backend

# 方式 A：systemd（推荐）
sudo bash /opt/twinbuddy/deploy/install_service.sh   # 安装为系统服务

# 方式 B：nohup 手动启动
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 \
  --workers 2 > backend.log 2>&1 &

# 验证后端启动
curl http://localhost:8000/health
```

### 第六步：验证

```bash
# 验证 Nginx 静态文件
curl http://localhost/

# 验证 API
curl http://localhost/api/feed

# 生成访问二维码
bash /opt/twinbuddy/deploy/qr.sh
```

---

## 四、API 接口清单

### 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://your-server/` |
| API 前缀 | `/api/` |
| 后端端口 | `8000` |
| 健康检查 | `GET /health` |

### 接口列表

#### 1. 保存引导数据
```
POST /api/onboarding
Content-Type: application/json

Body:
{
  "mbti": "ENFP",
  "interests": ["说走就走", "爱拍照"],
  "voiceText": "我其实不太在意去哪",
  "city": "chengdu",
  "completed": true
}

Response:
{
  "success": true,
  "message": "已保存",
  "user_id": "uuid-xxx",
  "persona_id": "persona-enfp-xxx"
}
```

#### 2. 获取数字孪生人格
```
GET /api/persona?user_id=xxx

Response:
{
  "success": true,
  "data": {
    "persona_id": "...",
    "name": "热情开拓者",
    "avatar_emoji": "🌈",
    "travel_style": "随性探索型",
    "confidence_score": 0.75,
    ...
  }
}
```

#### 3. 获取 Feed 列表
```
GET /api/feed?city=chengdu

Response:
{
  "success": true,
  "data": [
    { "id": "v1", "type": "video", "cover_url": "...", "title": "..." },
    { "id": "v3", "type": "twin_card", "buddy": { "name": "小雅", "mbti": "ENFP", ... } },
    ...
  ],
  "meta": { "total": 5, "city": "chengdu" }
}
```

#### 4. 双数字人协商
```
POST /api/negotiate
Content-Type: application/json

Body:
{
  "user_persona_id": "persona-enfp-xxx",
  "buddy_mbti": "INFP",
  "destination": "dali"
}

Response:
{
  "success": true,
  "data": {
    "destination": "大理",
    "dates": "5月10日-5月15日",
    "budget": "人均3500元",
    "consensus": true,
    "plan": ["洱海边民宿2晚", "古城内民宿3晚", ...],
    "matched_buddies": ["小雅", "小鱼"],
    "radar": [
      { "dimension": "行程节奏", "user_score": 90, "buddy_score": 45, "weight": 0.8 },
      ...
    ],
    "red_flags": [],
    "messages": [
      { "speaker": "user", "content": "...", "timestamp": 1700000000 },
      ...
    ]
  }
}
```

---

## 五、Nginx 配置说明

```nginx
server {
    listen 80;
    server_name your-server-ip;   # 或域名

    root /opt/twinbuddy/frontend/dist;   # ⭐ npm run build 输出目录
    index index.html;

    # 前端路由（React Router）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到 FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 六、生产环境变量（如需要）

```bash
# /opt/twinbuddy/backend/.env
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.example.com
LOG_LEVEL=INFO
```

---

## 七、故障排查

| 问题 | 检查命令 |
|------|---------|
| 后端无法启动 | `python -c "from main import app; print('OK')"` |
| 端口被占用 | `lsof -i :8000` 或 `netstat -tlnp \| grep 8000` |
| Nginx 502 | 检查后端是否在 8000 端口运行 |
| CORS 报错 | 确认 `main.py` 中 `FRONTEND_ORIGIN` 已改为生产域名 |
| 前端 404 | 确认 `dist/` 目录存在且 `nginx.conf` 的 `root` 路径正确 |
| API 返回 404 | 确认 `main.py` 中 `include_router` 正确注册了 `frontend_router` |

---

## 八、一键更新脚本

```bash
# 在服务器上执行，自动拉取最新代码 + 重构部署
bash /opt/twinbuddy/deploy/update.sh
```

---

## 九、域名 + HTTPS（可选）

```bash
# 1. 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 2. 申请 Let's Encrypt 证书
sudo certbot --nginx -d your-domain.com

# 3. 自动续期（Certbot 会配置好 cron）
sudo systemctl status certbot.timer
```

---

## 十、二维码生成

```bash
# 安装 qrencode（CentOS）
sudo yum install qrencode

# 安装 qrencode（Ubuntu）
sudo apt install qrencode

# 生成二维码
URL="http://your-server-ip"
qrencode -o twinbuddy-qr.png -s 10 -m 2 "$URL"

# 或在浏览器直接访问
# https://www.the-qrcode-generator.com/
```
