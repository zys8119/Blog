# javascript 算法题及题解

## 回文,扩展求最长、最短回文

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

## 合并K个升序链表

平铺数组后排序

```typescript
const lists = [[1,4,5],[1,3,4],[2,6]]
console.log(lists.reduce((a,b)=>a.concat(b),[]).sort((a,b)=>a-b))
```

##  K 个一组翻转链表

以k分割数组，最后一个升序，其余降序

```typescript
const head = [1,2,3,4,3,5,8,6,9,2], k = 3
console.log(head.join("").split(k).map((e,kk,a)=>{
    return (kk < a.length -1 ? (e+k).split("").sort((a,b)=>b-a):e.split("").sort((a,b)=>a-b));
}).reduce((a,b)=>a.concat(b),[]))
```

