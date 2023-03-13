# 判断鼠标进入方向


```vue
<template>
    <div class="Home">
        <div :class="className" class="box" ref="box" @mouseenter="mouseenter" @mouseleave="className = null">
            <div class="content">判断鼠标进入方向</div>
            <div class="top">top</div>
            <div class="left">left</div>
            <div class="right">right</div>
            <div class="bottom">bottom</div>
        </div>
    </div>
</template>

<script setup lang="ts" path="/">
const box = ref<HTMLDivElement>()
const className = ref()
const mouseenter = async ({offsetX:x,offsetY:y}:MouseEvent)=>{
    const w = box.value.clientWidth
    const h = box.value.clientHeight
    const a = x - w/2
    const b = h/2 - y
    const c = Math.sqrt(Math.pow(a,2) + Math.pow(b, 2))
    const imgc = Math.sqrt(Math.pow(w,2) + Math.pow(h, 2))
    const c1 = Math.abs(Math.round((Math.asin(b/c)*180))/Math.PI)
    const c2 = Math.round((Math.asin(h/imgc)*180))/Math.PI
    if(a >= 0 && b >= 0 && c1 <= c2 || a >= 0 && b < 0 && c1 <= c2){
        className.value = 'right'
    }else
    if(a >= 0 && b >= 0 && c1 > c2 || a < 0 && b > 0 && c1 > c2){
        className.value = 'top'
    }else
    if(a < 0 && b >= 0 && c1 <= c2 || a < 0 && b < 0 && c1 <= c2){
        className.value = 'left'
    }else
    {
        className.value = 'bottom'
    }
}
</script>


<style scoped lang="less">
:global(body){
    background-color: #ababab;
}
.Home{
    position: fixed;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .box{
        overflow: hidden;
        width: 700px;
        height: 500px;
        border: 1px solid #f00;
        position: relative;
        div{
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ffffff;
            font-size: 50px;
            transition: all ease-in 0.35s;
            text-shadow: 0 5px 5px #000000;
            &.left{
                background-color: #0d9dd3;
                transform: translateX(-100%);
            }
            &.top{
                background-color: #17b900;
                transform: translateY(-100%);
            }
            &.right{
                background-color: rgb(199, 108, 71);
                transform: translateX(100%);
            }
            &.bottom{
                background-color: #d201f1;
                transform: translateY(100%);
            }
        }
        &.left{
            .left{
                transform: translate(0);
            }
        }
        &.top{
            .top{
                transform: translate(0);
            }
        }
        &.right{
            .right{
                transform: translate(0);
            }
        }
        &.bottom{
            .bottom{
                transform: translate(0);
            }
        }
    }
}
</style>

```
