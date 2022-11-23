# 北外测试

```javascript
let els = document.querySelector(".content_right_left_02_newwords").childNodes;
let result = {};
let key = ''
els.forEach(e=>{
    switch(Object.prototype.toString.call(e)){
        case '[object HTMLParagraphElement]':
            key = e.innerText
            result[key] = {}
            break;
        case '[object HTMLInputElement]':
            let kk = e.nextSibling.data.trim();
            if(kk){
                result[key][kk] = false
            }else{
                kk = e.nextSibling.nextSibling.innerText
                result[key][kk] = true
            }
            break;
    }
})
result = Object.fromEntries(Object.entries(result).map(e=>{e[1] = (Object.entries(e[1]).find(e=>e[1] === true) || [])[0]; return e}))
console.log(result)
```
