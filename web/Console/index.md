# Vue 前端日志监控插件简单封装

## [查看代码](./ConsolePulg.ts)

## 使用方式

```vue
import vue from "vue"

import ConsolePulg from "./ConsolePulg.ts"

vue.use(ConsolePulg,{
    AxiosConfig:{
        // baseURL:"http://localhost:81/",
        // url:"/Dome/Index/console",
        // method:"post",
    },
    // ****更多配置
})
```

## 更多配置

```typescript
import axios, { AxiosRequestConfig } from "axios"

export interface ConsolePulgConfig <K extends keyof WindowEventMap>{
    [key:string]:any;
    AxiosConfig?:AxiosRequestConfig;
    getCustomData?(this:PluginObjectClass,data:MessageData):Promise<any>;// 获取自定义数据
    XHL_Success?:boolean;// 是否捕捉正常请求 默认开启
    XHL_Success_Error?:boolean;// 是否捕捉正常错误请求 默认开启
    XHL_Error?:boolean;// 是否捕捉错误请求 默认开启
    userAgentData?:boolean;// 是否捕捉userAgentData 默认开启
    system?:boolean;// 是否捕捉系统信息 默认开启
    XMLHttpRequest?:boolean;// 是否捕捉XMLHttpRequest 默认开启
    console?:boolean;// 是否捕捉console.error 默认开启
    // 是否捕捉console映射, 默认监听只error
    consoleMap?:Array<string | 'error' | 'assert' | 'clear' | 'count' | 'countReset' | 'debug' | 'dir' | 'dirxml' | 'exception' | 'group' | 'groupCollapsed' | 'groupEnd' | 'info' | 'log' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'timeStamp' | 'trace' | 'warn'>;
    eventMap?:Array<K>;// 是否捕捉addEventListener事件映射, 默认监听只error
    rules?:Array<(this:PluginObjectClass,data:MessageData)=>boolean>;// 返回true即上报，反之不上报
}
```