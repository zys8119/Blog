<template>
    <div class="AddNewMessage">
        <el-form label-width="120px">
            <el-form-item label="消息类型：">
                <el-radio-group v-model="formData.value">
                    <el-radio v-for="(item,key) in messageTypeOptions" :key="key" :label="item.label" :value="item.value"></el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="触发条件：">
                <el-radio-group v-model="formData.value">
                    <el-radio v-for="(item,key) in triggeringConditionsOptions" :key="key" :label="item.label" :value="item.value"></el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="条件和节点：">
                <el-checkbox v-model="checkAll">全选</el-checkbox>
                <el-checkbox-group v-model="formData.value2">
                    <el-checkbox v-for="(item,key) in conditionsAndNodes" :key="key" :label="item.label" :value="item.value"></el-checkbox>
                </el-checkbox-group>
            </el-form-item>
            <el-form-item label="审批结论：">
                <el-checkbox-group v-model="formData.value2">
                    <el-checkbox v-for="(item,key) in approvalConclusionOptions" :key="key" :label="item.label" :value="item.value"></el-checkbox>
                </el-checkbox-group>
            </el-form-item>
            <el-form-item label="流程参与人：">
                <el-checkbox-group v-model="formData.value2">
                    <el-checkbox v-for="(item,key) in processParticipantOptions" :key="key" :label="item.label" :value="item.value"></el-checkbox>
                </el-checkbox-group>
            </el-form-item>
            <el-form-item label="消息内容：">
                <el-input type="textarea" v-model="formData.value3"></el-input>
            </el-form-item>
        </el-form>
        <z-alert-footer>
            <el-button type="primary" @click="save">确定</el-button>
        </z-alert-footer>
    </div>
</template>

<script>
import {
    messageTypeOptions,
    triggeringConditionsOptions,
    approvalConclusionOptions,
    processParticipantOptions,
} from "../rulesOptions"
export default {
    name: "AddNewMessage",
    data(){
        return {
            messageTypeOptions,
            triggeringConditionsOptions,
            approvalConclusionOptions,
            processParticipantOptions,
            formData:{
                value:null,
                value2:[],
                value3:null,
            },
            checkAll:false,
            conditionsAndNodes:[
                {label:"审批人1", value:1},
                {label:"审批人2", value:2},
            ]
        }
    },
    methods:{
        save(){
            this.$emit("save");
            this.$ZAlert.hide();
        }
    }
}
</script>

<style scoped lang="less">
.AddNewMessage{
}
</style>