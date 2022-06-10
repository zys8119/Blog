<template>
    <div class="DemoMap">
        <wp-maps :config="config" :mapConfig="mapConfig" @load="load" @mapClick="mapClick"></wp-maps>
    </div>
</template>

<script setup lang="ts">
/**
 * 高德资源资源
 * https://webapi.amap.com/maps?v=2.0&key=392d52cc1535e162f0eba5b118cd1c49&plugin=
 * https://webapi.amap.com/loca?v=2.0.0&key=392d52cc1535e162f0eba5b118cd1c49
 */

import {AMapInstance, AMapMap} from "wisdom-plus/AMap";

const config = ref({
    key:"392d52cc1535e162f0eba5b118cd1c49",
    Loca: {
        version: "2.0" // Loca 版本，缺省 1.3.2
    }
})
const center = ref([121.539698, 29.874452])
const myMap = ref<AMapMap>();
const mapConfig = ref({
    zoom: 17,
    pitch: 60,
    rotation: 0,
    showBuildingBlock: true,
    showIndoorMap: false,
    showLabel: false,
    // 主题
    mapStyle: 'amap://styles/4e2b25e3d8c02f4e838379883b8773a2',
    center: center.value,
    features: ['bg', 'point', 'road'],
    viewMode: '3D',
    layers: []
})

const markers:any = [];

const mapClick = (e:any) =>{
    markers.push(new AMap.Marker({
        map:myMap.value,
        position: e.lnglat,
        content: `
            <div class="marker-dian">
                <div style="width: 30px; height: 30px;"></div>
            </div>
        `,
    }))

    new AMap.Marker({
        map:myMap.value,
        position: e.lnglat,
        content: `
            <div class="marker-stand">
                <div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div></div>
                <div></div>
            </div>
        `,
    })
}

const load = async ({map, AMap}:{map:AMapMap, AMap:AMapInstance})=>{
    myMap.value = map
    const loca = new Loca.Container({
        map,
    });
    const geo = new Loca.GeoJSONSource({
        data: {
            type:"FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": 5675,
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [
                                121.53494293,
                                29.87602723
                            ],
                            [
                                121.54389197,
                                29.87387149
                            ],
                            [
                                121.55366746,
                                29.87192042
                            ],
                            [
                                121.55951588,
                                29.87037327
                            ],
                            [
                                121.56025298,
                                29.87033512
                            ]
                        ],
                    },
                    "bbox": [
                        121.53494293,
                        29.87033512,
                        121.56025298,
                        29.87602723
                    ]
                },
                {
                    "type": "Feature",
                    "id": 8196,
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [
                                121.53234639,
                                29.87076491
                            ],
                            [
                                121.53804054,
                                29.86851761
                            ],
                            [
                                121.55274724,
                                29.86714404
                            ],
                            [
                                121.56231882,
                                29.86420153
                            ],
                            [
                                121.57039337,
                                29.86334669
                            ],
                            [
                                121.56833566,
                                29.86081395
                            ],
                            [
                                121.55665642,
                                29.86061099
                            ],
                            [
                                121.5447805,
                                29.86328684
                            ],
                            [
                                121.54246368,
                                29.8649383
                            ]
                        ],
                    },
                    "bbox": [
                        121.53234639,
                        29.86061099,
                        121.57039337,
                        29.87076491
                    ]
                }
            ],
            "gid": 5212
        }
    });
    const layer = new Loca.PulseLineLayer({
        loca,
        zIndex: 10,
        opacity: 1,
        visible: true,
        zooms: [2, 22],
    });
    layer.setSource(geo);
    layer.setStyle({
        altitude: 0,
        lineWidth: 5,
        // 脉冲头颜色
        headColor: '#3cc5fc',
        // 脉冲尾颜色
        trailColor: '#1b4d88',
        // 脉冲长度，0.25 表示一段脉冲占整条路的 1/4
        interval: 0.25,
        // 脉冲线的速度，几秒钟跑完整段路
        duration: 5000,
    });
    loca.add(layer);
    loca.animate.start();
    const circle = new AMap.Circle({
        center: new AMap.LngLat(...center.value),  // 圆心位置
        radius: 500, // 圆半径
        fillColor: '#112461',   // 圆形填充颜色
        strokeColor: '#fff', // 描边颜色
        strokeWeight: 0, // 描边宽度
    });
    map.add(circle);
    markers.push(new AMap.Marker({
        map,
        position: center.value,
        content: `
            <div class="marker-dian">
                <div style="width: 30px; height: 30px;"></div>
            </div>
        `,
    }))
    new AMap.Marker({
        map,
        position: [121.545835, 29.876777],
        content: `
            <div class="marker-stand">
                <div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div></div>
                <div></div>
            </div>
        `,
    })

    const setMarkersContent = (size:number) => {
        markers.forEach((marker:any) => {
            const style = marker.getContent().match(/style="?.*"/)[0]
            marker.setContent(marker.getContent().replace(style, `style="width: ${size}px; height: ${size}px"`))
        })
    }


    const fn = async (time:number) => {
        await Animation((p) => {
            setMarkersContent(10 * p + 20)
            // circle.setRadius(50*p + 450)
        }, time)
        await Animation((p) => {
            setMarkersContent(30 - 10 * p)
            // circle.setRadius(500 - 50*p)
        }, time)
        await fn(time)
    }
    await fn(1000)
}

