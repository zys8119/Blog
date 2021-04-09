<template>
    <div class="AddData">
        <el-form label-width="80px">
            <el-form-item label="名称" required>
                <el-input placeholder="请输入" v-model="name"></el-input>
            </el-form-item>
        </el-form>
        <z-alert-footer>
            <el-button type="primary" @click="save">保存</el-button>
        </z-alert-footer>
    </div>
</template>

<script>
export default {
    name: "AddData",
    props:{
        item:{type:Object,default:null}
    },
    data(){
        return {
            name:null,
        }
    },
    mounted() {
        this.name = this.item ? this.item.name : null;
    },
    methods:{
        save(){
            if(!this.name){
                return this.$message.error("请输入名称")
            }
            this.$ZAlert.hide();
            this.$emit("save",this.name);
        }
    }
}
</script>

<style scoped lang="less">
.AddData{
}
</style>