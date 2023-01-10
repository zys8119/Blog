# 无界ppt在线编辑

## 依赖

[mavon-editor文档](https://www.npmjs.com/package/mavon-editor/v/next)

```npm i mavon-editor ```

[wujie文档](https://wujie-micro.github.io/doc/guide/share.html)

```npm i wujie ```

## 代码

vue页面代码

```vue
<template>
    <div class="PPT">
       <wp-layout-split>
           <template #left>
               <mavon-editor class="mavon-editor" v-model="value" v-bind="config"/>
           </template>
           <template #right>
               <router-view></router-view>
           </template>
       </wp-layout-split>
    </div>
</template>

<script setup lang="ts">
import {bus} from "wujie"
const value = ref('')
// https://www.npmjs.com/package/mavon-editor/v/next
const config = ref({
    defaultOpen:'edit',
})
watchEffect(()=>{
    bus.$emit('ppt', value.value)
})

</script>

<style scoped lang="less">
.PPT {
    iframe{
        margin: 0;
        padding: 0;
        border:none;
        width: 100%;
        height: 100%;
    }
    :deep(.mavon-editor){
        width: 100%;
        height: 100%;
    }
}
</style>

```

路由配置

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
                            //todo 填写您的演示文档地址
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
