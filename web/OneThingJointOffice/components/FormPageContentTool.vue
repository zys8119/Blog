<template>
    <div class="FormPageContentTool" v-if="data">
        <div class="FormPageContentToolContent">
            <el-form>
                <el-form-item label="元件名称："><span class="f_w">{{data.name}}</span></el-form-item>
                <el-form-item label="是否必填：">
                    <el-switch v-model="info.required"></el-switch>
                </el-form-item>
                <!--选项数据-->
                <template>
                    <el-form-item label="是否禁用：" >
                        <el-switch v-model="info.disabled"></el-switch>
                    </el-form-item>
                </template>
                <el-form-item label="表单字段名：">
                    <el-input placeholder="请输入" v-model="info.fieldName"></el-input>
                </el-form-item>
                <el-form-item label="表单名称：">
                    <el-input placeholder="请输入" v-model="info.label"></el-input>
                </el-form-item>
                <el-form-item label="表单label宽度：">
                    <el-input placeholder="请输入" v-model="info.labelWidth"></el-input>
                </el-form-item>
                <el-form-item label="数据校验规则：" >
                    <div>
                        <el-select filterable @change="value = null" v-model="info.rules" placeholder="请选择" multiple clearable>
                            <el-option
                                v-for="(item,key) in rulesOptions"
                                :key="key"
                                :label="item.name"
                                :value="item.name">
                            </el-option>
                        </el-select>
                    </div>
                </el-form-item>
                <!--选项数据-->
                <template v-if="['MaterialRadio','MaterialCheckbox','MaterialSelect'].includes(data.component)">
                    <el-form-item label="选项数据：" >
                        <div v-for="(item,key) in options" :key="key">
                            <el-input placeholder="请输入选项数据" v-model="options[key]"></el-input>
                        </div>
                        <div><el-button @click="options.push(`选项${options.length+1}`)" type="text" icon="el-icon-circle-plus-outline">添加一个选项</el-button></div>
                    </el-form-item>
                </template>
                <!--输入框-->
                <template v-if="['MaterialInput'].includes(data.component)">
                    <el-form-item label="输入框类型：" >
                        <div>
                            <el-select filterable @change="value = null" v-model="info.inputType" placeholder="请选择">
                                <el-option
                                    v-for="(item,key) in inputTypeOptions"
                                    :key="key"
                                    :label="item.name"
                                    :value="item.value">
                                </el-option>
                            </el-select>
                        </div>
                    </el-form-item>
                    <el-form-item label="限制输入长度：" >
                        <div><el-input-number v-model="info.inputMaxlength" label="请输入"></el-input-number></div>
                    </el-form-item>
                    <el-form-item label="文本域行数：" v-if="info.inputType === 'textarea'" >
                        <div><el-input-number v-model="info.inputRows" label="请输入"></el-input-number></div>
                    </el-form-item>
                </template>
                <!--日期-->
                <template v-if="['MaterialDatePicker'].includes(data.component)">
                    <el-form-item label="日期类型：" >
                        <div>
                            <el-select filterable @change="value = null" v-model="info.datePickerType" placeholder="请选择">
                                <el-option
                                    v-for="(item,key) in datePickerTypeList"
                                    :key="key"
                                    :label="item.name"
                                    :value="item.value">
                                </el-option>
                            </el-select>
                        </div>
                    </el-form-item>
                    <el-form-item label="日期格式：" >
                        <div><el-input placeholder="请输入日期格式,例如 yyyy-MM-dd HH:mm:ss" v-model="info.datePickerValueFormat"></el-input></div>
                    </el-form-item>
                    <el-form-item label="分隔符：" >
                        <div><el-input placeholder="请输入分隔符" v-model="info.datePickerRangeSeparator"></el-input></div>
                    </el-form-item>
                    <el-form-item label="是否默认当前时间：" >
                        <el-switch v-model="info.datePickerDefaultNowDate"></el-switch>
                    </el-form-item>
                </template>
                <!--下拉-->
                <template v-if="['MaterialSelect'].includes(data.component)">
                    <el-form-item label="是否多选：" >
                        <el-switch v-model="info.multiple"></el-switch>
                    </el-form-item>
                    <el-form-item label="是否可搜索：" >
                        <el-switch v-model="info.filterable"></el-switch>
                    </el-form-item>
                </template>
                <!--文件上传-->
                <template v-if="['MaterialFileUpload'].includes(data.component)">
                    <el-form-item label="是否多文件上传：" >
                        <el-switch v-model="info.multiple"></el-switch>
                    </el-form-item>
                    <el-form-item label="是否拖拽上传：" >
                        <el-switch v-model="info.uploadDrag"></el-switch>
                    </el-form-item>
                    <el-form-item label="上传按钮文字：" >
                        <div><el-input placeholder="请输入" v-model="info.uploadText"></el-input></div>
                    </el-form-item>
                    <el-form-item label="上传个数：" >
                        <div><el-input placeholder="请输入数字" v-model="info.uploadLimit"></el-input></div>
                    </el-form-item>
                    <el-form-item label="上传类型：" >
                        <div><el-input placeholder="请输入" v-model="info.uploadListType"></el-input></div>
                    </el-form-item>
                    <el-form-item label="上传字段名：" >
                        <div><el-input placeholder="请输入" v-model="info.uploadFileName"></el-input></div>
                    </el-form-item>
                    <el-form-item label="限制上传格式：" >
                        <div><el-input :disabled="['image','video'].includes(data.type)" placeholder="请输入格式，例如：.png,image/*" v-model="info.uploadAccept"></el-input></div>
                    </el-form-item>
                </template>
                <!--级联-->
                <template v-if="['MaterialCascader'].includes(data.component)">
                    <el-form-item label="选项数据：" >
                        <el-button type="primary" @click="MaterialCascaderSetData">点击设置数据</el-button>
                    </el-form-item>
                    <el-form-item label="是否可搜索：" >
                        <el-switch v-model="info.filterable"></el-switch>
                    </el-form-item>
                    <el-form-item label="是否多选：" >
                        <el-switch v-model="info.multiple"></el-switch>
                    </el-form-item>
                </template>
                <!--默认数据值-->
                <template v-if="['MaterialRadio','MaterialCheckbox','MaterialSelect'].includes(data.component)">
                    <el-form-item label="默认数据值：" >
                        <div><el-input :placeholder="placeholder" v-model="value"></el-input></div>
                    </el-form-item>
                </template>
            </el-form>
        </div>
    </div>
