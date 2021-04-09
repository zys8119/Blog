<template>
    <div class="MaterialCascader">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <Wangeditor v-model="value"></Wangeditor>
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
    },
    watch:{
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