# 高德地图记录

# 第一步

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.17e50649.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://a.amap.com/jsapi_demos/static/demo-center/css/demo-center.css" />
        <!--开始-->
      <script src="https://a.amap.com/jsapi_demos/static/demo-center/js/demoutils.js"></script>
      <script type="text/javascript" src="https://webapi.amap.com/maps?v=1.4.15&key=392d52cc1535e162f0eba5b118cd1c49&plugin=AMap.Driving"></script>
      <script type="text/javascript" src="https://cache.amap.com/lbs/static/addToolbar.js"></script>
        <!--结束-->
    <title>Vite App</title>
  <script type="module" crossorigin src="/assets/index.0da06c23.js"></script>
  <link rel="modulepreload" href="/assets/vendor.47dbd25c.js">
</head>
  <body>
    <div id="app"></div>
    
  </body>
</html>
```

# 第二步

```vue
<template>
    <div class="a">
        <div id="container"></div>
        <div id="panel"></div>
    </div>
</template>

<script>
export default {
    name: "aas",
    mounted(){
        window.onload = ()=>{
            //基本地图加载
            var map = new AMap.Map("container", {
                resizeEnable: true,
                center: [116.397428, 39.90923],//地图中心点
                zoom: 13 //地图显示的缩放级别
            });
            // AMap.plugin('AMap.Geolocation', function() {
            //     var geolocation = new AMap.Geolocation({
            //         enableHighAccuracy: true,//是否使用高精度定位，默认:true
            //         timeout: 10000,          //超过10秒后停止定位，默认：5s
            //         buttonPosition:'RB',    //定位按钮的停靠位置
            //         buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
            //         zoomToAccuracy: true,   //定位成功后是否自动调整地图视野到定位点
            //
            //     });
            //     map.addControl(geolocation);
            //     geolocation.getCurrentPosition(function(status,result){
            //         if(status=='complete'){
            //             // console.log(result)
            //         }else{
            //             // onError(result)
            //         }
            //     });
            // });
            //构造路线导航类
            var driving = new AMap.Driving({
                map: map,
                panel: "panel"
            });
            // 根据起终点经纬度规划驾车导航路线
            driving.search(new AMap.LngLat(121.601026, 29.828659), new AMap.LngLat(121.624862, 29.860035),{
                waypoints:[
                    new AMap.LngLat(121.602846, 29.843658),
                    new AMap.LngLat(121.622001, 29.852884),
                ]
            }, function(status, result) {
                // result 即是对应的驾车导航信息，相关数据结构文档请参考  https://lbs.amap.com/api/javascript-api/reference/route-search#m_DrivingResult
                if (status === 'complete') {
                    console.log('绘制驾车路线完成')
                    drawRoute(result.routes[0])
                } else {
                    console.error('获取驾车数据失败：' + result)
                }
            });
            function drawRoute (route) {
                var path = parseRouteToPath(route)
                path = path.slice(0,parseInt(Math.random() * path.length));
                var routeLine = new AMap.Polyline({
                    path: path,
                    isOutline: true,
                    outlineColor: '#ffeeee',
                    borderWeight: 2,
                    strokeWeight: 5,
                    strokeColor: '#b8b8b8',
                    lineJoin: 'round',
                    zIndex:100,
                })

                routeLine.setMap(map)

                // 调整视野达到最佳显示区域
                // map.setFitView([ startMarker, endMarker, routeLine ])
                map.setFitView([  routeLine ])


                // 当前位置
                const target = path.slice(path.length - 1,path.length)[0];
                const size = {
                    "东":new AMap.Size(46.3,20),
                    "西":new AMap.Size(46.3,20),
                    "南":new AMap.Size(20,46.3),
                    "北":new AMap.Size(20,46.3),
                }[target.orientation];
                new AMap.Marker({
                    map,
                    position: target,
                    icon:new AMap.Icon({
                        image:`./${target.orientation}.png`,
                        size,
                        imageSize:size,
                    }),
                })
                map.setZoom(17);
                map.panTo([target.lng, target.lat]);
                console.log(map,target)
            }
            // 解析DrivingRoute对象，构造成AMap.Polyline的path参数需要的格式
            // DrivingResult对象结构参考文档 https://lbs.amap.com/api/javascript-api/reference/route-search#m_DriveRoute
            function parseRouteToPath(route) {
                var path = []

                for (var i = 0, l = route.steps.length; i < l; i++) {
                    var step = route.steps[i]

                    for (var j = 0, n = step.path.length; j < n; j++) {
                        let  a = step.path[j];
                        a.orientation = step.orientation
                        a.step = step
                        path.push(a)
                    }
                }

                return path
            }
        }

    },
    methods:{

    }
}
</script>

<style scoped lang="less">
.a{
    #container{
        position:fixed;
        left:0;
        bottom:0;
        width:100%;
        height:100%;
        overflow-x: hidden;
    }
    #panel{
        position:fixed;
        left:0;
        bottom:0;
        width:100%;
        height:200px;
        overflow-x: hidden;
    }
}
</style>
```