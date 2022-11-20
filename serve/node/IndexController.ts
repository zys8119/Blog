import applicationController from "uf-node/UnityFrontUtils/controller/applicationController";
import {merge} from "lodash";
const puppeteer = require('puppeteer-core');
export class IndexController extends applicationController {
    async FormData(data:Record<string, any>, boundaryName:string = 'WebAppBoundary'){
        return  {
            contentType:`multipart/form-data; boundary=${boundaryName}`,
            body:Object.entries(data).map(([name, value])=>`
            --${boundaryName}
            Content-Disposition: form-data; name="${name}"
            Content-Type: text/plain
            
            ${value}
        `.split('\n').map(e=>e.trim()).join('\n')).concat([`--${boundaryName}--`]).join('\n')
        }
    }

    /**
     * 按照当前时间随机创建临时邮箱
     */
    async emailCreate(email_suffix:string = 'chacuo.net'){
        return `${Date.now().toString(16)}@${email_suffix}`
    }

    async index(){
        const emit = await this.emailCreate(this.$_query.email_suffix)
        const data = merge({
            email:emit,// 账号邮箱
            password:emit,// 账号密码
            invite_code:'qlmJni8z',// 推荐码，默认自己的
            email_code:'',// 邮箱验证码
            host:'https://giaoyun.xyz',// 域名host
            sub_host:'https://sub.789.st/sub',// 订阅地址域名host
            selector:'#main-container > div > div > div > div > div > div > div:nth-child(3) > div',
            // 判断是否登陆的选择器
            selector_is_login:"#main-container > div > div.block.block-rounded.mb-2 > div > div > div.p-1.p-md-3.col-md-6.col-xs-12.text-md-right > a.btn.btn-sm.btn-primary.btn-rounded.px-3.mr-1.my-1.ant-dropdown-trigger",
        }, this.$_query)
        await this.giaoyunLogin(data)
    }

    async giaoyunLogin({host, sub_host, email, password, selector, selector_is_login, invite_code}: {
        email:string,
        password:string,
        invite_code:string,
        email_code:string,
        host:string
        sub_host:string
        selector:string
        selector_is_login:string
    }){
        console.log("尝试注册")
        const browser = await puppeteer.launch({
        })
        try {
            const page = await browser.newPage();
            await page.goto(`${host}/#/register`)
            console.log("正在写入注册数据")
            await page.type(`${selector}:nth-child(1) input`, email)
            await page.type(`${selector}:nth-child(2) input`, password)
            await page.type(`${selector}:nth-child(3) input`, password)
            await page.type(`${selector}:nth-child(4) input`, invite_code)
            await page.tap(`${selector}:nth-child(5) button`)
            console.log("正在等待注册成功")
            await page.waitForSelector(selector_is_login)
            console.log("注册成功并登陆成功")
            console.log("获取订阅数据中")
            const resultHandle = await page.evaluateHandle( (host)=>{
                return fetch(`${host}/api/v1/user/getSubscribe`).then(res=>res.json())
            }, host)
            const res = await resultHandle.jsonValue()
            const subscribe_url = res?.data?.subscribe_url
            console.log("获取订阅数据：", JSON.stringify(res))
            console.log("订阅链接：", subscribe_url)
            const subscribeInfo = await (await page.evaluateHandle((subscribe_url,sub_host)=>{
                return fetch(sub_host ? `${sub_host}?target=clash&url=${encodeURIComponent(subscribe_url)}` : subscribe_url).then(res=>res.text())
            }, subscribe_url, sub_host)).jsonValue()
            await browser.close()
            this.response.writeHead(200,{
                'Content-Type':'text/plain; charset=UTF-8',
                'access-control-allow-origin':'*',
            });
            this.response.end(subscribeInfo)
        }catch (e){
            console.error(e)
            await browser.close()
            this.$_error()
        }

    }
}
