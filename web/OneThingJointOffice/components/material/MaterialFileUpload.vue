<template>
    <div class="MaterialFileUpload">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <upload v-if="show"
                    :action="info.action"
                    :multiple="info.multiple"
                    :drag="info.uploadDrag"
                    :accept="info.uploadAccept"
                    :limit="limit"
                    :disabled="info.disabled"
                    :listType="info.uploadListType"
                    :name="info.uploadFileName"
                    ref="upload"
                    @on-success="onSuccess"
                >
                    <el-button type="primary" v-if="!info.uploadDrag">{{ info.uploadText }}</el-button>
                </upload>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialFileUpload",
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
        limit(){
            return this.info.uploadLimit ? parseInt(this.info.uploadLimit) || null:null;
        }
    },
    watch:{
        "info.multiple"(){
            this.value = null;
            this.show = false;
            this.$nextTick(()=>{
                this.show = true;
            });
        }
    },
    methods:{
        onSuccess(){
            this.info.value = this.$refs.upload.$refs.upload.uploadFiles;
        }
    }
}
</script>

<style scoped lang="less">
.MaterialFileUpload{
}
</style>