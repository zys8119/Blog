<template>
    <div class="MaterialMap">
        <el-form :label-width="info.labelWidth">
            <el-form-item :label="`${info.label}：`" :required="info.required">
                <Map
                    v-model="value"
                >
                    <el-button type="primary" v-if="!info.uploadDrag">{{ info.mapText }}</el-button>
                </Map>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "MaterialMap",
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
.MaterialMap{
}
</style>