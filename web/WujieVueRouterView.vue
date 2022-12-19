<template>
    <div ref="container" class="WujieVueRouterView"/>
</template>

<script setup lang="ts">
import {setupApp, startApp, destroyApp, cacheOptions} from 'wujie'
const props = defineProps<{
    config:AppTypeMap
}>()
const container = ref()
const route = useRoute()
interface AppTypeMap {
    [key:string | number]:AppTypeMapConfig
}
type AppTypeMapConfig = {
    appName:string
    host?:string
    maxTime?:number
    getUserInfo?():Promise<string>
    execFun?(config:AppTypeMapConfig):void
    config?:cacheOptions
}
const appTypeMap = computed<AppTypeMap>(() => (props.config || {}))
const appInfo = computed<AppTypeMapConfig>(() => appTypeMap.value[route.query.appType as any])
const appIds = ref<Array<string>>([])
const setupWuJieApp = async() => {
    if (!appInfo.value?.appName) {return}
    setupApp({
        name:appInfo.value?.appName,
        el:container.value,
        url:`${appInfo.value.host || ''}${route.query.url || ''}`,
        loadError(url, err) {
            console.log(url, err)
            window?.$toast?.error?.(err.message)
        },
        ...(appInfo.value.config || {}),
        plugins:[
            {
                jsBeforeLoaders:[
                    {content:`(${(function(userInfo: { [s: string]: unknown; } | ArrayLike<unknown>) {
                            for (const [key, value] of Object.entries((userInfo || {}))) {
                                if (typeof value === 'string') {
                                    sessionStorage.setItem(key, value)
                                    localStorage.setItem(key, value)
                                }
                            }
                        }).toString()})(${await appInfo.value.getUserInfo?.()})`},
                ].concat(appInfo.value?.execFun ? [
                    {content:`(${appInfo.value?.execFun.toString().replace('execFun', 'function')})(${JSON.stringify(appInfo.value)})`}
                ] : [])
            },
        ].concat((appInfo.value.config?.plugins || []) as any),
    })
    await startApp({
        name:appInfo.value?.appName,
    } as any)
}
const isMounted = ref(false)
onMounted(() => {
    appIds.value = []
    isMounted.value = true
})
onActivated(() => {
    appIds.value = []
    isMounted.value = true
})
watchEffect(async() => {
    if (isMounted.value && appInfo.value?.appName) {
        appIds.value.push(appInfo.value?.appName)
        await setupWuJieApp()
    }
})
onBeforeUnmount(() => {
    isMounted.value = false
    appIds.value.forEach(appId => {
        destroyApp(appId)
    })
})
</script>

<style scoped lang="less">
.WujieVueRouterView{
    width: 100%;
    height: 100%;
    margin: -15px;
    :deep(iframe){
        border: none;
        background-color: transparent;
    }
}
</style>
