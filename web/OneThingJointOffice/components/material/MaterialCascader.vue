<template>
    <div class="MaterialCascader">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-cascader
                    v-model="value"
                    :options="options"
                    :disabled="info.disabled"
                    :filterable="info.filterable"
                    :props="{
                        label:'name',
                        value:'id',
                        multiple:info.multiple,
                        checkStrictly:true,
                    }"
                    :clearable="info.multiple"
                    ></el-cascader>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialCascader",
    props:{
        info:{type:Object,default:Object},
        merge:{type:Function,default:Function},
    },
    data(){
        return {
            show:true,
        }
    },
    computed: {
        value:{
            get(){
                return this.info.value || [];
            },
            set(value){
                this.info.value = value;
            }
        },
        options:{
            get(){
                return this.info.options || [];
            },
            set(value){
                this.info.options = value;
            }
        }
    },
    watch:{
        "info.filterable"(){
            this.reset();
        },
        "info.multiple"(){
            this.reset();
        },
        options(){
            this.reset();
        }
    },
    methods:{
        reset(){
            this.value = null;
            this.show = false;
            this.$nextTick(()=>{
                this.show = true;
            })
        }
    }
}
</script>

<style scoped lang="less">
.MaterialCascader{
}
</style>