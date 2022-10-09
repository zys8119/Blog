const getDateFormat = (str:string)=>{
    const date = new Date();
    return str.replace(/(Y+)|(M+)|(D+)|(H+)|(m+)|(s+)/g, (...arg)=> {
        const [_, $1, $2, $3, $4, $5, $6] = arg as any
        if($1){return ([...$1] as any).map((e, k)=>(date.getFullYear()).toString()[k]).join('')}
        if($2){return ([...$2] as any).map((e, k)=>(date.getMonth() + 1).toString()[k]).join('')}
        if($3){return ([...$3] as any).map((e, k)=>(date.getDate()).toString()[k]).join('')}
        if($4){return ([...$4] as any).map((e, k)=>(date.getHours() + 1).toString()[k]).join('')}
        if($5){return ([...$5] as any).map((e, k)=>(date.getMinutes() + 1).toString()[k]).join('')}
        if($6){return ([...$6] as any).map((e, k)=>(date.getSeconds() + 1).toString()[k]).join('')}
    })
}


console.log(getDateFormat(`YYYY-MM-DD mm:HH:ss`))
