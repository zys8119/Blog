import {App, h} from "vue"
import {Dialog, DialogOptions, closeAllModals, ModalProps} from "wisdom-plus"
import {merge} from "lodash"
import CommonModalHeader from "@/components/CommonModalHeader.vue"
export const alertPlug = (options:Partial<DialogOptions & AlertOptions> = {}) => Dialog(merge({
    showFooter:false,
    content: h(defineComponent({
        data(){
            return {
                components:null
            }
        },
        setup() {
            console.log()
            return () => [
                h(CommonModalHeader,{
                    title:options.title,
                    onClose:()=>{
                        closeAllModals()
                    }
                }),
                h(Object.prototype.toString.call(options.components) === '[object Promise]' ? defineAsyncComponent(()=> options.components) as any : options.components, merge({
                    title:options.props,
                }, options.props), options.children),
            ]
        }
    }))
}, options, {
    title:false,
    props:merge({
        class:"common-wp-modal",
        showClose:false,
        width:"1000px",
    }, options.modalProps)
}))

alertPlug.install = (app: App<Element>) => {
    app.config.globalProperties.$alert = alertPlug
    window.$alert = alertPlug
}

alertPlug.close = closeAllModals

interface AlertOptions {
    components?:any
    title?:any
    props?:Record<string, any>
    modalProps?: Partial<ModalProps> & Record<string, any>;
    children?: any []
}

declare global {
    interface Window {
        $alert:typeof alertPlug
    }
}
declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        readonly $alert: typeof alertPlug;
    }
}

export default alertPlug
