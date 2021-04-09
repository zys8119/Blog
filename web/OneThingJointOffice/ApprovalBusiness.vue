<template>
    <div class="ApprovalBusiness">
        <layout-box>
            <layout-filter-content>
                <template slot="header">
                    <el-button-group>
                        <el-button type="primary">我发起的</el-button>
                        <el-button type="primary" plain>我审批的</el-button>
                        <el-button type="primary" plain>已审批的</el-button>
                    </el-button-group>
                </template>
                <filter-content
                    slot="filter"
                    type="none"
                    @addApproval="addApproval"
                    :config="{rightBtns:[
                        {name:'发起审批', type:'primary', emit:'addApproval'}
                    ]}">
                </filter-content>
                <content-table :columns="columns"></content-table>
            </layout-filter-content>
        </layout-box>
    </div>
</template>

<script>
export default {
    name: "ApprovalBusiness",
    data(){
        return {
            columns:[
                // 表单前两个字段
                {label:"字段1",prop:"name"},
                {label:"字段2",prop:"name"},

                {label:"审批结果",prop:"name"},
                {label:"审批状态",prop:"name"},
                {label:"当前节点",prop:"name"},
                {label:"当前负责人",prop:"name"},
                {label:"创建人",prop:"name"},
                {label:"创建时间",prop:"name"},
                {label:"操作",type:"operate",btns:[
                    {name:"查看", type:"text", className:"primary"},
                    {name:"删除", type:"text", className:"default"},
                ]},
            ]
        }
    },
    methods:{
        addApproval(){
            this.$ZAlert.show({
                title:"查看表单",
                width:"1000px",
                top:"4vh",
                props:{
                    formData:()=>({
                        "FormPage": [
                            {
                                "name": "多选",
                                "component": "MaterialCheckbox",
                                "id": "1617960642599",
                                "info": {
                                    "fieldName": null,
                                    "value": null,
                                    "activity": false,
                                    "required": false,
                                    "label": "多选",
                                    "labelWidth": "120px",
                                    "disabled": false,
                                    "filterable": false,
                                    "options": [
                                        "选项1"
                                    ],
                                    "datePickerType": "date",
                                    "datePickerValueFormat": null,
                                    "datePickerRangeSeparator": "-",
                                    "datePickerDefaultNowDate": false,
                                    "multiple": false,
                                    "action": "/v1/file/upload/",
                                    "uploadDrag": false,
                                    "uploadText": "点击上传文件",
                                    "uploadAccept": null,
                                    "uploadLimit": null,
                                    "uploadListType": "text",
                                    "uploadFileName": "file",
                                    "mapText": "选择位置",
                                    "rules": [],
                                    "inputType": "text",
                                    "inputMaxlength": null,
                                    "inputRows": null
                                }
                            },
                            {
                                "name": "输入框",
                                "component": "MaterialInput",
                                "id": "1617960645495",
                                "info": {
                                    "fieldName": null,
                                    "value": null,
                                    "activity": false,
                                    "required": false,
                                    "label": "输入框",
                                    "labelWidth": "120px",
                                    "disabled": false,
                                    "filterable": false,
                                    "options": [
                                        "选项1"
                                    ],
                                    "datePickerType": "date",
                                    "datePickerValueFormat": null,
                                    "datePickerRangeSeparator": "-",
                                    "datePickerDefaultNowDate": false,
                                    "multiple": false,
                                    "action": "/v1/file/upload/",
                                    "uploadDrag": false,
                                    "uploadText": "点击上传文件",
                                    "uploadAccept": null,
                                    "uploadLimit": null,
                                    "uploadListType": "text",
                                    "uploadFileName": "file",
                                    "mapText": "选择位置",
                                    "rules": [],
                                    "inputType": "text",
                                    "inputMaxlength": 0,
                                    "inputRows": null
                                }
                            },
                            {
                                "name": "下拉框",
                                "component": "MaterialSelect",
                                "id": "1617960646558",
                                "info": {
                                    "fieldName": null,
                                    "value": null,
                                    "activity": false,
                                    "required": false,
                                    "label": "下拉框",
                                    "labelWidth": "120px",
                                    "disabled": false,
                                    "filterable": false,
                                    "options": [
                                        "选项1"
                                    ],
                                    "datePickerType": "date",
                                    "datePickerValueFormat": null,
                                    "datePickerRangeSeparator": "-",
                                    "datePickerDefaultNowDate": false,
                                    "multiple": false,
                                    "action": "/v1/file/upload/",
                                    "uploadDrag": false,
                                    "uploadText": "点击上传文件",
                                    "uploadAccept": null,
                                    "uploadLimit": null,
                                    "uploadListType": "text",
                                    "uploadFileName": "file",
                                    "mapText": "选择位置",
                                    "rules": [],
                                    "inputType": "text",
                                    "inputMaxlength": null,
                                    "inputRows": null
                                }
                            },
                            {
                                "name": "富文本",
                                "component": "MaterialWangeditor",
                                "id": "1617960647863",
                                "info": {
                                    "fieldName": null,
                                    "value": null,
                                    "activity": true,
                                    "required": false,
                                    "label": "富文本",
                                    "labelWidth": "120px",
                                    "disabled": false,
                                    "filterable": false,
                                    "options": [
                                        "选项1"
                                    ],
                                    "datePickerType": "date",
                                    "datePickerValueFormat": null,
                                    "datePickerRangeSeparator": "-",
                                    "datePickerDefaultNowDate": false,
                                    "multiple": false,
                                    "action": "/v1/file/upload/",
                                    "uploadDrag": false,
                                    "uploadText": "点击上传文件",
                                    "uploadAccept": null,
                                    "uploadLimit": null,
                                    "uploadListType": "text",
                                    "uploadFileName": "file",
                                    "mapText": "选择位置",
                                    "rules": [],
                                    "inputType": "text",
                                    "inputMaxlength": null,
                                    "inputRows": null
                                }
                            }
                        ],
                        "ProcessPage": [
                            {
                                "name": "节点名称",
                                "users": [
                                    {
                                        "name": "用户1"
                                    },
                                    {
                                        "name": "用户2"
                                    },
                                    {
                                        "name": "用户3"
                                    },
                                    {
                                        "name": "用户4"
                                    }
                                ],
                                "action": [],
                                "fields": [],
                                "displayFieldOperate": {},
                                "id": "1617960652869"
                            },
                            {
                                "name": "节点名称",
                                "users": [
                                    {
                                        "name": "用户1"
                                    },
                                    {
                                        "name": "用户2"
                                    },
                                    {
                                        "name": "用户3"
                                    },
                                    {
                                        "name": "用户4"
                                    }
                                ],
                                "action": [],
                                "fields": [],
                                "displayFieldOperate": {},
                                "id": "1617960655854"
                            }
                        ],
                        "SetUpPage": {
                            "basicSettings": {
                                "pageOperation": [],
                                "defaultCollation": null
                            },
                            "permissionSettings": {
                                "sponsor": [],
                                "viewablePeople": []
                            },
                            "notification": {}
                        }
                    })
                },
                components: require("./Alert/PreviewForm")
            })
        }
    }
}
</script>

<style scoped lang="less">
.ApprovalBusiness{
}
</style>