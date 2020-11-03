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

    resultResolve(onfulfilled, arg, index = 0) {
        if (typeof onfulfilled[index] === "function") {
            var value = onfulfilled[index].apply(null, arg);
            if (value && value.constructor && value.constructor.name === "PromiseClass") {
                value.then(res => {
                    this.resultResolve(onfulfilled, [res], index + 1);
                })
            } else {
                this.resultResolve(onfulfilled, [value], index + 1);
            }
        }
    }

    resolve(...args: Array<any>): PromiseConstructor<any> | any {
        const onfulfilled = (this.onfulfilled || (this.onfulfilled = []));
        this.resultResolve(onfulfilled, args);
        return new PromiseClass((resolve) => {
            resolve.apply(null, args);
        });
    }

    reject(...arg): PromiseConstructor<any> | any {
        const onrejected = (this.onrejected || (this.onrejected = []));
        this.resultResolve(onrejected, arg);
        return new PromiseClass((resolve) => {
            resolve.apply(null, arg);
        });
    }

    static resolve(...args): PromiseConstructor<any> {
        return this.prototype.reject.apply(this, args)
    }

    static reject(...args): PromiseConstructor<any> {
        return this.prototype.reject.apply(this, args)
    }

    static resultResolve(...args): PromiseConstructor<any> {
        return this.prototype.resultResolve.apply(this, args)
    }
}

export default PromiseClass;