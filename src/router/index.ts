// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/index'
    },
    {
      path: '/index',
      name: 'index',
      component: IndexView,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { requiresAuth: true}
        },
        {
          path: 'usermgm',
          name: 'usermgm',
          component: () => import('@/views/user/UserMgm.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'role',
          name: 'role',
          component: () => import('../views/user/UserRole.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        // normal user
        {
          path: 'auditlog',
          name: 'auditlog',
          component: () => import('../views/AuditLog.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'portfolioanalysis',
          name: 'portfolioanalysis',
          component: () => import('../views/user/PortfolioAnalysisView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'permission',
          name: 'permission',
          component: () => import('../views/user/PermissionView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'notification',
          name: 'notification',
          component: () => import('@/views/user/NotificationSettingView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'dailyprofit',
          name: 'dailyprofit',
          component: () => import('../views/tread/DailyProfitVIew.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'realtrade',
          name: 'realtrade',
          component: () => import('../views/tread/RealTradeView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'transactionhistory',
          name: 'transactionhistory',
          component: () => import('../views/tread/TransactionHistoryView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'simulationtrade',
          name: 'simulationtrade',
          component: () => import('../views/tread/SimulationTradeView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'investmentinsitution',
          name: 'investmentinsitution',
          component: () => import('../views/coininfo/InvestmentInstitutionView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'investcycle',
          name: 'investcycle',
          component: () => import('../views/invest/InvestmentCycle.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'investmentstatge',
          name: 'investmentstatge',
          component: () => import('../views/invest/InvestmentStage.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'investmentallocation',
          name: 'investmentallocation',
          component: () => import('../views/invest/InvestmentAllocation.vue'),
          meta: { requiresAuth: true }
        },

        {
          path: 'strategy',
          name: 'strategy',
          component: () => import('../views/invest/StrategyView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'timesegment',
          name: 'timesegment',
          component: () => import('../views/invest/TimeSegmentView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'eventcalendar',
          name: 'eventcalendar',
          component: () => import('../views/events/EventCalendarView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'eventtype',
          name: 'eventtype',
          component: () => import('../views/events/EventTypeView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'recommendation',
          name: 'recommendation',
          component: () => import('../views/events/RecommendationView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'socialmetric',
          name: 'socialmetric',
          component: () => import('../views/events/SocialMetricView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'coin',
          name: 'coin',
          component: () => import('../views/coininfo/CoinView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'cointype',
          name: 'cointype',
          component: () => import('../views/coininfo/CoinTypeView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ecosystem',
          name: 'ecosystem',
          component: () => import('../views/coininfo/EcosystemView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'founder',
          name: 'founder',
          component: () => import('../views/coininfo/FounderView.vue'),
          meta: { requiresAuth: true }
        },

      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore()
//   const { token, userRoles } = storeToRefs(authStore)

//   authStore.loadStoredToken()

//   console.log('star check router')

//   if (to.meta.requiresAuth && !authStore.isAuthenticated()) {

//     return next({ name: 'login' })
//   }

//   if (to.meta.requiresAdmin && !userRoles.value.includes('admin')) {
//     return next({ name: 'home' }) 
//   }


//   if (authStore.isAuthenticated() && to.path === '/login') {
//     return next({ name: 'home' })
//   }

//   next()
// })

export default router
