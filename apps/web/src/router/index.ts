import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'QuotaDashboard',
          component: () => import('@/views/QuotaDashboard.vue'),
          meta: { title: '星环流动仪表数据大盘' }
        },
        {
          path: 'quota',
          name: 'QuotaConsole',
          component: () => import('@/views/QuotaConsole.vue'),
          meta: { title: 'AI 算力控制中心' }
        },
        {
          path: 'watch-simulator',
          name: 'WatchSimulator',
          component: () => import('@/views/WatchSimulator.vue'),
          meta: { title: 'Redmi Watch 6 模拟器' }
        },
        {
          path: 'app-hub',
          name: 'AppHub',
          component: () => import('@/views/AppHub.vue'),
          meta: { title: '我的应用生态' }
        }
      ]
    }
  ]
})

export default router
