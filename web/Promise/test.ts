import PromiseClass from "./PromiseClass";

new PromiseClass((resolve, reject) => {
    resolve(11);
    // reject(11);
}).then(function (res){
    console.log(res, 666)
    return 667;
}).then(res=>{
    console.log(res, 22)
    return PromiseClass.resolve(23)
}).then(res=>{
    console.log(res, 33)
}).catch(err=>{
    console.log(err,111.111)
    return PromiseClass.reject(9999);
}).catch(err=>{
    console.log(err,111)
    return 454
}).then(res=>{
    console.log(res, 999)
}).catch(err=>{
    console.log(err,888)
})