<template>
    <div class="BigDataRapidPlaceholder" :class="{isDev:isDev}">
        <img class="CockpitLayoutBj" ref="img" :src="src">
        <slot :getStyle="getStyle"></slot>
    </div>
</template>

<script>
export default {
    name: "BigDataRapidPlaceholder",
    props:{
        src:{type:String, default:null},
    },
    data(){
        return {
            ratio_w:0,
            ratio_h:0,
        }
    },
    computed:{
        isDev(){
            return process.env.NODE_ENV !== 'production'
        }
    },
    mounted(){
        this.init()
        window.addEventListener("resize",()=>{
            this.init();
        })
    },
    methods:{
        init(){
            const img = new Image();
            img.src = this.src;
            img.onload = ()=>{
                this.ratio_w = window.innerWidth / img.width;
                this.ratio_h = window.innerHeight / img.height;
            }
        },
        getStyle({left,top, width, height}){
            const unit = "px";
            return {
                left:(left * this.ratio_w)  + unit,
                top:(top * this.ratio_h)  + unit,
                width:width * this.ratio_w  + unit,
                height:height * this.ratio_h  + unit,
            }
        }
    }
}
</script>

<style scoped lang="less">
.BigDataRapidPlaceholder {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    .CockpitLayoutBj{
        position: fixed;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
    }
    &>div{
        cursor: pointer;
        position: fixed;
        display: flex;
    }
    &.isDev{
        &>div{
            border:1px solid yellow;
        }
    }
}
</style>
