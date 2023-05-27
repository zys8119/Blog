# node-serve 订阅获取

## clashNode

```typescript
import {createRoute} from "@wisdom-serve/serve"
import axios from "axios"
import {ReadStream} from "fs"
import * as dayjs from "dayjs"
import {merge} from "lodash";
const puppeteer = require('puppeteer-core');
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
                    this.$error(e.message)
                }
            },
        },
        {
            path:"/clashNode",
            controller:async function (){
                let d = dayjs()
                let index = 0
                const max = Number(this.$query.get('max') || 10)
                const dd = this.$query.get('dd') || 'DD'
                console.log("【clashNode】最大重试次数", max)
                while (index <= max){
                    const url = `https://clashnode.com/wp-content/uploads/${d.format('YYYY')}/${d.format("MM")}/${d.format(`YYYYMM${dd}`)}.yaml`
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
        },
        {
            path:'/giaoyun',
            async controller(){
                try {
                    const emailCreate = async function (email_suffix = 'chacuo.net'){
                        return `${Date.now().toString(16)}@${email_suffix}`
                    }
                    const giaoyunLogin = async function ({host, sub_host, email, password, selector, selector_is_login, invite_code}: {
                        email:string,
                        password:string,
                        invite_code:string,
                        email_code:string,
                        host:string
                        sub_host:string
                        selector:string
                        selector_is_login:string
                    }){
                        return new Promise((resolve, reject) => {
                            (async ()=>{
                                console.log("尝试注册")
                                const browser = await puppeteer.launch({
                                    // liunx部署 需要以下配置
                                    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                                    args: ["--no-sandbox", "--disable-setuid-sandbox"]
                                })
                                try {
                                    const page = await browser.newPage();
                                    page.once("domcontentloaded", async ()=>{
                                        console.log("检查表单元素是否存在")
                                        await page.waitForSelector(`${selector}:nth-child(1) input`)
                                        console.log("正在写入注册数据")
                                        await page.type(`${selector}:nth-child(1) input`, email)
                                        await page.type(`${selector}:nth-child(2) input`, password)
                                        await page.type(`${selector}:nth-child(3) input`, password)
                                        await page.type(`${selector}:nth-child(4) input`, invite_code)
                                        await page.tap(`${selector}:nth-child(5) button`)
                                        console.log("正在等待注册成功")
                                        await new Promise(resolve => setTimeout(()=>resolve(null), 500))
                                        console.log("注册成功并登陆成功")
                                        console.log("获取订阅数据中")
                                        const resultHandle = await page.evaluateHandle( (host)=>{
                                            return fetch(`${host}/api/v1/user/getSubscribe`).then(res=>res.json())
                                        }, host)
                                        const res = await resultHandle.jsonValue()
                                        const subscribe_url = res?.data?.subscribe_url
                                        console.log("获取订阅数据：", JSON.stringify(res))
                                        console.log("订阅链接：", subscribe_url)
                                        const clashSubscribeUrl = sub_host ? `${sub_host}?target=clash&url=${encodeURIComponent(subscribe_url)}` : subscribe_url
                                        console.log("clash订阅链接转换地址：", clashSubscribeUrl)
                                        const subscribeInfo = await (await page.evaluateHandle((clashSubscribeUrl)=>{
                                            return fetch(clashSubscribeUrl).then(res=>res.text())
                                        }, clashSubscribeUrl)).jsonValue()
                                        await browser.close()
                                        resolve(subscribeInfo)
                                    })
                                    page.on("error",async (e)=>{
                                        console.error(e)
                                        await browser.close()
                                        reject()
                                    })
                                    await page.goto(`${host}/#/register`)
                                }catch (e){
                                    console.error(e)
                                    await browser.close()
                                    reject()
                                }
                            })()
                        })


                    }
                    const emit = await emailCreate(this.$params.email_suffix)
                    const info = await giaoyunLogin(merge({
                        email:emit,// 账号邮箱
                        password:emit,// 账号密码
                        invite_code:'qlmJni8z',// 推荐码，默认自己的
                        email_code:'',// 邮箱验证码
                        host:'https://giaoyun.xyz',// 域名host
                        sub_host:'https://sub.789.st/sub',// 订阅地址域名host
                        selector:'#main-container > div > div > div > div > div > div > div:nth-child(3) > div',
                        // 判断是否登陆的选择器
                        selector_is_login:"#main-container .ant-dropdown-trigger",
                    },this.$params))
                    this.$send(info, {
                        headers:{
                            'Content-Type':'text/plain; charset=UTF-8',
                            'access-control-allow-origin':'*',
                        }
                    })
                }catch (e) {
                    this.$error(e.message)
                }
            }
        }
    ]
});
```
