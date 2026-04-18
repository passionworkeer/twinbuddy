# 孪生搭子 TwinBuddy

> 你的另一个你，已经替你搞定了。
>
> 你的数字孪生体，在后台为你找搭子。

---

## 产品介绍

**TwinBuddy** 是一个基于数字孪生体的智能搭子匹配产品。

它的核心体验不是"给你一个工具，你自己去找搭子"，而是——

> **你正常刷抖音，一张 AI 卡片弹出来：你的数字孪生体已经帮你和对方聊过了，行程排好了，搭子也筛出来了，你只需要点"同意"。**

### 核心功能

| 功能 | 说明 |
|------|------|
| MBTI 人格测试 | 16型人格测试，了解你的旅行偏好 |
| 兴趣标签 | 18个精选标签，多选匹配 |
| 语音描述 | 支持语音输入，描述你理想的搭子 |
| 智能匹配 | 基于人格计算的搭子兼容性评分 |
| 双数字人协商 | 两个 AI 替你谈判行程细节 |
| 雷达图可视化 | 六维度展示兼容度 |

---

## 在线体验

**访问地址：** http://120.77.36.107

### 使用流程

1. **选择 MBTI** - 16型人格，找到你的类型
2. **选择兴趣** - 18个标签，多选更精准
3. **描述偏好** - 语音或文字，说出你的理想搭子
4. **刷 Feed** - 模拟抖音体验
5. **懂你卡片** - 等待卡片弹出，查看协商结果

---

## 技术架构

```
前端（React + Vite + Tailwind）
    ↓ HTTP API
后端（FastAPI + LangGraph）
    ↓
数字孪生体生成 + 兼容性评分 + Agent 协商
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React, TypeScript, Tailwind CSS |
| 后端 | FastAPI, Python |
| AI | LangGraph Agent, MBTI 人格分析 |
| 存储 | localStorage（前端）|

---

## 本地开发

### 环境要求

- Node.js 18+
- Python 3.10+

### 启动后端

```bash
cd twinbuddy/backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 启动前端

```bash
cd twinbuddy/frontend
npm install
npm run dev
```

### 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000/docs

---

## 项目结构

```
twinbuddy/
├── frontend/          # React 前端
│   ├── src/
│   │   ├── pages/   # 页面组件
│   │   ├── components/  # 可复用组件
│   │   └── api/     # API 客户端
├── backend/           # FastAPI 后端
│   ├── api/         # API 路由
│   ├── agents/      # Agent 模块
│   └── negotiation/  # 协商状态机
└── docs/            # 产品文档
```

---

## 数据说明

> 本产品为 Demo 阶段，使用模拟数据。

| 数据类型 | 来源 |
|----------|------|
| MBTI | 用户手动选择 |
| 兴趣标签 | 用户手动选择 |
| 搭子人格 | 20个预设 Mock 人格 |
| 兼容性评分 | MING 算法计算 |

---

## 未来愿景

- 接入抖音真实数据，更精准的数字人
- 扩展到美食、赛事、演唱会等场景
- 数字孪生体持续学习进化

---

*2026 深圳大学城站 Hackathon*
