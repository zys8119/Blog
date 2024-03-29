# ChatGpt AI node代码简易封装

## 安装依赖

```
npm install openai lodash axios --save-dev
```

## 封装代码

```typescript
import { ConfigurationParameters, Configuration, OpenAIApi, CreateCompletionResponse } from "openai"
import { merge } from "lodash"
import {CreateCompletionRequest} from "openai/api";
import {AxiosRequestConfig} from "axios";
type InitOptions = Partial<{
    query:string
    isContinue:boolean,
    callback(data:CreateCompletionResponse):void
    adapter:OpenAIApi
    configuration:ConfigurationParameters
    createCompletion:CreateCompletionRequest
    axiosRequest:AxiosRequestConfig
}>
const createCompletion = async (options:InitOptions= {})=>{
    const config = merge({} as InitOptions, options)
    config.adapter = config.adapter || new OpenAIApi(new Configuration(config.configuration));
    const {data} = await config.adapter.createCompletion(merge({
        model: "text-davinci-003",
        prompt: config.query ,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    }, config.createCompletion), merge({
        timeout:0,
    }, config.axiosRequest));
    config.callback?.(data)
    if(!config.isContinue){config.query = ''}
    config.query = config.query + data.choices[0].text
    if(data.choices[0].finish_reason === 'stop'){
        return  config.query
    }
    return await createCompletion(merge(config, {
        isContinue:true
    } as InitOptions))
}
export default createCompletion
```


## 使用

```typescript
import createCompletion from "./createCompletion";

await createCompletion({
    query:'你要咨询的问题',
    callback(data: CreateCompletionResponse) {
        console.log(data.choices[0].text)
    },
    configuration:{
        apiKey:"请填写你openai私人的apikey",
    },
})
```

# chatGpt api接口
```
POST https://api.openai.com/v1/chat/completions
Accept: application/json
Content-Type: application/json
Authorization: Bearer $OPENAI_API_KEY

{
    "model": "gpt-3.5-turbo",
    "messages": [{
        "role": "user",
        "content": "Hello!"
    }]
  }
```


# chatGpt api转发 + [ChatGPT-Desktop](https://github.com/zys8119/ChatGPT-Desktop) + Clash

```typescript
import {createRoute} from "@wisdom-serve/serve"
import axios from "axios"
import {ReadStream} from "fs"
export default createRoute({
    routes:[
        {
            path:"/v1/chat/completions",
            controller:async function (){
                try {
                    const res = await axios({
                        baseURL:'https://api.openai.com',
                        url:this.$url,
                        proxy:{
                            protocol:'http',
                            host:'127.0.0.1',
                            port:7890
                        },
                        method:this.request.method,
                        data:this.$body,
                        headers:{
                            'Content-Type': 'application/json',
                            authorization:this.request.headers['authorization']
                        } as any,
                        responseType:'stream'
                    })  as {data:ReadStream}
                    await new Promise<void>((resolve, reject)=>{
                        this.response.writeHead(200, {
                            "access-control-allow-origin":this.request.headers.origin
                        })
                        res.data.on('data', e=>{
                            this.response.write(e)
                        })
                        res.data.on('end', ()=>{
                            resolve()
                        })
                        res.data.on('error', e=>{
                            reject(e)
                        })
                    })
                }catch (e){
                    await new Promise<void>((resolve, reject)=>{
                        this.response.writeHead(403, {
                            "access-control-allow-origin":this.request.headers.origin
                        })
                        e.response.data.on('data', e=>{
                            this.response.write(e)
                        })
                        e.response.data.on('end', ()=>{
                            resolve()
                        })
                        e.response.data.on('error', e=>{
                            reject(e)
                        })
                    })
                }
            },
        },
        {
            path:"/v1/images/generations",
            controller:async function (){
                try {
                    const res = await axios({
                        baseURL:'https://api.openai.com',
                        url:this.$url,
                        proxy:{
                            protocol:'http',
                            host:'127.0.0.1',
                            port:7890
                        },
                        method:this.request.method,
                        data:this.$body,
                        headers:{
                            'Content-Type': 'application/json',
                            authorization:this.request.headers['authorization']
                        } as any,
                    })
                    this.$send(JSON.stringify(res.data), {
                        headers:{
                            "Content-Type":"application/json; charset=utf-8",
                        }
                    })
                }catch (e){
                    console.log(e.response)
                    this.$error(e.message)
                }
            },
        }
    ]
});

```
## 相关资料

[chat 在线演示](https://chat.openai.com/chat) 需要翻墙，最好是美国节点

[playground 在线api配置使用演示](https://platform.openai.com/playground) 需要翻墙

[chat 开发文档](https://platform.openai.com/docs/introduction)
