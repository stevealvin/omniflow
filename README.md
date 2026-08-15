<div align="center">

# 🪐 星环流动 (OmniFlow)
**个人全栈开发者 AI 算力资产与多端微服务控制中枢**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Hono.js](https://img.shields.io/badge/Hono.js-Edge_Ready-E36002?style=flat-square&logo=hono&logoColor=white)](https://hono.dev/)
[![Xiaomi Vela](https://img.shields.io/badge/Xiaomi_Vela-Quick_App-FF6900?style=flat-square&logo=xiaomi&logoColor=white)](https://iot.mi.com/vela/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>一站式聚合监控 Token Plane 托管账号与 API Key 算力配额，无缝连通 Web 仪表盘与智能穿戴抬腕视角。</b>
</p>

</div>

---

## 🌟 核心特性 (Key Features)

- ⚡ **AI 算力配额全景洞察**：
  - 实时解析并聚合 Google Antigravity（Gemini / Claude / GPT 模型组）与 OpenAI Codex 托管账号配额。
  - 精准计算 5 小时重置窗口、每周重置倒计时与使用百分比。
- 🛡️ **API Key 智能探针与健康检测**：
  - 自动向各大模型上游接口发送探针检测，获取实时 RPM、TPM 剩余容量及网络往返延迟（Latency）。
- ⌚ **穿戴端抬腕视角（Xiaomi Vela OS 快应用）**：
  - 专为智能手表（如 Redmi Watch 系列）优化的穿戴端快应用，椭圆表盘边缘自适应。
  - 底层原生 10 秒超时防护、离线缓存毫秒级无缝回退，支持「刷新数据」与「同步配额」双操作。
- 🌌 **个人 AI 应用生态矩阵 (App Hub)**：
  - 集中聚合管理个人构建的垂直 AI 微服务入口（如 [镜头工坊 LensCraft](https://shotcraft.nle.lol)、[幻笔 AI HuanBi](https://storyforge.nle.lol)），支持一键直达与状态感知。
- 🎨 **Apple 极简设计美学与毛玻璃质感**：
  - 全面遵循 **Tailwind CSS v4** 规范语法，支持沉浸式深色 / 浅色模式切换与柔和多层环境光影。

---

## 🏗️ 架构与工程结构 (Monorepo Architecture)

项目基于现代 Monorepo 架构组织代码：

```
omniflow/
├── apps/
│   ├── api/             # 后端服务：Hono.js + TypeScript (支持常驻 Node & Vercel Edge Serverless)
│   │   ├── src/
│   │   │   ├── routes/          # 路由层：/api/quota 等
│   │   │   ├── services/        # 业务逻辑与数据持久化
│   │   │   ├── services/providers/ # Google Antigravity & OpenAI Codex 探针聚合
│   │   │   └── utils/           # 统一 HTTP 请求工具
│   │   └── ...
│   ├── web/             # 前端控制台：Vue 3 + Tailwind CSS v4 + Antdv Next + Pinia
│   │   ├── src/
│   │   │   ├── views/           # 仪表大盘、算力中心、应用生态
│   │   │   ├── stores/          # 全局状态管理 (quota, theme)
│   │   │   └── layouts/         # Apple 风格布局骨架
│   │   └── ...
│   └── watch-app/       # 手表穿戴端：Xiaomi Vela 快应用工程 (aiot-toolkit)
│       ├── src/
│       │   ├── pages/index/     # 手表首页：配额卡片流与双操作按钮
│       │   ├── pages/detail/    # 详情页：子模型配额分配与细项展示
│       │   ├── pages/settings/  # 设置页：后端 API 地址配置与连通性测试
│       │   └── common/          # 通用 API、存储与格式化工具库
│       └── ...
├── api/                 # Vercel 根目录云函数入口 (Runtime: Edge)
└── package.json         # Workspace 顶层配置
```

---

## 🛠️ 技术栈 (Tech Stack)

| 模块 | 核心技术 / 工具库 |
| :--- | :--- |
| **Web 前端** | Vue 3 (Composition API / `<script setup>`), Vite, Tailwind CSS v4, Ant Design Vue (antdv-next), Pinia, Lucide Icons |
| **API 服务端** | Hono.js, TypeScript, Supabase (@supabase/supabase-js), Axios |
| **穿戴应用** | Xiaomi Vela OS 快应用框架, aiot-toolkit, ES6+ |
| **部署托管** | Vercel (Edge Functions + Static Web) |

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 2. 安装依赖
在项目根目录下执行：
```bash
npm install
```

### 3. 配置环境变量
在 `apps/api` 目录下创建 `.env` 文件（或在 Vercel 环境变量中配置）：
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 4. 启动本地开发
在根目录下一键并行启动 Web 与 API：
```bash
npm run dev
```
- **Web 前端**：`http://localhost:5173`
- **后端 API**：`http://localhost:3000`

---

## ⌚ 穿戴应用开发与发布 (Watch App)

进入 `apps/watch-app` 目录：

```bash
cd apps/watch-app

# 1. 启动本地调试监听
npm run start

# 2. 构建开发版 RPK 安装包
npm run build

# 3. 构建正式 Release 签名发布包
npm run release
```
构建产物 `.rpk` 文件将输出至 `apps/watch-app/dist/` 目录，可通过小米快应用伴侣或 AIoT-IDE 直接安装至真机。

---

## 📋 提交与代码规范

本项目遵循以下严格质量规范：
- **Tailwind CSS v4**：严禁使用 v3 废弃类名（如使用 `bg-linear-to-r` 替代 `bg-gradient-to-r`，使用后置 `!` 修饰符等）。
- **质量门禁**：提交前确保 `npx tsc --noEmit` 与 `npm run build:web` 均为 0 错误，且无调试语句残留。

---

## 📄 开源许可证 (License)

本项目基于 [MIT License](LICENSE) 协议开源。