const Animation = (callback:(progress:number)=>any, timeout:number) => new Promise((resolve, reject) => {
    try {
        let ra:number = 0;
        let startTime = Date.now();
        let endTime = startTime + timeout;
        const fn = () => {
            let progress = Number(((timeout - (endTime - startTime)) / timeout));
            if (progress < 0) {
                progress = 0
            }
            if (progress > 1) {
                progress = 1
            }
            callback(progress)
            if (progress >= 1) {
                cancelAnimationFrame(ra);
                resolve(progress)
                return;
            }
            startTime = Date.now();
            ra = requestAnimationFrame(fn);
        }
        callback(0)
        ra = requestAnimationFrame(fn)
    } catch (e) {
        reject(e)
    }
})
</script>

<style scoped lang="less">
.DemoMap {
    :deep(.wp-maps){
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        .wp-maps-container{
            width: 100%;
            height: 100%;
        }
        .marker-dian {
            position: absolute;
            left: 0;
            top: 0;
            transform: translate(-50%, -50%) rotateX(60deg);
            perspective: 300px;

            & > div {
                width: 30px;
                height: 30px;
                background-color: #f9ff49;
                box-shadow: 0 0 5px #f9ff49;
                border-radius: 100%;
            }
        }

        .marker-stand {
            position: absolute;
            left: 0;
            top: 0;
            transform-origin: 0 0;
            transform: rotateX(60deg) rotateZ(45deg);
            perspective: 3000px;
            transform-style: preserve-3d;

            & > div {
                &:nth-child(2),
                &:nth-child(3) {
                    position: absolute;
                    left: 0;
                    top: 0;
                    transform: translate(-50%, -50%);
                    box-shadow: inset 0 0 20px #f8466b;
                    border-radius: 100%;
                }

                &:nth-child(2) {
                    width: 100px;
                    height: 100px;
                    @keyframes marker-stand-a {
                        0% {
                            width: 60px;
                            height: 60px;
                        }
                        100% {
                            width: 100px;
                            height: 100px;
                        }
                    }
                    animation: marker-stand-a infinite linear 2s;
                }

                &:nth-child(3) {
                    width: 0px;
                    height: 60px;
                    @keyframes marker-stand-b {
                        0% {
                            width: 0px;
                            height: 0px;
                        }
                        100% {
                            width: 60px;
                            height: 60px;
                        }
                    }
                    animation: marker-stand-b infinite linear 2s;
                }

                &:nth-child(1) {
                    @s: 80px;
                    @b: calc(@s / 2);
                    @transform: translate3d(-50%, -50%, @s - 10);
                    width: @s;
                    height: @s;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: @transform;
                    perspective: 10000px;
                    transform-style: preserve-3d;
                    @keyframes marker-stand-c {
                        0% {
                            transform: @transform rotateZ(0deg);
                        }
                        100% {
                            transform: @transform rotateZ(360deg);
                        }
                    }
                    animation: marker-stand-c infinite linear 8s;

                    & > div {
                        position: absolute;
                        left: 0;
                        top: 0;
                        transform-origin: 0 0;
                        width: 0;
                        height: 0;
                        @rotate: 60deg;

                        &:nth-child(1) {
                            transform: rotateX(-@rotate);
                            border-top: solid #fc4f6f @s;
                            border-left: solid transparent @b;
                            border-right: solid transparent @b;
                        }

                        &:nth-child(2) {
                            transform: rotateY(@rotate);
                            border-top: solid transparent @b;
                            border-left: solid #c22e46 @s;
                            border-bottom: solid transparent @b;
                        }

                        &:nth-child(3) {
                            transform-origin: 0 @s;
                            transform: rotateX(@rotate);
                            border-bottom: solid #fc4f6f @s;
                            border-left: solid transparent @b;
                            border-right: solid transparent @b;
                        }

                        &:nth-child(4) {
                            transform-origin: @s 0;
                            transform: rotateY(-@rotate);
                            border-top: solid transparent @b;
                            border-right: solid #c22e46 @s;
                            border-bottom: solid transparent @b;
                        }

                        &:nth-child(5) {
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(130deg, #db4d79, #fd93ab);
                        }
                    }
                }
            }
        }
    }
}
</style>
