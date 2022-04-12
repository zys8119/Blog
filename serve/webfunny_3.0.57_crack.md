# webfunny 3.0.57 破解

## 步骤1

> 替换 /bin/purchaseCode.js 为如下代码：

```js
// 密钥
const keys = {
    '1': 'P',
    '2': 'Z',
    '3': 'D',
    '4': 'W',
    '5': 'U',
    '6': 'B',
    '7': 'S',
    '8': 'M',
    '9': 'G',
    '0': 'K',
}
const purchaseCode = str=>{
    const arr = (str.match(/\d/img) || []).map(e=>keys[e]);
    return Object.values({
        "19": arr[0],// y1, 并且 19 位值必须为 Z， 故年份的开始位必须位 2yyy-mm-dd 形式
        "12": arr[1],// y2
        "7": arr[2],// y3
        "17": arr[3],// y4
        "10": arr[4],// m1
        "8": arr[5],// m2
        "15": arr[6],// d1
        "1": arr[7],// d2

        // purchaseCodeType 计算,结果必须满足后面等式， 不然就是个人版本限制项目个数， purchaseCode[9].charCodeAt() - purchaseCode[4].charCodeAt() > 3, 默认取最大范围
        "4": "A",// purchaseCodeType 开始 charCodeAt
        "9": "Z",// purchaseCodeType 结束 charCodeAt

        "0": "B",
        "2": "C",
        "3": "D",
        "5": "E",
        "6": "F",
        "11": "G",
        "13": "H",
        "14": "I",
        "16": "J",
        "18": "K",
    }).join("")
}
module.exports = {
    purchaseCode:purchaseCode("2092-04-06"),
    secretCode: ''
}
```

## 步骤二

> 修改 /controllers/controllers.js 的2014行代码如下


```js
_0x56d750 = false // _0x438927[_0x3d78f6(0xcab, '#eBL', 0xb0e, 0x72b, 0xd08)];
```


## node完整破解脚本如下

```js
const fs = require("fs")
const {resolve} = require("path")
// 修改接口数据
const controllers = resolve(__dirname,"controllers/controllers.js")
const str = fs.readFileSync(controllers).toString()
fs.writeFileSync(controllers, str.replace(/_0x438927\[_0x3d78f6\(0xcab,'#eBL',0xb0e,0x72b,0xd08\)\]/img,"false"));
// 修改激活码
const purchaseCode = resolve(__dirname,"bin/purchaseCode.js");
fs.writeFileSync(purchaseCode,`
// 密钥
const keys = {
    '1': 'P',
    '2': 'Z',
    '3': 'D',
    '4': 'W',
    '5': 'U',
    '6': 'B',
    '7': 'S',
    '8': 'M',
    '9': 'G',
    '0': 'K',
}
const purchaseCode = str=>{
    const arr = (str.match(/\\d/img) || []).map(e=>keys[e]);
    return Object.values({
        "19": arr[0],// y1, 并且 19 位值必须为 Z， 故年份的开始位必须位 2yyy-mm-dd 形式
        "12": arr[1],// y2
        "7": arr[2],// y3
        "17": arr[3],// y4
        "10": arr[4],// m1
        "8": arr[5],// m2
        "15": arr[6],// d1
        "1": arr[7],// d2

        // purchaseCodeType 计算,结果必须满足后面等式， 不然就是个人版本限制项目个数， purchaseCode[9].charCodeAt() - purchaseCode[4].charCodeAt() > 3, 默认取最大范围
        "4": "A",// purchaseCodeType 开始 charCodeAt
        "9": "Z",// purchaseCodeType 结束 charCodeAt

        "0": "B",
        "2": "C",
        "3": "D",
        "5": "E",
        "6": "F",
        "11": "G",
        "13": "H",
        "14": "I",
        "16": "J",
        "18": "K",
    }).join("")
}
module.exports = {
  purchaseCode:purchaseCode("2092-04-06"),
  secretCode: ''
}
`)
```
