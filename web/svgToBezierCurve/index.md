# svg paths 转 canvas 贝塞曲线

## 代码

```typescript
// 代码
class svgToBezierCurve {
    dArr = [];
    config = {
        fill:true,
        offsetX:0,
        offsetY:0,
    };
    /**
     * svg paths 转 canvas 贝塞曲线
     * @param d
     * @param w
     * @param h
     * @returns {*}
     */
    constructor(d, config) {
        this.config = Object.assign(this.config, config)
        this.dArr = d.match(/[a-z][^a-z]+/img);
        this.dArr = this.dArr.map(e=>e.match(/(\w|\.|-)*/img).filter(e=>e))
    }

    /**
     * 获取 贝塞曲线
     */
    getBezierCurve(){
        let result = this.dArr.map(e=>{
            const n = e.map(e=>Number(e.replace(/[^0-9.-]/img,""))).map((e,k)=>{
                const xs = Object.prototype.toString.call(this.config.offsetX === "[object String]") ? "+":0;
                const ys = Object.prototype.toString.call(this.config.offsetY === "[object String]") ? "+":0;
                return e+(k % 2 ? ys + this.config.offsetY :xs + this.config.offsetX)
            })
            const bstr = n.join(",")
            return (({
                m:()=>`ctx.moveTo(${bstr})`,
                c:()=>`ctx.bezierCurveTo(${bstr})`,
                q:()=>`ctx.quadraticCurveTo(${bstr})`,
                l:()=>`ctx.lineTo(${bstr})`,
            }[e[0].match(/^[a-z]/img)[0].toLowerCase()]) || ((e)=>e))(e);
        });
        if(this.config.fill){
            result = result.concat(["ctx.fill()"])
        }
        return result.join(";\n")
    }
}
```

## 使用

```typescript
var d = `M42.000,0.000
 C42.000,0.000 11.468,9.103 2.000,43.000 
 C2.000,43.000 -9.961,84.230 25.000,101.000
  C25.000,101.000 32.593,101.807 37.000,100.000 C37.000,100.000 61.656,92.586 66.000,62.000 C66.000,62.000 69.595,37.485 57.000,26.000 C57.000,26.000 44.783,16.643 42.000,0.000 Z`;

console.log(new svgToBezierCurve(d, {
    offsetX:"w",
    offsetY:"h",
}).getBezierCurve())

// ctx.moveTo(42+w,0+h);
// ctx.bezierCurveTo(42+w,0+h,11.468+w,9.103+h,2+w,43+h);
// ctx.bezierCurveTo(2+w,43+h,-9.961+w,84.23+h,25+w,101+h);
// ctx.bezierCurveTo(25+w,101+h,32.593+w,101.807+h,37+w,100+h);
// ctx.bezierCurveTo(37+w,100+h,61.656+w,92.586+h,66+w,62+h);
// ctx.bezierCurveTo(66+w,62+h,69.595+w,37.485+h,57+w,26+h);
// ctx.bezierCurveTo(57+w,26+h,44.783+w,16.643+h,42+w,0+h);
// ctx.fill()
```