import {createRouter, createWebHashHistory} from 'vue-router'
const routes = createRouter({
    history:createWebHashHistory(),
    routes:[
        {
            path:'/',
            component:() => import('@/view/Home/Home.vue'),
        }
    ]
})

routes.beforeEach((to, from, next) => {
    if (to.meta?.title) {
        document.title = to.meta?.title
    }
    next()
})
export default routes
