import PromiseClass from "./PromiseClass";


// new Promise((resolve, reject) => {
//     console.log("===========")
//     resolve(454);
// }).then(res=>{
//     console.log(res);
//     return Promise.resolve(res+1)
// }).then(res=>{
//     console.log(res);
//     return Promise.resolve(res+2)
// }).then(res=>{
//     console.log(res);
//     return Promise.reject(1114)
// }).catch(res=>{
//     console.log(res,999);
//     return Promise.resolve(11144444)
// }).catch(errs=>{
//     console.log(errs,8888);
// }).then(errs=>{
//     console.log(errs,66666);
//     return 454
// }).then(res=>{
//     console.log(res)
//     console.log("===========")
// })
//
// new PromiseClass((resolve, reject) => {
//     resolve(454);
// }).then(res=>{
//     console.log(res);
//     return PromiseClass.resolve(res+1)
// }).then(res=>{
//     console.log(res);
//     return PromiseClass.resolve(res+2)
// }).then(res=>{
//     console.log(res);
//     return PromiseClass.reject(1114)
// }).catch(res=>{
//     console.log(res,999);
//     return PromiseClass.resolve(11144444)
// }).catch(errs=>{
//     console.log(errs,8888);
// }).then(errs=>{
//     console.log(errs,66666);
//     return 454;
// }).then(res=>{
//     console.log(res)
// })

PromiseClass.all([
    PromiseClass.resolve(123),
    PromiseClass.reject(123+3333),
    PromiseClass.reject(123+3333),
    PromiseClass.resolve(123),
    PromiseClass.resolve(123),
]).then(res=>{
    console.log(res,1,"=============")
}).catch(res=>{
    console.log(res,2,"=============")
})

@ts-ignore
Promise.all([
    Promise.resolve(123),
    Promise.resolve(123),
    Promise.reject(123),
    Promise.reject(123),
    Promise.resolve(123),
    Promise.resolve(123),
]).then(res=>{
    console.log(res,11,"=============")
}).catch(res=>{
    console.log(res,22,"=============")
})