import 'vue-router'
import {Options} from 'reveal.js'
declare module 'vue-router' {
    interface RouteMeta {
        title?: string
    }
}

declare global {
    interface Window {
        revealJsConfig:Options
        _THIS_PPT_VM_:any
    }
}
