import {createRouter, createWebHashHistory} from 'vue-router'
const routes = createRouter({
    history:createWebHashHistory(),
    routes:[
        {
            path:'/',
            component:() => import('@/view/Home/Home.vue'),
            meta:{
                title:'asdas'
            }
        }
    ]
})

routes.beforeEach((to, from, next) => {
    document.title = to.meta?.title || '演示模版'
    next()
})
export default routes
