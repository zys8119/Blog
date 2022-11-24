# vue3 表单提交通用逻辑

```vue
<template>
    <div class="AddFzlly">
        <AlertContent>
            <wp-input v-model="fromData.name" :disabled="isView" />
        </AlertContent>
        <alert-footer :hiddenConfirm="isView" @save="save"/>
    </div>
</template>

<script setup lang="ts">
const $store = window.store
const props = defineProps<{
    row:any
    isView:boolean
}>()
type FromDataMapType = {
    msg:string
    check?:(value:any)=> any
}

const fromDataMap = ref < Record<string, FromDataMapType | string>>({
    'name': '请输入姓名',
    'phone': {
        msg:'请输入联系方式',
        check:value => !/1[0-9]{10}/.test(value) ? '手机号格式错误' : null
    },
    // 其他字段条件
})
const fromData = ref<any>(Object.fromEntries(Object.keys(fromDataMap.value).map((e:any) => [e, (props.row || {})[e]])))
const emit = defineEmits(['save'])
const save = async() => {
    const isNotVerifyKeyName:string = Object.keys(fromData.value).find((k:any) => !fromData.value[k] || (fromDataMap.value[k] as any)?.check?.(fromData.value[k])) as string
    const {msg, check} = fromDataMap.value[isNotVerifyKeyName] as FromDataMapType || {}
    const value = fromData.value[isNotVerifyKeyName]
    const checkMsg = check?.(value)
    if (isNotVerifyKeyName || checkMsg) {
        return window.$toast.error((value ? checkMsg : ( msg || fromDataMap.value[isNotVerifyKeyName])) as string)
    }
    if (props.row) {
        // 修改接口
        // await window.api.**
    } else {
        // 创建接口
        // await window.api.**
    }
    window.$toast.success('保存成功')
    emit('save')
    return true
}
</script>

<style scoped lang="less">
.AddFzlly {
}
</style>

```
