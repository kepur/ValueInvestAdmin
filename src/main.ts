import './assets/main.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'virtual:svg-icons-register'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'  // 用于处理UTC时间
import timezone from 'dayjs/plugin/timezone' // 用于处理时区

const app = createApp(App)
dayjs.extend(utc)
dayjs.extend(timezone)
//引入自定义插件对象
import globalComponent from './components/RegistComponents'
app.config.globalProperties.$dayjs = dayjs
app.use(createPinia())
app.use(ElementPlus)
app.use(globalComponent)
app.use(router)
app.mount('#app')