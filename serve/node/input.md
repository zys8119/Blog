# node控制台输入交互

```javascript
class input{
    options = null;
    log = ncol;
    constructor(options = {}) {
        if(options && options.options){
            this.options = options.options.map(e=>e.value);
        }
        ncol.info(`${options.message}${this.options ? "待选项：" :""}`);
        if(this.options){
            ncol.info(`${options.options.map(e =>`${e.value}(${e.name})`).join("、")}`);
        }
        return new Promise((resolve, reject) => {
            this.setEncoding();
            this.readable(() => {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    if(!this.options || (this.options && this.options.some(e=>e == chunk))){
                        if((this.options && this.options.some(e=>e == chunk))){
                            chunk = options.options.find(e=>e.value == chunk)
                        }
                        resolve(chunk)
                    }else {
                        if(options.error){
                            ncol.error(new Error(options.error))
                        }else {
                            reject();
                        }
                    }
                }
            });
            this.end();
        })
    }
    setEncoding(){
        process.stdin.setEncoding('utf8');
    }
    readable(callback){
        process.stdin.on('readable', callback);
    }
    end(){
        process.stdin.on('end', () => {
            process.stdout.write('end');
        });
    }
}

new input({
    message:"请输入",
    error:"asdasda",
    options:[
        {
            name:"选项1",
            value:1,
        },
        {
            name:"选项2",
            value:2,
        },
    ]
}).then(res=>{
    console.log(res)
})
///.catch()
```