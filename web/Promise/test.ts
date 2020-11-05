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

PromiseClass.allSettled([
    PromiseClass.resolve(66),
    PromiseClass.resolve(1),
    PromiseClass.resolve(2),
    PromiseClass.reject(3),
    PromiseClass.resolve(5),
    PromiseClass.resolve(6),
    "asdasda"
]).then(res=>{
    console.log(res,1,"=============")
}).catch(res=>{
    console.log(res,2,"=============")
})

// @ts-ignore
Promise.allSettled([
    Promise.resolve(66),
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.reject(3),
    Promise.resolve(5),
    Promise.resolve(6),
    "asdasda"
]).then(res=>{
    console.log(res,11,"=============")
}).catch(res=>{
    console.log(res,22,"=============")
})