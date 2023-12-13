# 北外测试

测试题获取

```javascript
let els = document.querySelector(".content_right_left_02_newwords").childNodes;
let result = '';
let isStart = false
console.clear()
els.forEach(e=>{
    if(e.src){
        result += "\n----------------------------------------------------------------------\n"
        isStart = true
    }
    if(/[A-Z]、/.test(e.textContent)){
        isStart = false
    }
    if(isStart && e.textContent.trim().length > 0){
        result += e.textContent.trim()
    }
    if(e.className && e.className.indexOf('righted') > -1){
        result += `%c ${e.textContent} %c`
    }
})
console.log(result, ...result.match(/%c/g).map((e, k)=>k % 2 === 0? 'color:#ff0':'color:#bdc5ce'))
```

视频题目获取

```javascript
console.clear()
console.log(JSON.stringify($$('#Anchor li').map(e=>(el=>({
    title:el.querySelector('.flex-a-s .question-stem').innerText,
    "答案":[...el.querySelectorAll('.choice-options .color-47A66F')].map(e=>e.innerText)
}))($$(`[id="${e.dataset.id}"]`)[0])), null, 4))
```

