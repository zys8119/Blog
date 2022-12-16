# wp-alert 动态表单实现


Pinia 状态管理 formConfigState.ts

```ts
import {FormDataMapType} from 'wp-alert'
export const getGettersConfig = (data:FormConfigItem[]) => data.map((e:any) => {
    return e.form.map((e:any) => e.modelValue)
}).flat().reduce((a:any, b:any) => {
    Object.assign(a, b)
    return a
}, {})
export const formConfigState = {
    1: [{
        title: '拒绝审核',
        formTitle:'拒绝理由',
        form: [
            {
                type:'input',
                props:{
                    placeholder:'请输入拒绝理由',
                    type:'textarea'
                },
                fieldName:'value',
                modelValue: {
                    value:'请输入拒绝理由',
                }
            }
        ],
        btns:[
            {name:'通过', api:null},
            {name:'不通过', api:null},
        ]
    }],
    2: [{
        title: '超时处理',
        form: [
            {
                type:'radio',
                modelValue:{
                    bbb:'请选择类型',
                },
                fieldName:'bbb',
                options:[
                    {name:'继续执行', value:1},
                    {name:'更换执行', value:2},
                    {name:'重新认领', value:3},
                ],
                conditions:{
                    1:[
                        {form:[
                            {
                                type:'select',
                                label:'新特邀监督员',
                                fieldName:'cccc',
                                modelValue:{
                                    cccc:'cccccc',
                                },
                            }
                        ]}
                    ]
                }
            }
        ],
        btns:[
            {name:'确认', api:null},
            {name:'取消', api:null},
        ]
    }],
    3: [{
        title: '线索审核',
        formTitle:'线索内容',
        form: [
            {
                type:'input',
                label:'线索标题',
                props: {
                    placeholder: '请输入标题',
                },
                fieldName:'value1',
                modelValue: {
                    value1: '请输入拒绝理由',
                }
            },
            {
                type:'input',
                label:'线索内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'file',
                label:'视频图片',
                props: {
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: false,
                }
            }
        ],
        btns: [
            {name: '线索通过', api: null},
            {name: '补充说明', api: null},
        ]
    }],
    4: [{
        title: '线索上报',
        formTitle:'线索内容',
        form: [
            {
                type:'input',
                label:'线索标题',
                props: {
                    placeholder: '请输入标题',
                },
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'input',
                label:'线索内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'file',
                label:'视频图片',
                props: {
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: '请上传视频图片',
                }
            }
        ],
    }],
    5: [{
        title: '线索通过',
        formTitle:'线索内容',
        form: [
            {
                type:'input',
                label:'线索标题',
                props: {
                    placeholder: '请输入标题',
                },
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'input',
                label:'线索内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'file',
                label:'视频图片',
                props: {
                    placeholder: '请输入线索内容',
                },
                modelValue: {
                    value: '请上传视频图片',
                }
            }
        ],
    }],
    6: [{
        title: '任务定性',
        form: [
            {
                type:'radio',
                label:'是否整改',
                modelValue: {
                    value: '请输入拒绝理由',
                }
            },
            {
                type:'input',
                label:'定性标题',
                props: {
                    placeholder: '请输入标题',
                },
                modelValue: {
                    value: '请输入定性标题',
                }
            },
            {
                type:'select',
                label:'问题分类',
                props: {
                    placeholder: '请选择',
                },
                modelValue: {
                    value: '请选择问题分类',
                }
            },
            {
                type:'input',
                label:'定性内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入定性内容',
                }
            },
            {
                type:'radio',
                label:'文件类型',
                modelValue: {
                    value: '请选择文件类型',
                }
            },
            {
                type:'file',
                label:'监督通知书',
                modelValue: {
                    value: '请选择监督通知书',
                }
            },
        ],
        btns: [
            {name: '确认', api: null},
            {name: '取消', api: null},
        ]
    }],
    7: [{
        title: '整改审核',
        formTitle: '整改回复',
        form: [
            {
                type:'radio',
                label:'是否整改',
                modelValue: {
                    value: '请选择是否整改',
                }
            },
            {
                type:'input',
                label:'回复内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入回复内容',
                }
            },
            {
                type:'file',
                label:'整改附件',
                modelValue: {
                    value: '请选择整改附件',
                }
            },
        ],
        btns: [
            {name: '整改通过', api: null},
            {name: '重新整改', api: null},
        ]
    }],
    8: [{
        title: '问题审核',
        formTitle:'问题反馈',
        form: [
            {
                type:'input',
                label:'问题标题',
                props: {
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入问题标题',
                }
            },
            {
                type:'input',
                label:'问题内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入问题内容',
                }
            },
            {
                type:'file',
                label:'视频图片',
                modelValue: {
                    value: '请选择视频图片',
                }
            },
        ],
        btns: [
            {name: '整改下达', api: null},
            {name: '无需整改', api: null},
        ]
    }],
    9: [{
        title: '整改下达',
        form: [
            {
                type:'input',
                label:'整改标题',
                props: {
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入整改标题',
                }
            },
            {
                type:'select',
                label:'问题分类',
                props: {
                    placeholder: '请选择',
                },
                modelValue: {
                    value: '请选择问题分类',
                }
            },
            {
                type:'select',
                label:'整改部门',
                props: {
                    placeholder: '请选择',
                },
                modelValue: {
                    value: '请选择整改部门',
                }
            },
            {
                type:'input',
                label:'整改内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入整改内容',
                }
            },
            {
                type:'radio',
                label:'文件类型',
                modelValue: {
                    value: '请选择文件类型',
                }
            },
            {
                type:'file',
                label:'整改建议书',
                modelValue: {
                    value: '请选择整改建议书',
                }
            },
        ],
        btns: [
            {name: '确认', api: null},
            {name: '取消', api: null},
        ]
    }],
    10: [{
        title: '整改审核',
        formTitle: '整改回复',
        form: [
            {
                type:'radio',
                label:'是否整改',
                modelValue: {
                    value: '请选择是否整改',
                }
            },
            {
                type:'input',
                label:'回复内容',
                props: {
                    type:'textarea',
                    placeholder: '请输入',
                },
                modelValue: {
                    value: '请输入回复内容',
                }
            },
            {
                type:'file',
                label:'整改附件',
                modelValue: {
                    value: '请选择整改附件',
                }
            },
        ],
        btns: [
            {name: '通过', api: null},
            {name: '不通过', api: null},
        ]
    }],
} as FormConfig

export interface FormConfig{
    [key:number]:FormConfigItem[]
}

export type FormConfigItem = {
    [key:string]:any
    // 节点名称
    title?:string
    // 表单名称
    formTitle?:string
    // 表单UI配置
    form:FormConfigItemFormUiType[]
    // 提交按钮配置
    btns?:FormConfigItemButton[]
}
export type FormConfigItemButton = {
    // 按钮名称
    name:string
    // 按钮触发绑定的api接口
    api?:any
}
export type FormConfigItemFormUiType = {
    [key:string]:any
    // 组件ui类型
    type:'input' | 'radio' | 'select' | 'file'
    // 组件默认配置
    props?:Record<any, any>;
    // 组件标题
    label?:string;
    // 绑定字段名称
    fieldName?:string;
    options?:Array<{
        [key:string]:any
        value?:any
        name?:any
    }>;
    // 字段校验规则
    modelValue:FormDataMapType
    // 联动条件
    conditions?:FormConfigItemFormUiTypeConditions
}
export type FormConfigItemFormUiTypeConditions = {
    [fieldValueMap:string | number]:FormConfigItem[]
}
export default defineStore('formConfig', {
    state() {
        return {
            formConfigState,
            configType:2,
            otherConfig:{},
        } as {
            formConfigState:FormConfig
            configType:number
            otherConfig:{
                [key:string | number]:FormDataMapType
            }
        }
    },
    getters:{
        formList() :FormConfigItem[] {
            this.otherConfig = {}
            return this.formConfigState[this.configType] || []
        },
        config():FormDataMapType {
            return Object.assign(getGettersConfig(this.formList), Object.entries(this.otherConfig).reduce((a:any, b:any) => {
                return Object.assign(a, b[1])
            }, {}))
        }
    },
    actions:{
        setOtherConfig(fieldName:string, config:FormDataMapType) {
            this.otherConfig[fieldName] = config || {}
        }
    }
})

```

