<template>
    <div class="ProcessPage">
        <div class="ProcessPageContent">
            <div class="ProcessPageContentItem" v-for="(item,k) in formList" :key="k">
                <el-form label-width="140px">
                    <el-form-item label="节点名称：">
                        <el-input placeholder="请输入节点名称" v-model="item.name"></el-input>
                    </el-form-item>
                    <el-form-item label="本节点展示字段：">
                        <el-button type="primary" size="mini" @click="displayFieldOperate(item,k)">设置</el-button>
                    </el-form-item>
                    <el-form-item label="本节点动作设置：">
                        <el-checkbox-group v-model="item.action">
                            <el-checkbox :label="item.name" :value="item.value" :key="key" v-for="(item,key) in nodeActionOptions"></el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>
                    <el-form-item label="本节点增加字段：">
                        <el-button type="primary" size="mini" icon="el-icon-plus" @click="addFields(item.fields)"></el-button>
                        <el-input placeholder="请输入字段名称" v-model="it.name" v-for="(it,key) in item.fields" :key="key">
                            <el-button slot="append" icon="el-icon-delete" @click="deleteFields(it,key,item.fields)"></el-button>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="本节点审批人员：">
                        <el-popover
                            placement="bottom-start"
                            title="本节点审批人员"
                            width="200"
                            trigger="hover"
                            :content="item.users.map(e=>e.name).join(',')">
                            <div class="ellipsis-1" slot="reference">{{item.users.map(e=>e.name).join(',')}}</div>
                        </el-popover>
                    </el-form-item>
                </el-form>
                <div class="footer">
                    <i class="el-icon-delete" @click="deleteItem(item,k)"></i>
                </div>
            </div>
            <div class="ProcessPageContentItem add" @click="addApprovalNode">
                <div class="addbox">
                    <i class="el-icon-plus"></i>
                    <div class="text">添加审批节点</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {nodeActionOptions} from "./rulesOptions"
export default {
    name: "ProcessPage",
    props:{
        tabrefs:{type:Object,default:Object}
    },
    data(){
        return {
            nodeActionOptions,
            formList:[],
        }
    },
    watch:{
        formList:{
            deep:true,
            handler(){
                console.log(this.formList)
            }
        }
    },
    methods:{
        // 字段展示设置
        displayFieldOperate(item){
            this.$ZAlert.show({
                title:"本节点展示字段",
                width:"1000px",
                props:{
                    displayFieldOperate:()=>item.displayFieldOperate,
                    formList:()=>this.tabrefs.FormPage.formList,
                },
                components:require("./Alert/DisplayFieldOperate"),
                _event:{
                    save:val=>{
                        item.displayFieldOperate = val;
                    }
                }
            })
        },
        // 新增字段
        addFields(fields){
            fields.push({
                name:null,
                value:null,
            })
        },
        // 删除字段
        deleteFields(item,key,fields){
            fields.splice(key,1);
        },
        // 删除
        deleteItem(item,k){
            this.$confirm('是否删除该审批节点吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.formList.splice(k,1);
            })
        },
        // 添加
        addApprovalNode(){
            this.$ZAlert.show({
                title:"选择审批人员",
                width:"1000px",
                components:require("./Alert/AddApprovalNode"),
                _event:{
                    save:()=>{
                        this.formList.push({
                            name:"节点名称",
                            users:[
                                {name:"用户1"},
                                {name:"用户2"},
                                {name:"用户3"},
                                {name:"用户4"},
                            ],
                            action:[],
                            fields:[],
                            displayFieldOperate: {},
                            id:Date.now().toString()
                        })
                    }
                }
            })
        }
    }
}
</script>

<style scoped lang="less">
.ProcessPage{
    .ProcessPageContent{
        display: flex;
        flex-wrap: wrap;
        .ProcessPageContentItem{
            margin-right: @unit15;
            margin-bottom: @unit15;
            border: 1px solid #d8d8d8;
            padding: @unit15;
            border-radius: 5px;
            box-shadow: 0 0 5px #d8d8d8;
            width: 354px;
            cursor: pointer;
            min-height: 350px;
            position: relative;
            .footer{
                text-align: right;
                height: 30px;
                width: 100%;
                .el-icon-delete{
                    width: 30px;
                    height: 30px;
                    line-height: 30px;
                    font-size: 18px;
                    text-align: center;
                    border-radius: 100%;
                    position: absolute;
                    right: @unit15;
                    bottom: @unit15;
                    &:hover{
                        color: #ff0000;
                        background-color: #d8d8d8;
                    }
                }
            }
            &.add{
                display: flex;
                justify-content: center;
                align-items: center;
                .addbox{
                    text-align: center;
                    .el-icon-plus{
                        @s:100px;
                        width: @s;
                        height: @s;
                        display: block;
                        border-radius: 100%;
                        border:1px solid #d8d8d8;
                        text-align: center;
                        line-height: @s;
                        font-weight: bold;
                        font-size: @s/2;
                    }
                    .text{
                        margin-top: @unit15;
                        font-size: 18px;
                    }
                }
            }
            &:hover{
                border-color: @themeColor;
            }
        }
    }
}
</style>