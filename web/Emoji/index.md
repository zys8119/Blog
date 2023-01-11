# 表情Unicode获取

[获取地址](https://en.wikipedia.org/wiki/Emoji)

获取代码如下

```javascript
[...document.querySelectorAll('table')[4].querySelectorAll('tr')].map(e=>[...e.querySelectorAll('td')].map(e=>e.innerText)).filter(e=>e.length === 17 && /^U/.test(e[0])).reduce((a,b)=>{
    b.forEach((e,k)=>{
     if(k > 0){
         a[b[0].replace(/x$/,k-1).replace(/^U\+/,k-1).toLocaleLowerCase()] = e;
     }   
    })
    return a;
},{})
```

Json最新获取时间：2023-01-11， 如需要最新json请通过以上代码获取最新json

[表情JSON映射](./emoji.json)
