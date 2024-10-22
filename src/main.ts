import { createApp } from 'vue'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import { initStores } from '@/store'

async function bootstrap() {
  const app = createApp(App)

  await initStores(app)

  app.mount('#app')
}

bootstrap()
