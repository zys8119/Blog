# Vue WebSocket 简单封装

## 代码

```typescript
function WebSocket(path) {
    return new Promise((resolve, reject) => {
        let url = process.env.NODE_ENV === 'development' ? `ws${window.common.postUrl.replace('http', '')}` : `ws${location.protocol.replace('http', '')}//${location.host}`;
        let ws = new WebSocket(url + path);
        let uid = Date.now().toString(16);
        ws.onopen = function () {
            console.log(`【WebSocket open】from url to ${ws.url}`);
            console.log(`【WebSocket Uid】${uid}`);
            resolve(uid);
        }
        ws.onmessage =  (ev) =>{
            try {
                this.$root.$emit(uid+"message", JSON.parse(ev.data), ws)
            }catch (e){
                reject({type:"messageError"})
            }
        }
        ws.onclose = function (){
            console.log(`【WebSocket close】`);
            reject({type:"close"})
        }
        ws.onerror =  ()=> {
            console.log(`【WebSocket close】${ws.url}`);
            reject({type:"error"})
            this.WebSocket(path);
        }
    })

}
```

## 使用

```typescript
this.WebSocket('url/?')
.then((uid,ws)=>{
    // uid 链接唯一id
    // ws WebSocket实例
    
   // 业务代码
}).catch(()=>{

})
```