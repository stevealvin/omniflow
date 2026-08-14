<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'antdv-next'
import {
  ExternalLink,
  Copy,
  Sparkles,
  Clapperboard,
  BookOpen,
  CheckCircle2,
  Globe,
  Plus,
  Compass,
  Zap,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Film,
  Feather
} from '@lucide/vue'

interface PersonalApp {
  id: string
  name: string
  englishName: string
  url: string
  cover: string
  description: string
  detailedDesc: string
  status: 'online' | 'beta' | 'dev'
  platform: string
  icon: any
  accentGradient: string
  badgeStyle: string
  tags: string[]
  features: string[]
  badge: string
}

const apps = ref<PersonalApp[]>([
  {
    id: 'lenscraft',
    name: '镜头工坊',
    englishName: 'LensCraft',
    url: 'https://shotcraft.nle.lol',
    cover: '/covers/lenscraft-cover.svg',
    description: '输入剧本通过 AI 生成影视资产和分镜提示词',
    detailedDesc: '面向影视编导与视觉创作者的 AI 分镜工业化平台。深度解析剧本文本、角色动作与场景机位，一键批量输出专业级光影参数、视听语言设定与 Midjourney / Stable Diffusion 分镜提示词资产包。',
    status: 'online',
    platform: 'Vercel Edge',
    icon: Clapperboard,
    accentGradient: 'from-cyan-500 to-blue-600',
    badgeStyle: 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/80',
    tags: ['剧本拆解', '分镜资产', 'Midjourney', 'Stable Diffusion', '机位光影'],
    features: [
      '剧本场景自动语义解析与分镜镜头切分',
      '专业摄影机参数、景别构图与氛围提示词',
      '一键导出工业级视觉资产清单与制作包'
    ],
    badge: '影视工业级'
  },
  {
    id: 'huanbi',
    name: '幻笔 AI',
    englishName: 'HuanBi',
    url: 'https://storyforge.nle.lol',
    cover: '/covers/huanbi-cover.svg',
    description: '通过 AI 编写长篇小说、架构世界观与章节续写',
    detailedDesc: '专为网文作家与世界观设计师打造的百万字长篇小说创作引擎。支持复杂世界观设定、多卷主线剧情逻辑树与立体人物关系网，具备长上下文逻辑记忆，保障超长篇幅创作始终连贯。',
    status: 'online',
    platform: 'Vercel Edge',
    icon: Feather,
    accentGradient: 'from-purple-500 to-indigo-600',
    badgeStyle: 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/80',
    tags: ['长篇小说', '世界观架构', '多卷大纲', '剧情逻辑树', '智能续写'],
    features: [
      '宏大世界观设定、势力分布与伏笔追踪',
      '多卷剧情大纲架构与人物命运网络推演',
      '沉浸式章节自动续写与文风自适应调优'
    ],
    badge: '长篇创作引擎'
  }
])

const isAddModalVisible = ref(false)

const openApp = (url: string) => {
  window.open(url, '_blank')
}

