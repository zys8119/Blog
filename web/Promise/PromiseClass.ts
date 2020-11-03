export interface PromiseConstructor<T> {
    onfulfilled: Array<(value: any) => T>;
    onrejected: Array<(value: any) => T>;

    new<T>(executor: (resolve?: (value?: T) => void, reject?: (reason?: any) => void) => void): PromiseConstructor<T[]>;

    then<TResult1 = T, TResult2 = never>(onfulfilled: (value: T) => TResult1, onrejected: (value: any) => TResult2): PromiseConstructor<T>

    catch<TResult2 = never>(onrejected: (value: any) => TResult2): PromiseConstructor<T>

    resultResolve(onfulfilled:Array<(value: any) => T>,arg:Array<any>,index?:number):void;

    reject<T = never>(reason?: any): PromiseConstructor<T>;

    resolve<T>(value: T): PromiseConstructor<T>;

    resolve(): PromiseConstructor<T>;

    resolve(...args:Array<T>): PromiseConstructor<T>;

    all<T>(values: Array<PromiseConstructor<T>>): PromiseConstructor<T>;

}

export interface PromiseClass extends PromiseConstructor<any>{}

export class PromiseClass<T = any> implements PromiseClass<T> {
    onfulfilled = [];
    onrejected = [];

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

    resultResolve(onfulfilled, onrejected, arg, bool = true) {
        if (onfulfilled) {
            if(typeof onfulfilled[0] === "function"){
                let value = onfulfilled.shift().apply(null, arg);
                if (value && value.constructor && value.constructor.name === "PromiseClass") {
                    value
                        .then(res => {
                            if(bool){
                                this.resultResolve(onfulfilled, onrejected, [res], bool);
                            }else {
                                this.resultResolve(onrejected,onfulfilled, [res] , false);
                            }
                        })
                        .catch(res=>{
                            this.resultResolve(onrejected,onfulfilled, [res] , false);
                        })
                } else {
                    this.resultResolve(onfulfilled, onrejected, [value], bool);
                }
            }
        }
    }

    resolve(...args: Array<any>): PromiseConstructor<any> | any {
        this.resultResolve(this.onfulfilled,this.onrejected, args, true);
    }

    reject(...arg): PromiseConstructor<any> | any {
        this.resultResolve(this.onrejected,this.onfulfilled, arg, false);
    }

    static resolve(...args): PromiseConstructor<any> {
        this.prototype.resolve.apply(this, args)
        return new PromiseClass((resolve) => {
            resolve.apply(null, args);
        });
    }

    static reject(...args): PromiseConstructor<any> {
        this.prototype.reject.apply(this, args)
        return new PromiseClass((resolve, reject) => {
            reject.apply(null, args);
        });
    }

    static resultResolve(...args): PromiseConstructor<any> {
        return this.prototype.resultResolve.apply(this, args)
    }

    static all(value: Array<PromiseConstructor<any>>):PromiseConstructor<any>{
        if(Object.prototype.toString.call(value) !== "[object Array]"){
            throw ("不是一个有效的数组");
        }
        let resUlt_resolve = [];
        value.forEach((it:any)=>{
            if (it && it.constructor && it.constructor.name === "PromiseClass") {
                it.then(res=>{
                    resUlt_resolve.push(res)
                })
            }
        })
        return PromiseClass.resolve(resUlt_resolve)
    }

}

export default PromiseClass;