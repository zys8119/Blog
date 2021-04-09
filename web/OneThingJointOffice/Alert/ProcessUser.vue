<template>
    <div class="ProcessUser">
        <div class="processRight">
            <div class="processRightItem" v-for="(it,k) in users" :key="k">
                <div class="avatar">
                    <img :src="it.avatar">
                </div>
                <div class="name">{{it.name}}</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ProcessUser",
    props:{
        users:{type:Array,default:Array},
    }
}
</script>

<style scoped lang="less">
.ProcessUser{
    text-align: center;
    .processRight{
        display: inline-block;
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
</style>