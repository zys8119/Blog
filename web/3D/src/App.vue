<template>
    <div class="App">
        <div class="box">
            <div class="boxItem" v-for="i in 4">asd</div>
        </div>
    </div>
</template>

<script>
export default {
    name: "App"
}
</script>

<style scoped lang="less">
.App{
    @s:500px;
    perspective: @s;
    .box{
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) rotateY(45deg);
        width: @s;
        height: @s;
        perspective: @s;
        .boxItem{
            background-color: rgba(255,255,255,255,0.5);
            width: @s;
            height: @s;
            position: absolute;
            left: 0;
            top: 0;
            z-index: 1;
            &:nth-child(1){
                transform: translateX(0) translateZ(-@s);
            }
        }
    }
}
</style>