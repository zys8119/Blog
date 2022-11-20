# 创建FormData数据格式

代码如下：

```typescript
const FormData = async(data:Record<string, any>, boundaryName:string = 'WebAppBoundary')=>{
    return  {
        contentType:`multipart/form-data; boundary=${boundaryName}`,
        body:Object.entries({
            email:'joanhg90172@chacuo.net',
            password:'joanhg90172@chacuo.net',
            invite_code:'',
            email_code:'',
        }).map(([name, value])=>`
        --${boundaryName}
        Content-Disposition: form-data; name="${name}"
        Content-Type: text/plain
        
        ${value}
    `.split('\n').map(e=>e.trim()).join('\n')).concat([`--${boundaryName}--`]).join('\n')
    }
}
```
