<template>
    <div class="MaterialSelect">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <el-select v-if="show"  v-model="value"
                           :disabled="info.disabled"
                           placeholder="请选择"
                           :filterable="info.filterable"
                           :multiple="info.multiple">
                    <el-option
                        v-for="item in (info.options || [])"
                        :key="item"
                        :label="item"
                        :value="item">
                    </el-option>
                </el-select>
            </el-form-item>

        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialSelect",
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
                if(this.info.multiple){
                    if(typeof this.info.value === 'string'){
                        try {
                            return  JSON.parse(this.info.value) || [];
                        }catch (e){
                            return  [];
                        }
                    }
                    return  this.info.value || [];
                }
                return this.info.value;
            },
            set(value){
                this.info.value = value;
            }
        }
    },
    watch:{
        "info.multiple"(){
            this.reset();
        },
        "info.filterable"(){
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
.MaterialSelect{
}
</style>