</template>

<script>
import lodash from "lodash"
import rulesOptions from "./rulesOptions"
export default {
    name: "FormPageContentTool",
    props:{
        data:{type:Object,default:null}
    },
    data(){
        return {
            ...rulesOptions,
        }
    },
    computed: {
        info:{
            get(){
                return this.data.info;
            },
            set(value){
                this.$emit('update:data',lodash.merge(this.data.info,value));
            }
        },
        options:{
            get(){
                return this.info.options;
            },
            set(value){
                this.info.options = value;
            }
        },
        value:{
            get(){
                return this.info.value;
            },
            set(value){
                this.info.value = value;
            }
        },
        placeholder(){
            let str = "请输入默认值"
            switch (this.data.component){
            case 'MaterialCheckbox':
                str+= "，例如：['选项1']"
            break;
            }
            return  str;
        }
    },
    methods:{
        // 级联数据
        MaterialCascaderSetData(){
            this.$ZAlert.show({
                title:"设置级联数据",
                width:"1000px",
                components:require("./Alert/AddMaterialCascaderSetData"),
                props:{
                    data:()=>this.options,
                },
                _event:{
                    save:options=>{
                        this.options = options;
                    }
                }
            })
        }
    }
}
</script>

<style scoped lang="less">
.FormPageContentTool{
    .FormPageContentToolContent{
        padding: @unit15;
        background-color: #d8d8d8;
        position: fixed;
        max-height: 70%;
        overflow: auto;
        width: 400px;
        width: calc(400px - @unit15*2);
        .f_w{
            font-weight: bold;
        }
        /deep/.el-form-item{
            margin-bottom: 10px;
        }
    }
}
</style>