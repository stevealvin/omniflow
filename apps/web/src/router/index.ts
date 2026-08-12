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
          name: 'KeyQuotaManager',
          component: () => import('@/views/KeyQuotaManager.vue'),
          meta: { title: 'AI 配额监控' }
        },
        {
          path: 'watch-simulator',
          name: 'WatchSimulator',
          component: () => import('@/views/WatchSimulator.vue'),
          meta: { title: 'Redmi Watch 6 模拟器' }
        },
        {
          path: 'alerts',
          name: 'AlertSettings',
          component: () => import('@/views/AlertSettings.vue'),
          meta: { title: '星环通知与路由' }
        },
        {
          path: 'app-hub',
          name: 'AppHub',
          component: () => import('@/views/AppHub.vue'),
          meta: { title: '扩展应用中心' }
        }
      ]
    }
  ]
})

export default router
