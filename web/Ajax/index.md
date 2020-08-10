# 简单的Ajax封装

```javascript
ajax(opts = {}){
    return new Promise((resolve,reject) => {
        let initOpt = {
            method:"get",
            responseType:"json",
            timeout:10,
        };
        let request = new XMLHttpRequest();
        // 请求完成，还有开始请求loadstart，结束请求loadend，这里就不列举，大同小异
        request.addEventListener("load",res=>{
            if (res.target.status >= 200 && res.target.status <  300 ){
                // 正常响应
                resolve(res.target);
            }else {
                // 非正常响应
                reject(res.target);
            }
        });
        // 进度-一般用于文件上传进度
        request.addEventListener("progress",res=>{
            console.log(res);
        });
        // 整个请求的状态变化
        request.addEventListener("readystatechange",res=>{
            console.log(`第${res.target.readyState}握手`);
        });
        // 错误
        request.addEventListener("error",res=>{
            reject(res.target);
        });
        //超时
        request.addEventListener("timeout",res=>{
            reject(res.target);
        });
        //终止请求
        request.addEventListener("abort",res=>{
            reject(res.target);
        });
        // params处理
        if(Object.prototype.toString.call(opts.params) === "[object Object]"){
            opts.url += ("?"+Object.keys(opts.params).map(k=>(`${k}=${opts.params[k]}`)).join("&"));
        }
        request.open(opts.method || initOpt.method,opts.url);
        // headers处理,必须在打开请求后写入
        if(Object.prototype.toString.call(opts.headers) === "[object Object]"){
            for(let k in opts.headers){
                request.setRequestHeader(k,opts.headers[k]);
            }
        }
        // 响应数据格式
        request.responseType = opts.responseType || initOpt.responseType;
        // 超时保护
        request.timeout = opts.timeout || initOpt.timeout;
        // 区分body
        if(opts.method === initOpt.method || !opts.data){
            // 默认请求处理
            request.send();
        }else {
            // body数据处理
            switch (Object.prototype.toString.call(opts.data)) {
            case "[object Object]":
                // json
                request.send(JSON.stringify(opts.data || {}));
                break;
            default:
                // 非json
                request.send(opts.data);
                break;
            }
        }
    })

}
```
