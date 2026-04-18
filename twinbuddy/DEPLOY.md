# TwinBuddy 部署指南

> 本文档让你的项目通过 GitHub 推送后自动部署到 Railway（后端）和 Vercel（前端）。
> **配置文件已就绪，只需手动操作一次，后续全自动。**

---

## 当前架构

```
GitHub push
    │
    ├── Railway 自动拉取 → twinbuddy/backend
    │       ↓
    │   https://xxx.railway.app  (后端 API)
    │
    └── Vercel 自动拉取 → twinbuddy/frontend
            ↓
        https://xxx.vercel.app  (前端页面)
            ↓
        前端调用 Railway 后端 API
```

---

## 部署步骤（只需做一次）

### Step 1：Railway 部署后端

1. 打开 https://railway.app → **Login** → 用 GitHub 账号登录
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 搜索并选择 `passionworkeer/twinbuddy`
4. ⚠️ **重要：设置 Root Directory**
   - Railway 会部署整个仓库，需要指定到后端目录
   - 在项目设置中找到 **Root Directory**，填入：`twinbuddy/backend`
   - （或者 Railway 创建后，在 Settings → Source → Root Directory 修改）
5. 添加环境变量（Environment Variables）：
   ```
   MINIMAX_API_KEY   = 你的 MiniMax API Key（找我要或者去 MiniMax 平台拿）
   ALLOW_ALL_ORIGINS = 1
   ```
6. 点击 **Deploy Now**
7. 等待 ~2-3 分钟，状态变成 ✅ **Deployed**
8. 复制 Railway 给你的 URL，格式类似：
   ```
   https://twinbuddy-backend.railway.app
   ```
   ⚠️ **把这个 URL 保存好，Step 3 要用**

---

### Step 2：Vercel 部署前端

1. 打开 https://vercel.com → **Login** → 用 GitHub 账号登录
2. 点击 **Add New** → **Project**
3. 找到 `passionworkeer/twinbuddy`，点击 **Import**
4. ⚠️ **设置目录和变量**：
   - **Framework Preset**：选择 **Vite**（如果没有自动识别的话）
   - **Root Directory**：填 `./` 或者保持默认（因为 vercel.json 在 `twinbuddy/frontend/` 里）
   - **Environment Variables**：点击 **Add** 添加：
     ```
     VITE_API_BASE = https://twinbuddy-backend.railway.app
     ```
     ⚠️ 把这里的 URL 换成 **Step 1 拿到的 Railway URL**
   - 如果 Vercel 有 **Build Command** 字段，确保是 `npm run build`
   - 如果有 **Output Directory** 字段，确保是 `dist`
5. 点击 **Deploy**
6. 等待 ~1-2 分钟，状态变成 ✅
7. 复制 Vercel 给你的 URL，格式类似：
   ```
   https://twinbuddy-xxx.vercel.app
   ```

---

### Step 3：告诉 Railway 允许前端访问（最后一步）

1. 回到 Railway 项目 → **Settings** → **Environment**
2. 添加一个新环境变量：
   ```
   FRONTEND_ORIGIN = https://twinbuddy-xxx.vercel.app
   ```
   ⚠️ 把这里换成 **Step 2 拿到的 Vercel URL**
3. Railway 会**自动重新部署**，等 1-2 分钟

---

### ✅ 部署完成！

现在你可以访问：
- 前端：`https://twinbuddy-xxx.vercel.app`
- 后端：`https://twinbuddy-backend.railway.app/health`

把前端链接发给大家，二维码永久有效 ✅

---

## 后续更新（全自动）

以后代码更新只需要：

```bash
# 1. 正常改代码
cd E:/desktop/hecker

# 2. 提交并推送
git add .
git commit -m "feat: 你的改动描述"
git push
```

**推送后自动触发：**
- Railway 自动拉取后端代码 → 自动部署（约 2-3 分钟）
- Vercel 自动拉取前端代码 → 自动部署（约 1-2 分钟）

**无需登录 Railway/Vercel，完全自动化。**

---

## 注意事项

### 关于 Railway URL 稳定性

Railway 的 URL（如 `twinbuddy-backend.railway.app`）通常很稳定，但如果：
- 删除了 Railway 项目
- 改了项目名称

URL 会变化，需要手动更新 Vercel 的 `VITE_API_BASE` 环境变量。

### 关于环境变量

| 变量名 | 位置 | 说明 |
|--------|------|------|
| `MINIMAX_API_KEY` | Railway | MiniMax LLM API Key，必填 |
| `ALLOW_ALL_ORIGINS` | Railway | `1` 表示允许所有前端访问 |
| `FRONTEND_ORIGIN` | Railway | 填 Vercel 的 URL，安全起见加一层来源限制 |
| `VITE_API_BASE` | Vercel | 填 Railway 的 URL |

### 关于免费额度

| 平台 | 免费额度 | 说明 |
|------|---------|------|
| Railway | 500 小时/月 | 一个月够用，超了实例会休眠（访问时自动唤醒）|
| Vercel | 无限次 | 100GB 带宽/月，够个人/黑客松用 |

---

## 常见问题

**Q: 部署失败了怎么办？**
A: Railway/Vercel 控制台都有日志，截图发我，我来帮你排查。

**Q: MiniMax API Key 是什么？在哪里拿？**
A: MiniMax 是 AI 模型服务商，如果之前本地跑的时候有用，说明你已经配置过。Key 在 MiniMax 开放平台网站注册后可以拿到。

**Q: 链接失效了怎么办？**
A: 重新执行 Step 1/2/3 即可，通常只是环境变量填错了。

---

*文档更新：2026-04-18*
