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

// PromiseClass.allSettled([
//     new PromiseClass(resolve => {
//         resolve(888)
//     }).finally(()=>{
//         console.log(9999)
//     }),
//     PromiseClass.resolve(66),
//     PromiseClass.resolve(1),
//     PromiseClass.resolve(2),
//     PromiseClass.reject(3),
//     PromiseClass.resolve(5),
//     PromiseClass.resolve(6),
//     "asdasda"
// ]).then(res=>{
//     console.log(res,1,"=============")
// }).catch(res=>{
//     console.log(res,2,"=============")
// }).finally(()=>{
//     console.log(666666)
// }).finally(()=>{
//     console.log(666666)
// })

// new PromiseClass(resolve => {
//     resolve("Asdada")
// }).then(res=>{
//     console.log(res,88888888)
//     return PromiseClass.resolve(6666).finally(()=>{
//         console.log(555555)
//     });
// }).finally(()=>{
//     console.log(7777777777)
// }).finally(()=>{
//     console.log(7777777777+1)
// }).then(res=>{
//     console.log(res)
// })

// @ts-ignore
// new Promise(resolve => {
//     resolve("Asdada",11111)
// }).then(res=>{
//     console.log(res,88888888,1111)
//     // @ts-ignore
//     return Promise.resolve(6666).finally(()=>{
//         console.log(555555,1111)
//     });
// }).finally(()=>{
//     console.log(7777777777,1111)
// }).finally(()=>{
//     console.log(7777777777+1,11111)
// }).then(res=>{
//     console.log(res,1111)
// })

// @ts-ignore
// Promise.allSettled([
//     // @ts-ignore
//     new Promise(resolve => {
//         resolve(888)
//     }).finally(()=>{
//         console.log(9999,1111)
//     }),
//     // @ts-ignore
//     Promise.resolve(66),
//     // @ts-ignore
//     Promise.resolve(1),
//     // @ts-ignore
//     Promise.resolve(2),
//     // @ts-ignore
//     Promise.reject(3),
//     // @ts-ignore
//     Promise.resolve(5),
//     // @ts-ignore
//     Promise.resolve(6),
//     "asdasda"
// ]).then(res=>{
//     console.log(res,11,"=============")
// }).catch(res=>{
//     console.log(res,22,"=============")
// }).finally(()=>{
//     console.log(666666,111)
// }).finally(()=>{
//     console.log(666666,1111)
// })

PromiseClass.any([
    PromiseClass.reject(9),
    PromiseClass.reject(2),
    PromiseClass.reject(12),
    PromiseClass.reject(3),
    PromiseClass.resolve(4),
]).then(res=>{
    console.log(res,11111)
}).catch(err=>{
    console.log(err,222222)
})

PromiseClass.race([
    PromiseClass.resolve(12),
    PromiseClass.reject(3),
    PromiseClass.resolve(9),
    PromiseClass.reject(2),
    PromiseClass.resolve(4),
]).then(res=>{
    console.log(res,3333333)
}).catch(err=>{
    console.log(err,44444444)
})