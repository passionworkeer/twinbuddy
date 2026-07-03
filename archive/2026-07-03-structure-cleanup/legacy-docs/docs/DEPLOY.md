# TwinBuddy 部署指南

> 目标：后端 Railway，前端 Vercel
> 更新：2026-04-25

---

## 一、项目现状确认

### 当前文件结构

```
ecker/
├── twinbuddy/frontend/     ← 前端（部署到 Vercel）
├── api/                     ← 后端（部署到 Railway）
├── railway.toml            ← Railway 启动配置 ✅
├── Procfile                ← 兜底启动文件 ✅
├── requirements.txt        ← Python 依赖 ✅
└── vercel.json             ← ❌ 根目录旧配置，需删除
```

### 关键文件状态

| 文件 | 状态 | 说明 |
|------|------|------|
| `railway.toml` | ✅ 已创建 | 告诉 Railway 怎么启动 |
| `Procfile` | ✅ 已创建 | 兜底启动命令 |
| `requirements.txt` | ✅ 已有 | Python 依赖 |
| `vercel.json`（根目录）| ⚠️ 待删除 | 会干扰 Vercel 部署 |

---

## 二、后端部署到 Railway

### 2.1 先删根目录旧 vercel.json

```bash
cd E:/desktop/hecker
rm vercel.json
git add -A
git commit -m "chore: remove old root vercel.json"
git push
```

### 2.2 Railway 面板配置

访问：https://railway.app/project/twinbuddy

**Build 设置：**
- Builder：**Railpack**（不是 Metal！）
- Root Directory：留空（默认项目根目录）
- Build Command：留空（railway.toml 自动处理）
- Start Command：留空（railway.toml 自动处理）

**Variables（环境变量）配置：**
```
MINIMAX_API_KEY = 你的MiniMax密钥
XFYUN_APP_ID = 你的讯飞AppId
XFYUN_API_KEY = 你的讯飞ApiKey
XFYUN_API_SECRET = 你的讯飞ApiSecret
```

**设置完成后触发部署：**
任意 Git push 都会自动触发，或手动点 Deploy。

### 2.3 验证后端

访问：`https://twinbuddy-production.up.railway.app/api/health`

期望返回：
```json
{"status": "healthy", "service": "twinbuddy-api"}
```

Swagger 文档：`https://twinbuddy-production.up.railway.app/docs`

---

## 三、前端部署到 Vercel

### 3.1 Vercel 控制台设置

访问：https://vercel.com/dashboard

1. **Import GitHub 仓库**：`passionworkeer/twinbuddy`
2. **Root Directory**：`twinbuddy/frontend/`
3. **Build Command**：`npm run build`（Vercel 自动识别）
4. **Output Directory**：`dist`

### 3.2 环境变量（Vercel Dashboard → Settings → Environment Variables）

| 变量名 | 值 |
|--------|-----|
| `VITE_API_BASE` | `https://twinbuddy-production.up.railway.app` |
| `VITE_WS_BASE` | `wss://twinbuddy-production.up.railway.app` |

**注意：** 不是 `.env.local` 文件配，是在 Vercel Dashboard 里填！

### 3.3 部署

Save 后点击 **Deploy**，Vercel 自动构建并发布。

### 3.4 验证前端

访问 Vercel 分配的域名，期望：Feed 页面正常渲染，能看到搭子卡片。

---

## 四、故障排查

### Railway 报错 "No start command detected"

**原因：** Railway 没读取到 railway.toml 或格式错误。

**解决：**
1. 确认 `railway.toml` 已推送到 GitHub
2. Railway 面板 → Build → Builder 选 **Railpack**（不是 Metal）
3. 点 **Redeploy**

### Railway 报错 "Error creating build plan with Railpack"

**原因：** Metal Build Environment 与 Railpack 不兼容。

**解决：**
1. Railway 面板 → Build
2. 找到 **Metal Build Environment**
3. **取消勾选**
4. 点 **Redeploy**

### Vercel 读不到 API 请求

**原因：** `VITE_API_BASE` 没配或值不对。

**解决：**
1. Vercel Dashboard → Settings → Environment Variables
2. 确认 `VITE_API_BASE = https://twinbuddy-production.up.railway.app`（末尾无 `/`）
3. Redeploy

### 本地能跑但 Railway 报错 ModuleNotFoundError

**原因：** 本地装了但 requirements.txt 里没写。

**解决：**
```bash
pip freeze > requirements.txt
git add requirements.txt
git commit -m "fix: update requirements.txt"
git push
```

---

## 五、完整 Git 提交流程

```bash
cd E:/desktop/hecker

# 1. 删除根目录旧 vercel.json
rm vercel.json

# 2. 确认 railway.toml 和 Procfile 存在
ls railway.toml Procfile

# 3. 提交
git add -A
git commit -m "chore: clean deployment config for railway + vercel"
git push

# 4. 等待 Railway 自动部署（约 2 分钟）
# 然后验证
curl https://twinbuddy-production.up.railway.app/api/health
```

---

## 六、部署后验证清单

```
[ ] Railway /api/health 返回 healthy
[ ] Railway /docs 可以打开 Swagger
[ ] Vercel 部署成功，无报错
[ ] 前端页面能加载
[ ] 点击任意搭子卡片能发起协商
[ ] 协商结果能正确显示
```

---

## 七、相关链接

- Railway：https://railway.app/project/twinbuddy
- Vercel：https://vercel.com/dashboard
- GitHub：https://github.com/passionworkeer/twinbuddy
- 后端域名：https://twinbuddy-production.up.railway.app
- 后端文档：https://twinbuddy-production.up.railway.app/docs