const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url)
  message.success('已复制应用访问地址到剪贴板')
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- 1. 顶栏控制台 Banner (Apple Translucent Chrome Header) -->
    <div class="rounded-3xl border border-slate-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border-t border-t-white/80 dark:border-t-white/10 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
              <Compass class="w-3.5 h-3.5 text-indigo-500" />
              应用矩阵与生态中枢
            </span>
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
              集中管理与快速直达个人构建的垂直 AI 生产力工具
            </span>
          </div>
          <h1 class="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            我的应用生态 (Personal AI Apps)
          </h1>
        </div>

        <!-- 顶部操作按钮 -->
        <div class="flex items-center gap-2.5 shrink-0">
          <a-button
            type="primary"
            @click="isAddModalVisible = true"
            class="inline-flex items-center gap-1.5 font-bold rounded-2xl text-xs h-10! px-4! bg-linear-to-r! from-indigo-600! to-indigo-500! hover:from-indigo-500! hover:to-indigo-400! shadow-md shadow-indigo-500/20 border-0 active:scale-[0.98] transition-all duration-100 ease-out"
          >
            <template #icon>
              <Plus class="w-4 h-4" />
            </template>
            注册新应用
          </a-button>
        </div>
      </div>

      <!-- 数据快照指标行 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">线上已发布应用</span>
            <div class="text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white">{{ apps.length }} 个</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
            <Layers class="w-4 h-4" />
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">边缘托管平台</span>
            <div class="text-lg font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">Vercel Edge</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-500 shrink-0 shadow-2xs">
            <Globe class="w-4 h-4" />
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 backdrop-blur-md flex items-center justify-between col-span-2 sm:col-span-1">
          <div class="space-y-0.5">
            <span class="text-[11px] text-slate-400 font-medium">服务运行状态</span>
            <div class="text-lg font-black font-mono tracking-tight text-sky-600 dark:text-sky-400">100% 正常在线</div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-sky-500 shrink-0 shadow-2xs">
            <ShieldCheck class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 应用卡片列表 Grid (Apple Glass Material + 16:9 Artwork Showcase) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-7">
      <div
        v-for="app in apps"
        :key="app.id"
        class="group rounded-3xl border border-slate-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-indigo-300/80 dark:hover:border-indigo-700/80 transition-all duration-300 ease-out backdrop-blur-md overflow-hidden flex flex-col justify-between"
      >
        <div class="space-y-4">
          <!-- 封面图视觉预览区 (16:9 Ratio with Hover Zoom & Floating Status Tag) -->
          <div class="relative w-full aspect-16/9 bg-slate-950 overflow-hidden cursor-pointer" @click="openApp(app.url)">
            <img
              :src="app.cover"
              :alt="app.name"
              class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            
            <!-- 遮罩渐变与高光 -->
            <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <!-- 封面左上角：服务状态角标 -->
            <div class="absolute top-3.5 left-3.5 flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
                <span class="w-2 h-2 rounded-full! bg-emerald-400 animate-pulse inline-block"></span>
                在线运行
              </span>

              <span :class="['px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md', app.badgeStyle]">
                {{ app.badge }}
              </span>
            </div>

            <!-- 封面右上角：快捷直达图标 -->
            <div class="absolute top-3.5 right-3.5">
              <button
                @click.stop="openApp(app.url)"
                class="w-9 h-9 rounded-full! bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
                title="在新标签页中打开"
              >
                <ArrowUpRight class="w-4 h-4" />
              </button>
            </div>

            <!-- 封面底部标题与副标题 -->
            <div class="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
              <div>
                <h2 class="text-xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-md">
                  {{ app.name }}
                  <span class="text-xs font-bold font-mono text-slate-300 tracking-normal px-2 py-0.5 rounded-lg bg-white/10 backdrop-blur-xs">
                    {{ app.englishName }}
                  </span>
                </h2>
                <p class="text-xs text-slate-300 mt-1 font-medium drop-shadow-xs line-clamp-1">
                  {{ app.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- 卡片主体内容区 -->
          <div class="p-5 space-y-4">
            <!-- 详细说明 -->
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {{ app.detailedDesc }}
            </p>

            <!-- 核心特性列表 -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-2">
              <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
                核心生产力特性
              </div>
              <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-1">
                <li v-for="(feat, idx) in app.features" :key="idx" class="flex items-start gap-2">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>

            <!-- 标签组 -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tag in app.tags"
                :key="tag"
                class="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-zinc-700/60"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- 卡片底栏操作区 -->
        <div class="px-5 py-2.5 mt-auto border-t border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <!-- 网址展示与复制 -->
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px]" :title="app.url">
              {{ app.url.replace('https://', '') }}
            </span>
            <button
              @click="copyUrl(app.url)"
              class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="复制网址"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 主直达按钮 -->
          <a-button
            type="primary"
            @click="openApp(app.url)"
            class="inline-flex items-center justify-center gap-1.5 font-bold rounded-xl! text-[11px] h-8! px-3.5! bg-linear-to-r! from-indigo-600! to-indigo-500! hover:from-indigo-500! hover:to-indigo-400! shadow-xs shadow-indigo-500/20 border-0 active:scale-[0.98] transition-all duration-100 shrink-0"
          >
            立即开启应用
            <ExternalLink class="w-3 h-3" />
          </a-button>
        </div>
      </div>
    </div>

    <!-- 注册新应用 Modal 弹窗 -->
    <a-modal
      v-model:open="isAddModalVisible"
      title="注册新 AI 微服务或扩展应用"
      @ok="isAddModalVisible = false"
      ok-text="确认添加"
      cancel-text="取消"
      class="rounded-3xl"
      width="520px"
    >
      <div class="py-4 space-y-4 text-xs">
        <p class="text-slate-500 dark:text-slate-400 leading-relaxed">
          您可以将自己开发的个人独立应用、Vercel 部署项目或微服务接入 Omniflow 矩阵生态，统一聚合监控与一键直达。
        </p>

        <div class="space-y-3">
          <div class="space-y-1">
            <label class="font-bold text-slate-700 dark:text-slate-300">应用名称</label>
            <a-input placeholder="例如: 智能研报助手" class="!rounded-xl" />
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-700 dark:text-slate-300">访问地址 URL</label>
            <a-input placeholder="https://your-app.vercel.app" class="!rounded-xl" />
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-700 dark:text-slate-300">功能简述</label>
            <a-textarea placeholder="简要描述核心使用场景与解决的痛点" :rows="3" class="!rounded-xl" />
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>
