# node-serve 订阅获取

## clashNode

```typescript
{
    path:"/clashNode",
    controller:async function (){
        let d = dayjs()
        let index = 0
        const max = 10
        while (index <= max){
            try {
                this.$send((await axios({
                    url:`https://clashnode.com/wp-content/uploads/${d.format('YYYY')}/${d.format("MM")}/${d.format("YYYYMMDD")}.yaml`,
                    method:"get"
                })).data, {
                    headers:{
                        'Content-Type':'text/plain; charset=UTF-8',
                        'access-control-allow-origin':'*',
                    }
                })
                console.log(7777)
                index = max
            }catch (e){
                console.log("重试")
                index += 1
                d = d.subtract(1, 'day')
            }
        }
        this.$error()
    }
}
```
