import { createRouter, createWebHistory } from 'vue-router'
import InputProdukView from '@/views/InputProdukView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'input-produk',
      component: InputProdukView,
    },
  ],
})

export default router
