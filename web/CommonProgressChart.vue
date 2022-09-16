<template>
    <div class="CommonProgressChart">
        <div class="legend">
            <div v-for="(item, key) in legend" :key="key" class="legend-item"><span :style="{backgroundColor:color[key]}" class="icon"/>{{item}}</div>
        </div>
        <div class="chartContent">
            <div v-for="(item, key) in currData" :key="key">
                <wp-tooltip>
                    <template #title>
                        <div style="font-weight: bold">{{item.name}}</div>
                        <div v-for="(it, k) in legend" :key="k" style="display: flex; align-items: center; gap: 10px;margin-top: 10px"><span :style="{backgroundColor:color[k], width: '10px', height:'10px', borderRadius:'100%'}" class="icon"/>
                            {{item.value[k]}}{{unit[k]}}
                        </div>
                    </template>
                    <div class="chartContentItem">
                        <div class="_title">
                            {{item.name}}
                            <div class="_value">
                                <span v-for="(it, kk) in item.value" :key="kk" :style="{color: item.value.length > 1 ? color[kk] : '#ffffff'}">{{ it }}{{unit[kk]}} <span v-if="kk +1 < item.value.length" :style="{color:'#b4bcc5'}">/</span></span>
                            </div>
                        </div>
                        <div class="progress">
                            <div v-for="(it, kk) in item.width" :key="kk" class="progress-item" :style="{backgroundColor: color[kk], width: `${getWidth(it, animation)}%`}"/>
                        </div>
                    </div>
                </wp-tooltip>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {get} from 'lodash'
const props = defineProps({
    /**
     数据格式如下：
     {
            legend: ['执业助理医师数', '注册护士数'],
            color: ['#fdef4c', '#24ffeb'],// 不必填
            unit:['元'],// 不必填
            data: [
                {name: '宁波市第一人民医院', value: [45, 45]},
                {name: '宁波市第一人民医院', value: [454, 88]},
                {name: '宁波市第一人民医院', value: [88, 877]},
            ]
        }
     */
    option:{type:Object, default:() => ({})}
})
const legend = computed(() => get(props.option, 'legend', []))
const color = computed(() => get(props.option, 'color', ['#fdef4c', '#24ffeb', '#9e00dc', '#ff724b', '#d7cfff', '#00f8c7', '#108a10', '#ff0000', '#ffcfcf', '#571cff', '#000000', '#000033', '#000066', '#000099', '#0000CC', '#0000FF', '#003300', '#003333', '#003366', '#003399', '#0033CC', '#0033FF', '#006600', '#006633', '#006666', '#006699', '#0066CC', '#0066FF', '#009900', '#009933', '#009966', '#009999', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#00FF00', '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#330000', '#330033', '#330066', '#330099', '#3300CC', '#3300FF', '#333300', '#333333', '#333366', '#333399', '#3333CC', '#3333FF', '#336600', '#336633', '#336666', '#336699', '#3366CC', '#3366FF', '#339900', '#339933', '#339966', '#339999', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#33FF00', '#33FF33', '#33FF66', '#33FF99', '#33FFCC', '#33FFFF', '#660000', '#660033', '#660066', '#660099', '#6600CC', '#6600FF', '#663300', '#663333', '#663366', '#663399', '#6633CC', '#6633FF', '#666600', '#666633', '#666666', '#666699', '#6666CC', '#6666FF', '#669900', '#669933', '#669966', '#669999', '#6699CC', '#6699FF', '#66CC00', '#66CC33', '#66CC66', '#66CC99', '#66CCCC', '#66CCFF', '#66FF00', '#66FF33', '#66FF66', '#66FF99', '#66FFCC', '#66FFFF', '#990000', '#990033', '#990066', '#990099', '#9900CC', '#9900FF', '#993300', '#993333', '#993366', '#993399', '#9933CC', '#9933FF', '#996600', '#996633', '#996666', '#996699', '#9966CC', '#9966FF', '#999900', '#999933', '#999966', '#999999', '#9999CC', '#9999FF', '#99CC00', '#99CC33', '#99CC66', '#99CC99', '#99CCCC', '#99CCFF', '#99FF00', '#99FF33', '#99FF66', '#99FF99', '#99FFCC', '#99FFFF', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC6666', '#CC6699', '#CC66CC', '#CC66FF', '#CC9900', '#CC9933', '#CC9966', '#CC9999', '#CC99CC', '#CC99FF', '#CCCC00', '#CCCC33', '#CCCC66', '#CCCC99', '#CCCCCC', '#CCCCFF', '#CCFF00', '#CCFF33', '#CCFF66', '#CCFF99', '#CCFFCC', '#CCFFFF', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF6666', '#FF6699', '#FF66CC', '#FF66FF', '#FF9900', '#FF9933', '#FF9966', '#FF9999', '#FF99CC', '#FF99FF', '#FFCC00', '#FFCC33', '#FFCC66', '#FFCC99', '#FFCCCC', '#FFCCFF', '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#FFFFFF']))
const data = computed(() => get(props.option, 'data', []))
const unit = computed(() => get(props.option, 'unit', []))
const max = computed(() => data.value.reduce((a:any, b:any) => {
    return a.map((e:number, k:number) => e > b.value[k] ? e : b.value[k])
}, new Array(legend.value.length).fill(0)))
const sum = computed(() => max.value.reduce((a:number, b:number) => a + b, 0))
const animation = ref(false)
const currData = computed(() => data.value.map((e:any) => {
    animation.value = true
    return {
        ...e,
        sum:e.value.reduce((a:number, b:number) => a + b, 0),
        width:e.value.map((e:number) => e / sum.value * 100)
    }
}).sort((a:any, b:any) => b.sum - a.sum))
const timeout:any = ref(0)
const getWidth = (v:number, bool:boolean) => {
    clearTimeout(timeout.value)
    timeout.value = setTimeout(() => {
        animation.value = false
    }, 300)
    return animation.value ? 0 : v
}
</script>

<style scoped lang="less">
.CommonProgressChart {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    .progress{
        display: flex;
        background-color: #364a63;
        height: 8px;
        border-radius: 0 8px 8px 0;
        overflow: hidden;
        margin-top: 5px;
        .progress-item{
            transition: all ease-in-out 0.3s;
            height: 100%;
            width: 0;
            &:last-child{
                border-radius: 0 8px 8px 0;
            }
        }
    }
    .chartContent{
        flex: 1;
        margin-top: 15px;
        overflow: auto;
        .chartContentItem{
            padding: 10px;
            ._title{
                color: #6f7e91;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 20px;
                ._value{
                    color: #ffffff;
                    font-size: 20px;
                    font-weight: bold;
                }
            }
            &+.chartContentItem{
                margin-top: 10px;
            }
            &:hover{
                background-color: rgba(255,255,255,0.1);
                cursor: pointer;
            }
        }
    }
    .legend{
        display: flex;
        justify-content: flex-end;
        align-items: center;
        color: #ffffff;
        gap: 15px;
        flex-wrap: wrap;
        padding: 10px;
        .legend-item{
            display: flex;
            align-items: center;
            gap: 10px;
            .icon{
                width: 15px;
                height: 15px;
                border-radius: 100%;
            }
        }
    }
}
</style>
