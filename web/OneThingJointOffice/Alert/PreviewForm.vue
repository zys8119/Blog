<template>
    <div class="PreviewForm">
        <FormPage preview ref="FormPage">
            <div class="processPreviewForm" slot="process">
                <div class="processTitle">流程</div>
                <div class="processContent">
                    <div class="processContentItem" :class="{
                        leng1:processs.length === 1,
                        activity:true
                    }" v-for="(item,key) in processs" :key="key">
                        <div class="processLeft">
                            <div class="_t">{{item.name}}</div>
                            <div class="_m">{{item.users.length}}个人审批</div>
                        </div>
                        <div class="processRight">
                            <div class="processRightItem"
                                 @click="processUserClick(item,it,key,k)"
                                 :class="{
                                    isMore:isMore(key,k),
                                 }"
                                 v-for="(it,k) in item.users" :key="k">
                                <div class="avatar">
                                    <img :src="isMore(key,k) ? icon :avatar">
                                </div>
                                <div class="name">{{isMore(key,k) ? "查看全部" :it.name}}</div>
                            </div>
                        </div>
                    </div>
                    <div class="noData" v-if="processPageData.length === 0">暂无流程</div>
                </div>
            </div>
        </FormPage>
        <z-alert-footer>
            <el-button type="primary" @click="$ZAlert.hide()">提交</el-button>
        </z-alert-footer>
    </div>
</template>

<script>
import FormPage from "../components/FormPage"
export default {
    name: "PreviewForm",
    components:{FormPage},
    props:{
        formData:{type:Object,default:Object}
    },
    data(){
        return {
            maxIndex:3,
            processPageData:[],
            avatar:"https://ss1.baidu.com/9vo3dSag_xI4khGko9WTAnF6hhy/zhidao/wh%3D450%2C600/sign=a587b23df11f3a295a9dddcaac159007/500fd9f9d72a60590cfef2f92934349b023bba62.jpg",
            icon:"data:image/png;base64,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",
        }
    },
    computed:{
        processs(){
            return this.processPageData.map(e=>({
                ...e,
                users:e.users.slice(0,this.maxIndex),
            }));
        }
    },
    mounted() {
        this.$refs.FormPage.formList = JSON.parse(JSON.stringify(this.formData.FormPage));
        this.processPageData = JSON.parse(JSON.stringify(this.formData.ProcessPage));
    },
    methods:{
        isMore(key, k){
            return this.processPageData[key].users.length > this.maxIndex && k === 0;
        },
        processUserClick(item,it,key,k){
            if(this.isMore(key,k)){
                this.$ZAlert.show({
                    title:`查看流程【${item.name}】全部人员`,
                    props:{
                        users:()=>this.processPageData[key].users,
                    },
                    components: require("./ProcessUser")
                })
            }
        }
    }
}
</script>

<style scoped lang="less">
.PreviewForm{
    &/deep/ .FormPage{
        .FormPageContentViewContentItem{
            padding: 0 !important;
            margin-bottom: @unit15;
        }
    }
    .noData{
        text-align: center;
        line-height: 50px;
        color: #999999;
    }
    .processPreviewForm{
        margin-top: @unit15;
        border: 1px solid #d8d8d8;
        border-radius: 5px;
        padding: @unit15;
        .processTitle{
            border-bottom: 1px solid #d8d8d8;
            padding: @unit15;
            font-size: 18px;
            font-weight: bold;
            position: relative;
            &:before{
                content: "";
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 2px;
                height: 30px;
                background-color: @themeColor;
            }
        }
        .processContent{
            .processContentItem{
                padding: @unit15;
                padding-left: @unit30;
                align-items: center;
                display: flex;
                position: relative;
                @s:14px;
                @color:#d8d8d8;
                &:before{
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: @s;
                    height: @s;
                    background-color: @color;
                    border-radius: 100%;
                }
                &:after{
                    content: "";
                    position: absolute;
                    left: @s/2;
                    top: 0;
                    width: 1px;
                    height: 100%;
                    background-color: @color;
                }
                &:first-child{
                    &:after{
                        height: 50%;
                        top: 50%;
                    }
                }
                &:last-child{
                    &:after{
                        height: 50%;
                    }
                }
                &.leng1{
                    &:after{
                        background-color: transparent;
                    }
                }
                &.activity{
                    &:before{
                        background-color: @themeColor;
                    }
                    &:after{
                        background-color: @themeColor;
                    }
                }
                &+.processContentItem{
                    border-top: 1px solid #d8d8d8;
                }
                .processLeft{
                    flex: 1;
                    ._t{
                        font-size: 18px;
                        font-weight: bold;
                    }
                    ._m{
                        color: #999999;
                        font-size: 12px;
                        margin-top: 10px;
                    }
                }
                .processRight{
                    overflow: hidden;
                    .processRightItem{
                        float: left;
                        .avatar{
                            width: 50px;
                            height: 50px;
                            border-radius: 100%;
                            overflow: hidden;
                            background-color: #d8d8d8;
                            position: relative;
                            img{
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                height: 100%;
                            }
                        }
                        .name{
                            text-align: center;
                            font-size: 12px;
                            margin-top: 5px;
                        }
                        &+.processRightItem{
                            margin-left: 20px;
                            position: relative;
                            &:before{
                                content: "+";
                                position: absolute;
                                left: -20px;
                                top: 50%;
                                width: 20px;
                                height: 20px;
                                text-align: center;
                                line-height: 20px;
                                overflow: hidden;
                                font-size: 18px;
                                transform: translateY(-50%);
                            }
                        }
                        &.isMore{
                            cursor: pointer;
                            .avatar{
                                background-color: @themeColor;
                                img{
                                    width: 60%;
                                    height: 60%;
                                    left: 50%;
                                    top: 50%;
                                    transform: translate(-50%,-50%);
                                }
                            }
                            &:hover{
                                .name{
                                    color: @themeColor;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>