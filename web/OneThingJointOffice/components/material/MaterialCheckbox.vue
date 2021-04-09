<template>
    <div class="MaterialCheckbox">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-checkbox-group v-model="value" :disabled="info.disabled">
                    <el-checkbox :label="item" v-for="(item,key) in (info.options || [])" :key="key">{{ item }}</el-checkbox>
                </el-checkbox-group>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialCheckbox",
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
                if(typeof this.info.value === 'string'){
                    try {
                        return  JSON.parse(this.info.value) || [];
                    }catch (e){
                        return  [];
                    }
                }
                return this.info.value || [];
            },
            set(value){
                this.info.value = value;
            }
        }
    }
}
</script>

<style scoped lang="less">
.MaterialCheckbox{
}
</style>