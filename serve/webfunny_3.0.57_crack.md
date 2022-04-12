# webfunny 3.0.57 破解

## 步骤1

> 替换 /bin/purchaseCode.js 为如下代码：

```js
// 密钥
const keys = {
    '1':'Y',
    '2':'Q',
    '3':'I',
    '4':'T',
    '5':'V',
    '6':'R',
    '7':'H',
    '8':'C',
    '9':'P',
    '0':'U',
}

const purchaseCode = str=>{
    const arr = (str.match(/\d/img) || []).map(e=>keys[e]);
    return Object.values({
        "19": arr[0],// y1
        "12": arr[1],// y2
        "7": arr[2],// y3
        "17": arr[3],// y4
        "10": arr[4],// m1
        "8": arr[5],// m2
        "15": arr[6],// d1
        "1": arr[7],// d2
        "0": "B",
        "2": "C",
        "3": "D",
        "4": "Q",
        "5": "E",
        "6": "F",
        "9": "Q",
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

