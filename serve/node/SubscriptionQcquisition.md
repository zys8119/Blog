# node-serve 订阅获取

## clashNode

```typescript
{
    path:"/clashNode",
        controller:async function (){
        let d = dayjs().add(6,'day')
        let index = 0
        const max = Number(this.$query.get('max') || 10)
        console.log("【clashNode】最大重试次数", max)
        while (index <= max){
            const url = `https://clashnode.com/wp-content/uploads/${d.format('YYYY')}/${d.format("MM")}/${d.format("YYYYMMDD")}.yaml`
            console.log("【clashNode】正在请求", url)
            try {
                const {data} = await axios({
                    url,
                    method:"get"
                })
                console.log("clashNode】请求成功")
                this.$send(data, {
                    headers:{
                        'Content-Type':'text/plain; charset=UTF-8',
                        'access-control-allow-origin':'*',
                    }
                })
                index = max
                break
            }catch (e){
                console.log("clashNode】重试")
                index += 1
                d = d.subtract(1, 'day')
            }
        }
        if(index > max){
            this.$error()
        }
    }
}
```
