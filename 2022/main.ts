import {createApp} from 'vue'
import App from './App.vue'
const app = createApp(App)
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'

import route from '@/route/route'
app.use(route)
app.mount('#app')