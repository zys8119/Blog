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
                <mavon-editor v-model="value" class="mavon-editor" v-bind="config"/>
            </template>
            <template #right>
                <router-view/>
            </template>
        </wp-layout-split>
    </div>
</template>

<script setup lang="ts">
import {bus} from 'wujie'
const value = ref('')
// https://www.npmjs.com/package/mavon-editor/v/next
const config = ref({
    defaultOpen:'edit',
})
bus.$on('ppt-load', () => {
    bus.$emit('ppt', value.value)
})
watch(value, () => {
    localStorage.setItem('ppt-vue', value.value)
    bus.$emit('ppt', value.value)
})
onBeforeMount(() => {
    if (localStorage.getItem('ppt-vue')) {
        value.value = localStorage.getItem('ppt-vue') as string || ''
    }
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
import {RouteRecordRaw} from 'vue-router'
import {plugin, cacheOptions} from 'wujie'

export default [
    {
        path:'ppt',
        name:'ppt',
        meta:{
            notFlat:true,
            isFullPage:true,
        },
        component:() => import('@/views/PPT/PPT.vue'),
        children:[
            {
                path:'wujie-ppt',
                name:'wujie-ppt',
                component:() => import('@/components/WujieVueRouterView.vue'),
                props:{
                    config:{
                        wujie:{
                            title:'无界ppt在线编辑',
                            appName:'无界ppt在线编辑',
                            //todo 填写您的演示文档地址
                            host:'页面地址',
                            execFun() {
                                (function _THIS_PPT_VM_INIT_() {
                                    if (window._THIS_PPT_VM_) {
                                        window.$wujie.bus.$on('ppt', function(mdLocal:string) {
                                            const vm = window._THIS_PPT_VM_
                                            try {
                                                for (const [k, v] of Object.entries(vm.exposed)) {
                                                    (window as any)[`$$${k}`] = v
                                                }
                                            } catch (e) {
                                                console.error(e)
                                            }
                                            try {
                                                Promise.all((mdLocal.match(/<style.*lang.*less(.|\n)*?style>/img) || ['']).map(function(styleLess:any) {
                                                    const arr = styleLess.split('\n')
                                                    const body = arr.slice(1, arr.length - 1).join('\n')
                                                    return new Promise(function(resolve) {
                                                        window.less.render(body).then(function(res) {
                                                            resolve(Object.assign(res, {
                                                                body,
                                                                styleLess,
                                                                css:res.css.replace(/;/img, ' !important;')
                                                            }))
                                                        }).catch(function(e) {
                                                            console.error(e)
                                                        })
                                                    })
                                                })).then(function(res) {
                                                    res.forEach(function(it:any) {
                                                        mdLocal = mdLocal.replace(it.body, it.css)
                                                    })
                                                    Promise.all((mdLocal.match(/<script(.|\n)*?script>/img) || ['']).map(function(js:any) {
                                                        const arr = js.split('\n')
                                                        const body = arr.slice(1, arr.length - 1).join('\n')
                                                        return new Promise(function(resolve) {
                                                            resolve({
                                                                js,
                                                                body,
                                                            })
                                                        })
                                                    })).then(function(res) {
                                                        res.forEach(function(it:any) {
                                                            mdLocal = mdLocal.replace(it.js, '')
                                                            try {
                                                                eval(it.body)
                                                            } catch (e) {
                                                                console.error( e)
                                                            }
                                                        })
                                                        vm.exposed.mdLocal.value = mdLocal
                                                        vm.exposed.init()
                                                    })
                                                })
                                            } catch (e) {
                                                console.error( e)
                                            }
                                        })
                                        window.$wujie.bus.$emit('ppt-load')
                                    } else {
                                        requestAnimationFrame(_THIS_PPT_VM_INIT_)
                                    }
                                })()
                            },
                            config:{
                                degrade:true,
                                plugins:[
                                    {
                                        jsBeforeLoaders:[
                                            {
                                                src:'https://unpkg.com/less@4.1.3/dist/less.js'
                                            }
                                        ],
                                    }
                                ] as plugin[],
                            } as cacheOptions,
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
