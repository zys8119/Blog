const animationFn = (callback:(progress:number)=>boolean | void, timeout:number, sync?:boolean, resolve?:any, reject?:any) => {
    try {
        let isReturn = false
        let ra:any = null
        let startTime = Date.now()
        const endTime = startTime + (timeout === 0 ? Infinity : timeout)
        const fn = () => {
            let progress = Number(((timeout - (endTime - startTime)) / timeout))
            if (progress < 0) {progress = 0}
            if (progress > 1) {progress = 1}
            isReturn = callback(progress) as boolean
            if (progress >= 1) {
                if (!sync) {
                    cancelAnimationFrame(ra)
                }
                resolve(progress)
                return
            }
            startTime = Date.now()
            if (sync) {
                if (!isReturn) {
                    ra = fn()
                }
            } else {
                ra = requestAnimationFrame(fn)
            }
        }
        isReturn = callback(0) as boolean
        if (sync) {
            if (!isReturn) {
                ra = fn()
            }
        } else {
            ra = requestAnimationFrame(fn)
        }
    } catch (e) {
        reject(e)
    }
}
const animation = (callback:(progress:number)=>boolean | void, timeout:number, sync?:boolean) => {
    if (sync) {
        animationFn(callback, timeout, sync, () => {}, (e:Error) => {
            throw e
        })
    } else {
        return new Promise((resolve, reject) => {
            animationFn(callback, timeout, sync, resolve, reject)
        })
    }
}
export default animation
