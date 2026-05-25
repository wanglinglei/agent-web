import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../pages/home/HomePage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'agents-home',
      component: HomePage,
      meta: {
        title: 'Agent 工作台首页',
      },
    },
    {
      path: '/weather',
      name: 'agents-weather',
      component: () => import('../pages/weather/WeatherPage.vue'),
      meta: {
        title: '天气 Agent',
      },
    },
    {
      path: '/email',
      name: 'agents-email',
      component: () => import('../pages/email/EmailPage.vue'),
      meta: {
        title: '邮件 Agent',
      },
    },
    {
      path: '/boundary-svg',
      name: 'agents-boundary-svg',
      component: () => import('../pages/boundary-svg/BoundarySvgPage.vue'),
      meta: {
        title: '边界 SVG Agent',
      },
    },
    {
      path: '/template-data',
      name: 'agents-template-data',
      component: () => import('../pages/template-data/TemplateDataPage.vue'),
      meta: {
        title: '模板扩展 Agent',
      },
    },
  ],
});

router.afterEach((to) => {
  if (typeof document !== 'undefined') {
    document.title =
      typeof to.meta.title === 'string' ? to.meta.title : 'Agent Web';
  }
});
