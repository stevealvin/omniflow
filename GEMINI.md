# Omniflow 项目规则 (Project Rules)

## 项目概述

Omniflow 是一个 AI 算力配额聚合监控平台（星环流动），基于 Monorepo 结构：
- `apps/api` — Hono.js + TypeScript 后端服务
- `apps/web` — Vue 3 + Ant Design Vue + Tailwind CSS 前端

---

## 代码质量规范

### TypeScript
- **严禁使用 `any` 类型**，必须明确声明类型。唯一例外：第三方库类型缺失时用 `unknown` 代替。
- **严禁多字段 Fallback 链**，例如 `bkt.displayName || bkt.bucketId || '默认值'`。
  应直接取 `bkt.displayName`，若数据为空则交给上游修复，不在前端掩盖问题。
- 所有函数必须有明确的返回类型注解。
- 使用 `type` 而非 `interface` 定义数据结构（与现有 codebase 保持一致）。
- 改动后必须运行 `npx tsc --noEmit`（api）和 `npx vue-tsc --noEmit`（web）确保 0 错误。

### Vue 3 / 前端
- 使用 `<script setup lang="ts">` 语法，不使用 Options API。
- 组件命名使用 PascalCase，文件命名与组件名一致。
- 不允许在模板中写复杂逻辑，应提取为 `computed` 或独立函数。
- Tailwind 类名优先使用设计系统中已有的 token，避免随意使用任意值（`[xxx]`），除非确实需要精确像素控制。

---

## 架构约束

### 后端 (apps/api)
- **路由层** (`routes/`) 只负责参数校验和调用 Service，不包含业务逻辑。
- **Service 层** (`services/`) 负责业务逻辑，调用 Provider。
- **Provider 层** (`services/providers/`) 负责与外部 API 通信，每个 Provider 对应一个外部服务。
- 新增 Provider 必须继承 `BaseProvider`，实现 `fetchQuota()` 方法。
- HTTP 工具统一使用 `apps/api/src/utils/http.ts`，不允许直接调用 `fetch`。

### 前端 (apps/web)
- 全局状态统一在 `stores/` 中用 Pinia 管理，不允许在组件内直接发起 API 请求。
- 路由配置集中在 `router/index.ts`，每个路由必须包含 `meta.title`。
- 当前路由表（不可随意新增，需与用户确认）：
  - `/` → QuotaDashboard（星环流动仪表数据大盘）
  - `/quota` → KeyQuotaManager（AI 配额监控）
  - `/watch-simulator` → WatchSimulator（Redmi Watch 6 模拟器）
  - `/alerts` → AlertSettings（星环通知与路由）
  - `/app-hub` → AppHub（扩展应用中心）

---

## UI / 设计规范

- **设计风格**：现代极简 + 毛玻璃（Glassmorphism），深色/浅色双模式。
- **圆角**：卡片用 `rounded-2xl` / `rounded-3xl`，小元素用 `rounded-lg` / `rounded-xl`。
- **间距**：卡片内边距 `p-4`，区块间距 `space-y-3`，细节行间距 `space-y-1` ~ `space-y-2`。
- **字体大小**：
  - 标题：`text-base` / `text-sm font-bold`
  - 正文：`text-xs` / `text-sm`
  - 辅助信息（标签、倒计时括号）：`text-[10px]`
  - Monospace 数值：`font-mono font-bold`
- **颜色语义**：
  - 主色调：`indigo-500/600`（Antigravity）、`emerald-500/600`（Codex/正常状态）
  - 警告：`amber-500`（>15% 且 ≤50%）
  - 危险：`rose-500`（≤15%）
  - 成功/健康：`emerald-500`（>50%）
- **不允许**在卡片主内容区使用重度阴影（`shadow-lg` 以上），hover 状态例外。
- **进度条**：统一使用 `h-1 rounded-full`（细条），总量仪表盘使用 `a-progress type="dashboard"`。

---

## 提交规范

- Commit 消息格式：`<type>: <简洁中英文描述>`
  - `feat:` 新功能
  - `fix:` Bug 修复
  - `refactor:` 重构（无功能变化）
  - `style:` 纯 UI/样式调整
  - `chore:` 构建/工具变更
- 每次提交前确保：
  1. `tsc --noEmit` 和 `vue-tsc --noEmit` 均通过（0 错误）
  2. 没有遗留 `console.log` 调试代码

---

## 禁止事项

- 不允许硬编码任何 Token、Secret、API Key 在源码中
- 不允许在前端直接存储用户凭据（明文 refreshToken 只在数据库中存储）
- 不允许使用 `v-html` 渲染用户输入内容（XSS 风险）
- 不允许删除已有的 JSDoc 注释和类型定义，除非用户明确要求
- 不允许引入新的重量级 UI 库（当前已用 Ant Design Vue，不再额外引入）
