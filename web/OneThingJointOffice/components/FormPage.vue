<template>
    <div class="FormPage" :class="{preview:preview}">
        <div class="component" v-if="!preview">
            <!--元件-->
            <div :class="`component-item ${item.className || ''}`" v-for="(item,key) in componentList" :key="key"
                 @dragstart="dragstart"
                 @dragend="dragend($event, item)"
                 draggable="true">
                <span>{{item.name}}</span>
            </div>
        </div>
        <div class="FormPageContent">
            <div class="FormPageContentView">
                <!--主视口-->
                <div class="FormPageContentViewContent" @dragover="dragover" @dragleave="dragleave">
                    <vuedraggable
                        @update="vuedraggableUpdate"
                        :animation="500"
                        :move="()=>!preview"
                        v-model="formList"
                    >
                        <!--子视口-->
                        <div class="FormPageContentViewContentItem"
                             @click="activityItem(item)"
                             :class="{
                                activity:formObj === item && !preview,
                                edit:item.info.activity && !preview,
                             }"
                             v-for="(item, i) in formList" :key="i" :index="i">
                            <component class="Material" v-if="item.component" :is="item.component" :info.sync="item.info"></component>
                            <div v-else>{{item.name}}</div>
                            <div class="operate" v-if="!preview">
                                <i class="el-icon-delete" @click="deleteMaterialItem(item,i)"></i>
                            </div>
                        </div>
                    </vuedraggable>
                </div>
            </div>
            <FormPageContentTool v-if="!preview" :data.sync="formList[materialIndex]"></FormPageContentTool>
        </div>
        <slot name="process"></slot>
    </div>
</template>

