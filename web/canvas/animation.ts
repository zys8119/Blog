export default (callback:Function, timeout:number)=>new Promise((resolve, reject)=>{
    try {
        let ra = null;
        let startTime = Date.now();
        let endTime = startTime+timeout;
        const fn = ()=>{
            let progress = Number(((timeout - (endTime - startTime))/timeout));
            if(progress < 0){progress = 0}
            if(progress > 1){progress = 1}
            callback(progress)
            if(progress >= 1){
                cancelAnimationFrame(ra);
                resolve(progress)
                return;
            }
            startTime = Date.now();
            ra = requestAnimationFrame(fn);
        }
        callback(0)
        ra = requestAnimationFrame(fn)
    }catch (e) {
        reject(e)
    }
})