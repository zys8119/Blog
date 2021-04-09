<template>
    <div class="AddApprovalNode">
        <TransferBoxNew></TransferBoxNew>
        <z-alert-footer>
            <el-button type="primary" @click="save">保存</el-button>
        </z-alert-footer>
    </div>
</template>

<script>
export default {
    name: "AddApprovalNode",
    methods:{
        save(){
            this.$emit("save");
            this.$ZAlert.hide();
        }
    }
}
</script>

<style scoped lang="less">
.AddApprovalNode{
}
</style>