<script>
import vuedraggable from "vuedraggable"
import materials from "./material"
import lodash from "lodash"
import FormPageContentTool from "./FormPageContentTool"
import {componentList} from "./rulesOptions"
export default {
    name: "FormPage",
    components:{vuedraggable,FormPageContentTool,  ...materials},
    props:{
        // 是否开启预览模式
        preview:{type:Boolean,default:false}
    },
    data(){
        return {
            // 元件列表
            componentList,
            // 是否开启元件拖拽
            isDragstart:false,
            // 是否进入拖拽视图中
            isInDragView:false,
            // 表单元件列表
            formList:[],
            // 当前子视口对象
            formObj:null,
            // 当前子视口对象索引
            formObjIndex:null,
            componentObj:null,
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
    computed: {
        materialIndex(){
            return this.formList.findIndex(e=>e.info.activity);
        }
    },
    methods:{
        // 删除元件
        deleteMaterialItem(item,i){
            this.formList.splice(i,1);
        },
        // 编辑模式
        activityItem(item){
            this.formList.forEach(e=>{
                this.$set(e,'info',lodash.merge(e.info,{activity:false}));
            });
            this.$set(item,'info',lodash.merge(item.info,{activity:true}));
        },
        // 重置参数
        resetData(){
            this.formObj = null;
            this.formObjIndex = null;
            this.componentObj = null;
            this.isInDragView = false;
        },
        // 元件拖拽开始
        dragstart(){
            this.isDragstart = true;
            this.resetData();
        },
        // 元件拖拽结束
        dragend(ev, item){
            this.componentObj = item;
            this.isDragstart = false;
            // 必须在重置前执行
            this.appendFormObj();
            this.resetData();
        },
        // 拖拽接收器，进入
        dragover(e){
            this.resetData();
            this.isInDragView = true;
            try {
                if(this.isDragstart){
                    let el = e.path.find(e=>(e.className || "").indexOf("FormPageContentViewContentItem") > -1);
                    if(el){
                        // 子视口接收
                        this.formObjIndex = el.attributes.getNamedItem("index").value;
                        this.formObj = this.formList[this.formObjIndex];
                    }else {
                        // 主视口接收
                    }
                }
            }catch (e){}
        },
        // 拖拽接收器,离开
        dragleave(){
            // 目的是防止冒泡时间导致事件阶段不对，dragend快于dragleave执行，因此增加setTimeout队列交由浏览器自主处理
            setTimeout(()=>{
                this.isInDragView = false;
            })
        },
        // 主视口
        vuedraggableUpdate(ev){
            ev.stopPropagation();
            // console.log(this.formList)
        },
        // 视图追加元件
        appendFormObj(){
            // 进入主视图
            if(this.isInDragView){
                // 拷贝元件信息
                let Obj = JSON.parse(JSON.stringify(this.componentObj));
                // 元件初始数据
                Obj = lodash.merge(Obj,{
                    id:Date.now().toString(),
                    info:{
                        fieldName:null,
                        value:null,
                        activity:false,
                        required:false,
                        label:Obj.name,
                        labelWidth:"120px",
                        disabled:false,
                        filterable:false,
                        // 待选数据
                        options:({
                            MaterialCascader:[],
                        })[Obj.component] || ["选项1"],
                        // 日期控件类型
                        datePickerType:"date",
                        datePickerValueFormat:null,
                        datePickerRangeSeparator:"-",
                        datePickerDefaultNowDate:false,
                        multiple:false,
                        action:"/v1/file/upload/",
                        uploadDrag:false,
                        uploadText:"点击上传文件",
                        uploadAccept:({
                            image:"image/*",
                            video:"video/*",
                        })[Obj.type] || null,
                        uploadLimit:null,
                        uploadListType:"text",
                        uploadFileName:"file",
                        mapText:"选择位置",
                        // 校验规则
                        rules:[],
                        inputType:"text",
                        inputMaxlength:null,
                        inputRows:null,
                    }
                })
                // 进入子视图
                if(this.formObj){
                    // 子视图
                    this.formList.splice(parseInt(this.formObjIndex)+1, 0, Obj);
                }else {
                    // 主视图,直接追加元件
                    this.formList.push(Obj);
                }
                this.activityItem(Obj)
            }
        }
    }
}
</script>

<style scoped lang="less">
.FormPage{
    .component{
        display: flex;
        flex-wrap: wrap;
        margin-top: 15px;
        .component-item{
            line-height: 50px;
            background-color: #ffffff;
            padding: 0 @unit15;
            cursor: pointer;
            position: relative;
            border: 1px solid transparent;
            user-select: none;
            margin-bottom: 15px;
            &:before{
                content: "";
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 1px;
                height: 15px;
                background-color: #d8d8d8;
            }
            &:hover{
                border-top: 1px solid @themeColor;
                border-bottom: 1px solid @themeColor;
                font-weight: bold;
                background-color: @themeColor;
                color: #ffffff;
                border-radius: 25px;
                &:before{
                    background-color: transparent;
                }
            }
        }
    }
    .FormPageContent{
        display: flex;
        .FormPageContentView{
            flex: 1;
            border:1px solid #d8d8d8;
            .FormPageContentViewContent{
                min-height: 500px;
                padding-bottom: 30px;
                .FormPageContentViewContentItem{
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding:@unit15;
                    /deep/.el-form-item{
                        margin-bottom: 0;
                    }
                    &.activity{
                        border-bottom: 1px solid @themeColor;
                    }
                    .Material{
                        flex: 1;
                    }
                    .operate{
                        text-align: center;
                        margin-left: @unit15;
                        i{
                            border-left: 1px solid #d8d8d8;
                            padding-left: @unit15;
                        }
                        .el-icon-edit-outline{
                            font-size: 20px;
                            &:hover{
                                color: @themeColor;
                            }
                            &.activity{
                                color: @themeColor;
                            }
                        }
                        .el-icon-delete{
                            font-size: 20px;
                            margin-left: @unit15;
                        }
                    }
                    &.edit{
                        border:1px solid @themeColor;
                        &:hover{
                            .operate{
                                color: #ff0000;
                            }
                        }
                    }
                }
            }
        }
        /deep/ .FormPageContentTool{
            width: 400px;
            margin-left: @unit15;
        }
    }
    &.preview{
        .FormPageContent{
            .FormPageContentView{
                border:none;
                .FormPageContentViewContent{
                    min-height: auto;
                }
            }
        }
    }
}
</style>