<template>
    <div class="Carousel">
        <div class="CarouselBox"
             @mouseenter="isStop = true"
             @mousemove="isStop = true"
             @mouseout="isStop = false"
             :style="{
                 width:`${CarouselBoxWidth}px`,
                 transform: `translateX(${translateX}px)`,
                 transition: fastForwardShow ? `all ease-in-out ${fastForwardTime}ms` :null,
             }" ref="CarouselBox">
            <div class="CarouselItem" :style="{marginRight:`${gap}px`}" ref="CarouselItem" v-for="(item,key) in 4*index" :key="key">
                <div class="content">{{item}}</div>
            </div>
        </div>
        <div class="arrow left" @mouseenter="isStop = true" @click="fastForward(false)"></div>
        <div class="arrow right" @mouseenter="isStop = true" @click="fastForward(true)"></div>
    </div>
</template>

<script>
export default {
    name: "Carousel",
    props:{
        // 间距
        gap:{type:Number,default:15},
        // 渲染频率
        index:{type:Number,default:10},
        // 快进频率
        fastForwardIndex:{type:Number,default:500},
        // 快进动画时间，默认1秒
        fastForwardTime:{type:Number,default:700},
    },
    data(){
        return {
            CarouselBoxWidth:0,
            translateX:0,
            isStop:false,
            time:null,
            max:0,
            fastForwardShow:false,
        }
    },
    watch:{
        $props(){
            this.init();
        },
        $slots(){
            this.init();
        }
    },
    mounted() {
        this.init();
    },
    destroyed() {
        this.clearInterval();
    },
    methods:{
        // 初始化
        init(){
            this.$nextTick(()=>{
                this.translateX = 0;
                this.CarouselBoxWidth = this.$refs.CarouselItem.map(e=>e.clientWidth+this.gap).reduce((a,b)=>a+b);
                this.setInterval();
            })
        },
        // 清除定时器
        clearInterval(){
            try {
                clearInterval(this.time);
            }catch (e){
                // err
            }
        },
        // 定时器
        setInterval(){
            this.clearInterval();
            this.time = setInterval(()=>{
                if(this.isStop){
                    return ;
                }
                this.calc(1);
            })
        },
        // 计算
        calc(nb){
            this.max = this.CarouselBoxWidth/this.index
            if(-this.translateX <= this.max){
                if(this.translateX <= 0){
                    this.translateX -= nb;
                }else {
                    this.translateX = -this.max;
                }
            } else {
                this.translateX = 0;
            }
            setTimeout(()=>{
                this.fastForwardShow = false;
            }, this.fastForwardTime)
        },
        // 快进
        fastForward(bool){
            if(this.translateX > -this.fastForwardIndex && this.translateX < 0){
                this.translateX = -this.max;
                return ;
            }
            if(-this.translateX > this.max){
                this.translateX = 0;
                return ;
            }
            this.fastForwardShow = true;
            this.calc(bool ? this.fastForwardIndex:-this.fastForwardIndex);
        }
    }
}
</script>

<style scoped lang="less">
.Carousel{
    @s:500px;
    @arrow:50px;
    width: 90%;
    height: @s;
    border: 1px solid red;
    margin: auto;
    overflow: hidden;
    position: relative;
    .CarouselBox{
        overflow: hidden;
        height: @s;
        /deep/.CarouselItem{
            float: left;
            height: @s;
            .content{
                width: 500px;
                background-color: #ffffff;
                height: 100%;
                text-align: center;
                line-height: 500px;
                font-size: 30px;
            }
        }
    }
    .arrow{
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        width: @arrow;
        height: @arrow;
        background-color: rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all ease-in 0.2s;
        opacity: 0;
        &:before{
            content: "";
            border: 3px solid #ffffff;
            border-radius: 5px 0 0 0;
            border-right: none;
            border-bottom: none;
            width: @arrow/2;
            height: @arrow/2;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%,-50%) rotate(-45deg);
            transform: translate(calc(-50% + @arrow/2/4),-50%) rotate(-45deg);
        }
        &:hover{
            background-color: rgba(0,0,0,1);
            box-shadow: 5px 5px 5px 5px rgba(0,0,0,0.5);
            &:before{
                border-color: #ffffff;
            }
        }
        &.right{
            left: initial;
            right: 15px;
            &:before{
                content: "";
                transform: translate(-50%,-50%) rotate(135deg);
                transform: translate(calc(-50% - @arrow/2/4),-50%) rotate(135deg);
            }
        }
    }
    &:hover{
        .arrow{
            opacity: 1;
        }
    }
}
</style>