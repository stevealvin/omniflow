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
          meta: { title: '智能算力中枢' }
        },
        {
          path: 'app-hub',
          name: 'AppHub',
          component: () => import('@/views/AppHub.vue'),
          meta: { title: '我的应用生态' }
        },
        {
          path: 'market',
          name: 'MarketCharts',
          component: () => import('@/views/MarketCharts.vue'),
          meta: { title: '全球宏观与加密行情看板' }
        }
      ]
    }
  ]
})

export default router
