<template>
    <div class="MaterialDatePicker">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-date-picker
                    :disabled="info.disabled"
                    v-model="value"
                    :type="info.datePickerType"
                    :value-format="info.datePickerValueFormat"
                    :format="info.datePickerValueFormat"
                    :range-separator="info.datePickerRangeSeparator"
                    placeholder="请选择时间">
                </el-date-picker>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialDatePicker",
    props:{
        info:{type:Object,default:Object},
        merge:{type:Function,default:Function},
    },
    data(){
        return {
        }
    },
    computed: {
        value:{
            get(){
                return this.info.value;
            },
            set(value){
                this.info.value = value;
            }
        }
    },
    watch:{
        "info.datePickerDefaultNowDate"(val){
            if(val){
                this.value = new Date();
            }else {
                this.value = null;
            }
        }
    }
}
</script>

<style scoped lang="less">
.MaterialDatePicker{
}
</style>