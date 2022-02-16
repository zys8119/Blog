# javascript 算法题及题解

## 回文

* 答案1

```typescript
const a = "56\n\r\n65";
const res = a=>(a=>!!a.reduce((a,b,k,arr)=>{
    if(a && a[0] === a[a.length - 1]){
        const c = a.slice(1,a.length - 1)
        if(c.length > 1 && k === (arr.length - 1)){
            return true;
        }
        return c;
    }
    return false;
},a))([...a]);
console.log(res(a))
```

* 答案2

```typescript
const a = "56\n\r\n65";
const res = a => (a === [...a].reverse().join(""))
console.log(res(a))
```

