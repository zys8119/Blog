<template>
    <div class="MaterialRadio">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-radio-group v-model="value" :disabled="info.disabled">
                    <el-radio :label="item" v-for="(item,key) in (info.options || [])" :key="key">{{ item }}</el-radio>
                </el-radio-group>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialRadio",
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
    }
}
</script>

<style scoped lang="less">
.MaterialRadio{
}
</style>