# 占位图代理

```javascript
proxy:{
    /**
     * 占位图代理， 参考地址：https://dummyimage.com/
     */
    '/zwt':{
        target:'https://dummyimage.com/',
        rewrite:path1 => {
            return path1.replace(/^\/zwt/,'')
        },
        changeOrigin: true,
    }
}
```
