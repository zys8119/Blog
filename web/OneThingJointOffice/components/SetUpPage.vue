<template>
    <div class="SetUpPage">
        <el-tabs v-model="activeName" tab-position="left">
            <el-tab-pane label="基础设置" name="BasicSettings">
                <el-form label-width="120px">
                    <el-form-item label="页面操作：">
                        <el-checkbox-group v-model="formData.basicSettings.pageOperation">
                            <el-checkbox v-for="(item,key) in pageOperation" :key="key" :label="item.label" :value="item.value"></el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item label="默认排序规则：">
                        <el-radio-group v-model="formData.basicSettings.defaultCollation">
                            <el-radio v-for="(item,key) in defaultCollation" :key="key" :label="item.label" :value="item.value"></el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
            <el-tab-pane label="权限设置" name="PermissionSettings">
                <div class="PermissionSettings">
                    <div class="title">可发起人<span></span></div>
                    <TransferBoxNew v-model="formData.permissionSettings.sponsor"></TransferBoxNew>
                    <div class="title">可查看人<span></span></div>
                    <TransferBoxNew v-model="formData.permissionSettings.viewablePeople"></TransferBoxNew>
                </div>
            </el-tab-pane>
            <el-tab-pane label="消息通知" name="Notification">
                <div class="Notification">
                    <layout-filter-content>
                        <filter-content
                            slot="filter"
                            type="none"
                            :config="{
                                rightBtns:[
                                    {name:'新增消息', type:'primary', emit:'add'}
                                ]
                            }"
                            @add="add"
                        >
                        </filter-content>
                        <ContentTable :columns="columns">
                        </ContentTable>
                    </layout-filter-content>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import {pageOperation,defaultCollation} from "./rulesOptions"
export default {
    name: "SetUpPage",
    data(){
        return {
            activeName:"Notification",
            formData:{
                basicSettings:{
                    pageOperation:[],
                    defaultCollation:null,
                },
                permissionSettings:{
                    sponsor:[],
                    viewablePeople:[],
                },
                notification:{

                }
            },
            pageOperation,
            defaultCollation,
            columns:[
                {label:'消息类型',prop:"name"},
                {label:'触发条件',prop:"name"},
                {label:'包含人员',prop:"name"},
                {label:'消息内容',prop:"name"},
                {label:'操作',type:"operate",btns:[
                    {name:"编辑", type:"text", className:"primary"},
                    {name:"删除", type:"text", className:"default"},
                ]},
            ]
        }
    },
    methods:{
        // 添加消息
        add(){
            this.$ZAlert.show({
                title:"新增消息",
                width:"1000px",
                components:require("./Alert/AddNewMessage")
            })
        }
    }
}
</script>

<style scoped lang="less">
.SetUpPage{
    .PermissionSettings{
        .title{
            line-height: 50px;
            font-size: 18px;
            font-weight: bold;
        }
    }
}
</style>