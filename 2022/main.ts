import {createApp} from 'vue'
import App from './App.vue'
const app = createApp(App)
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'
import 'reveal.js/plugin/highlight/monokai.css'
import 'github-markdown-css'
import '@/assets/less/overrides.less'
import route from '@/route/route'
app.use(route)
app.mount('#app')
