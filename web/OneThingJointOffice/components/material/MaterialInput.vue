<template>
    <div class="MaterialInput">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-input v-if="show" placeholder="请输入本项内容"
                          :type="info.inputType"
                          v-model="value"
                          :disabled="info.disabled"
                          :show-password="info.inputType === 'password'"
                          :maxlength="info.inputMaxlength > 0 ? info.inputMaxlength : null"
                          :rows="info.inputType === 'textarea' && info.inputRows > 0 ? info.inputRows : null"
                          :show-word-limit="info.inputMaxlength > 0"
                ></el-input>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialInput",
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
                return this.info.value;
            },
            set(value){
                this.info.value = value;
            }
        }
    },
    watch:{
        "info.inputType"(){
            this.reset();
        },
        "info.inputRows"(){
            this.reset();
        },
        "info.inputMaxlength"(){
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
.MaterialInput{
}
</style>