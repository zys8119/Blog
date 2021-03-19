import vue, { PluginObject } from "vue"
import axios, { AxiosRequestConfig } from "axios"
const ConsolePulg:PluginObject<any> = {
    install(Vue,options = {}){
        // @ts-ignore
        window.$ConsolePluginObjectClass = new PluginObjectClass(Vue, options);
    }
}
export default ConsolePulg;

interface PluginObjectClassConfig {
    AxiosConfig?:AxiosRequestConfig;
    getCustomData?():any;// 获取自定义数据
}

class PluginObjectClass{
    config:PluginObjectClassConfig = {};
    constructor(Vue, options) {
        this.config = {
            AxiosConfig:<AxiosRequestConfig>{
                baseURL:"http://localhost:81/",
                url:"/Dome/Index/console",
                method:"post",
            },
            getCustomData(){},
            ...options,
        }
        this.initErrorMonitor();
    }

    /**
     * 初始化错误监听
     */
    initErrorMonitor(){
        let _this = this;
        let errorOldFun = window.console.error;
        window.console.error = function (){
            const args = arguments;
            _this.onMessage(args,"console.error").then(()=>{
                errorOldFun.apply(null,args);
            });
        }
        window.addEventListener('error', (e)=>{
            this.onMessage(e,"addEventListener");
        }, true);
        window.addEventListener("unhandledrejection", (e)=> {
            this.onMessage(e,"unhandledrejection");
        }, true);
        // 请求错误(XMLHttpRequest)
        let addEventListener = window.XMLHttpRequest.prototype.addEventListener;
        window.XMLHttpRequest.prototype.addEventListener = function (){
            console.log(arguments,666666666)
        }

    }

    /**
     * 错误消息拦截
     */
    onMessage(errorData, type:string){
        let data = {
            errorData,
            type,
            pageUrl:location.href,
            pageTitle:document.title,
            customData:this.config.getCustomData()
        }
        switch (Object.prototype.toString.call(errorData)) {
            case "[object Event]":
                data.errorData = {
                    ...data.errorData,
                    timeStamp:data.errorData.timeStamp,
                    type:data.errorData.type,
                    path:data.errorData.path.map((el:Element)=>{
                        return `【tagName】${(el.tagName || "").toLocaleLowerCase()}->【class】${el.className}->【id】${el.id}`
                    }),
                    message:data.errorData.message,
                    error:data.errorData.error,
                    toStringType:"[object Event]",
                };
                break;
            case "[object Arguments]":
                data.errorData = {};
                ([...errorData]).forEach((it,k)=>{
                    let dataObj = {
                        toStringType:"[object Arguments]",
                        error:null,
                    };
                    try {
                        dataObj.error = it.error || it.stack || it;
                    }catch (e){
                        dataObj.error = it;
                    }
                    data.errorData["error_"+k] = dataObj;
                })
                break;
            default:
                try {
                    data.errorData = {
                        data:JSON.stringify(errorData),
                        toStringType:"[object default]",
                    }
                }catch (e){
                    data.errorData = {
                        data:errorData,
                        toStringType:"[object default]",
                    };
                }
                break;
        }
        return new Promise(resolve => {
            axios({
                ...this.config.AxiosConfig,
                data,
            }).then(res=>{
                resolve();
            }).catch(()=>{
                resolve();
            })
        })
    }
}