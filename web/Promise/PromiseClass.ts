export interface PromiseConstructor<T> {
    onfulfilled: Array<(value: any) => T>;
    onrejected: Array<(value: any) => T>;
    onFinally: Array<() => T>;

    new<T>(executor: (resolve?: (value?: T) => void, reject?: (reason?: any) => void) => void): PromiseConstructor<T[]>;

    then<TResult1 = T, TResult2 = never>(onfulfilled: (value: T) => TResult1, onrejected?: (value: any) => TResult2): PromiseConstructor<T>

    catch<TResult2 = never>(onrejected: (value: any) => TResult2): PromiseConstructor<T>

    reject<T = never>(reason?: any): PromiseConstructor<T>;

    resolve<T>(value: T): PromiseConstructor<T>;

    resolve(): PromiseConstructor<T>;

    resolve(...args:Array<T>): PromiseConstructor<T>;

    finally(onFinally:()=>void): PromiseConstructor<T>;

    all<T>(values: Array<PromiseConstructor<T>>): PromiseConstructor<T>;

    allSettled<T>(values: Array<PromiseConstructor<T>>): PromiseConstructor<T>;

}

export interface PromiseClass extends PromiseConstructor<any>{}

/**
 * Finally 函数处理
 * @param allPublicResUlt 当前实例
 */
export const onFinallyPublic = (allPublicResUlt)=>{
    setTimeout(()=>{
        if(Object.prototype.toString.call(allPublicResUlt.onFinally) === "[object Array]"){
            while (allPublicResUlt.onFinally.length > 0){
                allPublicResUlt.onFinally.shift()();
            }
        }
    })
}

/**
 * 全部批处理公共函数
 * @param value 待批处理的 PromiseClass 数组
 * @param type 执行类型：all | allSettled
 */
export const allPublic = function (value: Array<any>, type:string = "all"):PromiseConstructor<any>{
    if(Object.prototype.toString.call(value) !== "[object Array]"){
        throw ("不是一个有效的数组");
    }
    let lng = value.length;
    // 创建长度与value长度一致的数据，并默认填充[object Empty]类型，用于等待查询判断
    let resUlt_resolve = (<any>"_").repeat(lng).split("").map(()=>"[object Empty]");
    let resUlt_reject = null;
    let resUlt_reject_bool = false;
    const getRes = (res:any, resType:number)=>({
        "all":res,
        "allSettled":{
            status:[1,3].some(t=>t === resType) ? "fulfilled" : "rejected",
            value:res,
        }
    }[type] || res);
    value.forEach((it:any,k)=>{
        if (it && it.constructor && it.constructor.name === "PromiseClass") {
            it.then(res=>{
                resUlt_resolve[k] = getRes(res,1);
            }).catch(res=>{
                if(type === "allSettled"){
                    resUlt_resolve[k] = getRes(res,2);
                    return;
                }
                if(!resUlt_reject_bool){
                    resUlt_reject = getRes(res,2);
                    resUlt_reject_bool = true;
                }
            })
        }else {
            resUlt_resolve[k] = getRes(it,3);
        }
    });
    const allPublicResUlt = new PromiseClass((resolve1, reject1) => {
        const InquireFun = ()=>{
            new PromiseClass((resolve2, reject2) => {
                if(resUlt_resolve.filter(e=>e !== "[object Empty]").length === lng){
                    // 全部成功
                    resolve2(resUlt_resolve);
                }else {
                    if(resUlt_reject_bool){
                        // 任何一个失败
                        reject2(resUlt_reject);
                    }else {
                        // 即没失败也没成功，则继续等待询问
                        InquireFun()
                    }
                }
            }).then((res)=>{
                resolve1(res)
            }).catch((err)=>{
                reject1(err)
            })
        }
        InquireFun();
    }).then(res=>{
        onFinallyPublic(allPublicResUlt);
        return res;
    }).catch(res=>{
        onFinallyPublic(allPublicResUlt);
        return res;
    })
    return allPublicResUlt;
}

/**
 * 递归执行 成功或失败回调
 * @param onfulfilled 成功回调数组
 * @param onrejected 失败回调数组
 * @param arg 参数
 * @param bool 是否失败
 */
export const resultResolve = function (onfulfilled:Array<(value: any) => any>, onrejected:Array<(value: any) => any>, arg:Array<any>, bool:boolean = true) {
    if (onfulfilled) {
        if(typeof onfulfilled[0] === "function"){
            let value = onfulfilled.shift().apply(null, arg);
            if (value && value.constructor && value.constructor.name === "PromiseClass") {
                value
                    .then(res => {
                        if(bool){
                            resultResolve.call(this,onfulfilled, onrejected, [res], bool);
                        }else {
                            resultResolve.call(this,onrejected,onfulfilled, [res] , false);
                        }
                    })
                    .catch(res=>{
                        resultResolve.call(this,onrejected,onfulfilled, [res] , false);
                    })
            } else {
                resultResolve.call(this,onfulfilled, onrejected, [value], bool);
            }
        }
    }
}

export class PromiseClass<T = any> implements PromiseClass<T> {
    onfulfilled = [];
    onrejected = [];
    onFinally = [];

    constructor(executor: (resolve?: (value?: T) => void, reject?: (reason?: any) => void) => void) {
        setTimeout(() => {
            executor(this.resolve.bind(this), this.reject.bind(this));
        });
    }

    then<TResult1 = T, TResult2 = never>(onfulfilled?: (value: T) => TResult1, onrejected?: (value: any) => TResult2): PromiseClass<T> {
        if (onfulfilled) {
            this.onfulfilled.push(<any>onfulfilled)
        }
        if (onrejected) {
            this.onrejected.push(<any>onrejected)
        }
        return this;
    }

    catch<TResult2 = never>(onrejected?: (value: any) => TResult2): PromiseClass<T> {
        if (onrejected) {
            this.onrejected.push(onrejected)
        }
        return this;
    }


    finally(onFinally:()=>void): PromiseClass<T> {
        if (onFinally) {
            this.onFinally.push(onFinally)
        }
        return this;
    }

    resolve(...args: Array<any>): PromiseConstructor<any> | any {
        resultResolve.call(this,this.onfulfilled,this.onrejected, args, true);
        onFinallyPublic(this);
    }

    reject(...arg): PromiseConstructor<any> | any {
        resultResolve.call(this,this.onrejected,this.onfulfilled, arg, false);
        onFinallyPublic(this);
    }

    static resolve(...args): PromiseConstructor<any> {
        this.prototype.resolve.apply(this, args)
        const resolveResUlt = new PromiseClass((resolve) => {
            resolve.apply(null, args);
        });
        return resolveResUlt
            // .then(res=>{
            //     onFinallyPublic(resolveResUlt);
            //     return res;
            // })
            // .catch(res=>{
            //     onFinallyPublic(resolveResUlt);
            //     return res;
            // })
    }

    static reject(...args): PromiseConstructor<any> {
        this.prototype.reject.apply(this, args)
        const rejectResUlt = new PromiseClass((resolve, reject) => {
            reject.apply(null, args);
        });
        return rejectResUlt
            .then(res=>{
                onFinallyPublic(rejectResUlt);
                return res;
            })
            .catch(res=>{
                onFinallyPublic(rejectResUlt);
                return res;
            })
    }

    static all(value: Array<any>):PromiseConstructor<any>{
        return allPublic(value, "all");
    }

    static allSettled(value: Array<any>):PromiseConstructor<any>{
        return allPublic(value, "allSettled");
    }

}

export default PromiseClass;