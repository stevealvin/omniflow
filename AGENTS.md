# Omniflow 项目规则 (Project Rules)

## 🛑 核心操作红线（最高执行约束 - 绝对禁止项）

> [!CAUTION]
> **以下为最高优先级禁令，任何子任务、修复流程、连续会话中均不得违背：**

1. 🚫 **严禁自动执行 Git 提交或推送（Zero Auto-Commit / Auto-Push）**：
   - 无论完成何种 Bug 修复、功能开发、配置调整或优化，**改动必须且只能保留在本地工作区（Working Directory）**。
   - **严禁**在修复完成、跑通测试或回答问题后“顺手”自动调用 `git commit` 或 `git push`。
   - **唯一触发条件**：只有当用户在当前会话中**明确发出**包含「提交」「推送」「commit」「push」的独立指令时，方可执行 `git commit` / `git push`。
2. 🚫 **严禁遗留调试代码**：
   - 提交前必须全局检查并清理所有 `console.log` 临时调试语句。
3. 🚫 **严禁假定/掩盖上游数据缺陷**：
   - 严禁在前端写多字段 Fallback 链（如 `bkt.displayName || bkt.bucketId || '默认值'`），字段为空应直接定位并修复上游，不得掩盖。

---

## 🎨 Tailwind CSS v4 规范语法（严禁使用 v3 废弃写法）

项目已全面升级至 **Tailwind CSS v4**，所有样式必须严格遵循 v4 Canonical Classes 规范：

| 样式类别 | ✅ Tailwind CSS v4 规范写法 (必须使用) | ❌ v3 废弃/不合规写法 (严禁使用) |
| :--- | :--- | :--- |
| **透明度修饰符** | **标准百分比整数**：<br>`dark:border-white/8`<br>`dark:border-white/6`<br>`dark:border-white/4`<br>`bg-black/80` | **小数任意值写法**：<br>`dark:border-white/[0.08]`<br>`dark:border-white/[0.06]`<br>`dark:border-white/[0.04]`<br>`bg-black/[0.8]` |
| **尺寸与最小宽高** | **4px 乘数网格规范**：<br>`min-w-42.5!` (170px)<br>`min-w-45` (180px)<br>`h-8.5!` (34px)<br>`w-44` | **硬编码像素任意值**：<br>`min-w-[170px]!`<br>`min-w-[180px]`<br>`h-[34px]!` |
| **渐变背景方向** | `bg-linear-to-r`<br>`bg-linear-to-br`<br>`bg-linear-to-t` | `bg-gradient-to-r`<br>`bg-gradient-to-br`<br>`bg-gradient-to-t` |
| **Important 修饰符** | **后置感叹号**：<br>`rounded-full!`<br>`h-10!`<br>`bg-indigo-600!`<br>`p-0!` | **前置感叹号**：<br>`!rounded-full`<br>`!h-10`<br>`!bg-indigo-600`<br>`!p-0` |
| **微型阴影** | `shadow-2xs`<br>`shadow-xs` | `shadow-sm` (用于微小阴影时) |
| **微型毛玻璃** | `backdrop-blur-xs`<br>`backdrop-blur-sm` | `backdrop-blur-[2px]` |
| **固定宽高比** | `aspect-16/9`<br>`aspect-4/3`<br>`aspect-square` | `aspect-[16/9]`<br>`aspect-[4/3]` |
| **Linter 规范** | 必须严格遵循编辑器 `tailwindcss(suggestCanonicalClasses)` 提示修正所有类名 | 随意使用任意值（`[...]`） |

---

## 项目概述与 Monorepo 架构约束

Omniflow（星环流动）基于 Monorepo 架构：
- `apps/api` — Hono.js + TypeScript 后端服务（支持本地常驻 Node 与 Vercel Edge Serverless 运行）
- `apps/web` — Vue 3 + Ant Design Vue + Tailwind CSS v4 前端应用
- `api/` — Vercel 根目录云函数适配入口（`api/index.ts` 启用 `runtime: 'edge'`）

### 后端规范 (apps/api)
- **路由层 (`routes/`)**：只负责参数提取、校验和调用 Service，不包含具体业务逻辑。
- **Service 层 (`services/`)**：负责核心业务逻辑与数据聚合。
- **Provider 层 (`services/providers/`)**：负责与各外部大模型/上游接口通信，各 Provider 互相独立。
- **HTTP 工具**：统一使用 `apps/api/src/utils/http.ts`，禁止裸写 `fetch`。

### 前端规范 (apps/web)
- 使用 `<script setup lang="ts">` 单文件组件语法，不使用 Options API。
- 模板（Template）保持精简，复杂计算与多重过滤逻辑必须提取至 `computed` 或独立 helper 函数。
- 全局配额与探针状态统一在 `stores/quota.ts` 中用 Pinia 管理。
- 路由集中在 `router/index.ts`，所有路由条目必须包含 `meta.title`。

---

## UI / 设计规范 (Apple Design & Glassmorphism)

- **设计风格**：现代极简 + Apple 毛玻璃（Glassmorphism），支持深色/浅色双模式。
- **圆角规范**：
  - 大卡片与主容器：`rounded-3xl` / `rounded-2xl`
  - 按钮与小控件：`rounded-2xl` / `rounded-xl`
- **间距规范**：
  - 卡片内边距：`p-4` ~ `p-5`
  - 区域间距：`space-y-4` ~ `space-y-6`
  - 细节行间距：`space-y-1` ~ `space-y-2`
- **字体与排版**：
  - 标题：`tracking-tight font-extrabold text-base` ~ `text-xl`
  - 正文：`text-xs` / `text-sm`
  - 辅助与标签：`text-[10px]` / `text-[11px]`
  - 数值与指标：`font-mono font-black tracking-tight`
- **按压与动态反馈**：
  - 交互按钮与卡片增加按压物理反馈：`active:scale-[0.98] transition-all duration-100 ease-out`。
- **颜色语义**：
  - Antigravity 主色：`indigo-500/600`
  - Codex / 正常状态：`emerald-500/600`
  - 警告状态（>15% 且 ≤50%）：`amber-500`
  - 危险状态（≤15%）：`rose-500`
- **阴影与光泽**：
  - 卡片主内容区使用多层柔和环境光影：`shadow-[0_8px_30px_rgba(0,0,0,0.04)]`
  - 悬停渐变微光：`hover:shadow-[0_16px_40px_rgba(79,70,229,0.12)]`

---

## 提交规范与质量门禁

- **提交触发前置条件**：
  1. 必须收到用户明确发出的「提交」「推送」「commit」「push」指令；
  2. 运行 `npx tsc --noEmit`（API）与 `npx vue-tsc --noEmit`（Web）**两项检查均为 0 错误**；
  3. 全局确认没有遗留 `console.log`。
- **Commit 消息格式**：`<type>: <简洁中英文描述>`
  - `feat:` 新功能
  - `fix:` Bug 修复
  - `refactor:` 重构（无功能变化）
  - `style:` 纯 UI/样式调整
  - `chore:` 构建/配置/依赖变更