业务组件 FormMap.vue

```vue
<template>
    <template v-for="(item, key) in configCuur" :key="key">
        <div v-if="item.title" class="title">{{ item.title }}</div>
        <div class="_row">
            <div class="_form" :class="{_form_border:!!item.formTitle}">
                <div v-if="item.formTitle" class="_form_title">{{item.formTitle}}</div>
                <div class="_form_content">
                    <div v-for="(it, k) in item.form" :key="k" class="_form_content_row">
                        <div v-if="it.label" class="_form_content_row_label">{{it.label}}：</div>
                        <div class="_form_content_row_label_content">
<!--                            这里实现对应的组件-->
<!--                            <wp-input v-if="it.type === 'input'" v-bind="it.props" v-model="currFormData[it.fieldName]"/>-->
<!--                            <wp-select v-if="it.type === 'select'" v-bind="it.props" v-model="currFormData[it.fieldName]"/>-->
<!--                            <wp-radio-group v-if="it.type === 'radio'" v-bind="it.props" v-model="currFormData[it.fieldName]">-->
<!--                                <wp-radio v-for="(itt, kk) in (it.options || [])" :key="kk" :value="itt.value">{{ itt.name }}</wp-radio>-->
<!--                            </wp-radio-group>-->
<!--                            <wp-upload v-if="it.type === 'file'" v-bind="it.props"/>-->
                            <FormMap v-if="it.conditions" :config="it.conditionsConfig || []" :formData="formData" :fieldName="it.fieldName"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import {getGettersConfig} from '@/store/modules/formConfig'
const emits = defineEmits(['update:formData'])
const props = defineProps<{
    config:any[]
    formData?:any
    fieldName?:any
}>()
const currFormData = computed<any>({
    get() {
        return props.formData
    },
    set(v) {
        emits('update:formData', v)
    }
})

const getConfig = (it:any) => {
    let config = []
    try {
        config = it.conditions[currFormData.value[it.fieldName]] || []
    } catch (e) {
        config = []
    }
    return config
}
const conditionsConfigInit = (config:any) => {
    return JSON.parse(JSON.stringify((config || []))).map((e:any) => {
        return ({
            ...e,
            form:e.form.map((ee:any) => {
                return ({
                    ...ee,
                    conditionsConfig:getConfig(ee)
                })
            })
        })
    })
}
const configCuur = computed(() => {
    return conditionsConfigInit(props.config)
})
const conditionsValueArr = computed(() => {
    return configCuur.value.map((e:any) => e.form.filter((e:any) => e.conditions).map((ee:any) => ({
        value:props.formData[ee.fieldName],
        fieldName:ee.fieldName,
        conditions:ee.conditions
    }))).flat()
})
watch(conditionsValueArr, (v, v2) => {
    const filterArr = v.filter((e:any, k:any) => e.value !== (v2[k] || {}).value)
    filterArr.forEach((e:any) => {
        nextTick(() => {
            window.store.formConfig.setOtherConfig(e.fieldName, getGettersConfig((e.conditions || [])[e.value] || []))
        })
    })
})
</script>

<style scoped lang="less">
.FormMap {
}
</style>

```
