<template>
    <div class="window">
        <div class="windowBox" v-if="list.length > 0">
            <div class="contentBox" ref="win" :style="{transform:`rotateY(${rotate}deg)`}" :class="{autoRotate:autoRotate}">
                <div class="item" v-for="(item, key) in list" :key="key">
                    <span>
                        <img :src="item.img">
                    </span>
                </div>
                <div class="mask"></div>
                <div class="title">
                    <span class="top">书藏古今</span>
                    <span class="bottom">港通天下</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "window",
    props:{
        autoRotate:{type:Boolean, default:false},
    },
    data(){
        return {
            list:[],
            rotate:40,
        }
    },
    mounted() {
        const listOrigin = [
            {img:"http://p1.qhimg.com/bdr/__85/t0125431d12a54d8874.jpg"},
            {img:"http://p7.qhimg.com/bdr/__85/t012492e8ab86f90a3e.jpg"},
            {img:"http://p4.qhimg.com/bdr/__85/t016ab944ce31ada8b2.jpg"},
            {img:"http://p8.qhimg.com/bdr/__85/t01c3e5ede8803a6c53.jpg"},
        ];
        Promise.all(listOrigin.map(src=>new Promise((resolve) => {
            let img = new Image();
            img.src = src;
            img.onload = ()=>{
                resolve();
            }
            img.onerror = ()=>{
                resolve();
            }
        }))).then(()=>{
            this.list = listOrigin;
        })
        if(!this.autoRotate){
            window.onmousemove = (e)=>{
                if(this.$refs.win){
                    let index = e.x/window.innerWidth*40;
                    if(index < 20){
                        index = 10 + index;
                    }
                    this.rotate = index;
                }
            }
        }
    }
}
</script>

<style scoped lang="less">

.window{
    @s:600px;
    @gap:15px;
    @rotate:40deg;
    @rotateMin:@rotate - 10deg;
    @time:0.5s;
    @perspective:1000px;
    @shadow:3px;
    width: @s !important;
    height: @s !important;
    padding: @s *0.6 100px;
    margin: auto;
    .windowBox{
        perspective: @perspective;
        height: @s;
        width: @s;
        position: relative;
        margin-left: 50px;
        .contentBox{
            display: grid;
            gap: @gap;
            grid-template-columns: repeat(2, calc((100% - @gap)/2));
            transform-origin: 50% 50%;
            position: absolute;
            left: 0%;
            top: 0%;
            width: 100%;
            height: 100%;
            perspective: @perspective;
            transform: rotateY(@rotate);
            transition: all ease-out 300ms;
            &.autoRotate{
                animation: a ease-out 5s infinite;
                @keyframes a {
                    0%{transform: rotateY(@rotateMin);}
                    50%{transform: rotateY(@rotate);}
                    100%{transform: rotateY(@rotateMin);}
                }
            }
            .item{
                text-align: center;
                position: relative;
                overflow: hidden;
                height:calc((@s - @gap )/2);
                width: 100%;
                span{
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    box-shadow:inset @shadow -@shadow tint(#1b5996, 20%);
                    img{
                        width: calc(100% - @shadow);
                        height: calc(100% - @shadow);
                        margin-left: @shadow;
                    }
                }
                .if(@i) when (@i < 5){
                    &:nth-child(@{i}){
                        span{
                            animation: b ease-in @time;
                            @keyframes b {
                                0%{left: -50%;}
                                100%{left: 50%;}
                            }
                            .if2(@i) when (@i = 2) or (@i = 4){
                                animation: c linear @time*2;
                                @keyframes c {
                                    0%{left: -150%;}
                                    100%{left: 50%;}
                                }
                            }
                            .if2(@i);
                            //background-color: tint(#f00, 100/(@i+1));
                        }
                    }
                    .if(@i+1);
                };
                .if(1);
            }
            .mask{
                position: absolute;
                left: 0;
                top: 0;
                width: 50%;
                height: 100%;
                transform: rotateY(-60deg);
                transform-origin: 0 50%;
                opacity: 0.5;
                background-image: linear-gradient(to right, #6d74f9, transparent);
                animation: d ease-in @time*2;
                @keyframes d {
                    0%{width: 0%;}
                    100%{width: 50%;}
                }
            }
            .title{
                position: absolute;
                left: -50px;
                top: 50%;
                width: 50px;
                transform: translateY(-50%);
                span{
                    font-size: 18px;
                    width: 18px;
                    display: inline-block;
                    text-shadow: -4px 0 4px #6d74f9;
                    overflow: hidden;
                    height: 120px;
                }
                .top{
                    transform: translateY(-50%);
                    animation: e_top ease-in-out @time;
                    @keyframes e_top {
                        0%{height: 0px; transform: translateY(calc(-50% - 120px))}
                        100%{height: 120px; transform: translateY(calc(-50% + 0px))}
                    }
                }
                .bottom{
                    transform: translateY(50%);
                    animation: e_bottom ease-in-out @time*2;
                    @keyframes e_bottom {
                        0%{height: 0px; transform: translateY(calc(50% - 120px))}
                        50%{height: 0px; transform: translateY(calc(50% - 120px))}
                        100%{height: 120px; transform: translateY(calc(50% - 0px))}
                    }
                }
            }
        }
    }
}
</style>