# 无界ppt在线编辑

```typescript
export default [
    {
        path:'ppt',
        name:'ppt',
        meta:{
            notFlat:true,
            isFullPage:true,
        },
        component:()=>import("@/views/PPT/PPT.vue"),
        children:[
            {
                path:'wujie-ppt',
                name:'wujie-ppt',
                component:()=>import('@/components/WujieVueRouterView.vue'),
                props:{
                    config:{
                        wujie:{
                            title:'无界ppt在线编辑',
                            appName:'无界ppt在线编辑',
                            host:'页面地址',
                            execFun(){
                                const css = document.createElement('style')
                                css.innerHTML = `.Home{position: absolute;}`
                                window.document.body.appendChild(css)
                                window.$wujie.bus.$on("ppt", function (mdLocal:string) {
                                    const vm = window._THIS_PPT_VM_
                                    try {
                                        vm.exposed.mdLocal.value = mdLocal
                                        vm.exposed.init()
                                    }catch (e) {}
                                })
                            },
                            config:{
                                degrade:true
                            }
                        }
                    }
                },
                meta:{
                    isFullPage:true,
                    title: '演示文档在线编辑'
                }
            }
        ]
    },
] as RouteRecordRaw[]
```
