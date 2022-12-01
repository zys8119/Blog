import BuildServe from "ts-node-build"
import {resolve} from "path"
const result:any = {}
const inputFilesDir = [
    "wisdom-plus",
    "vue3-framework"
]
new BuildServe({
    cwd:resolve(__dirname, '..'),
    outDir:'./Dome/dist',
    inputFilesOptions:{
        absolute:true
    },
    isOutDir:false,
    inputFiles:inputFilesDir.map(e=>`./${e}/node_modules/**/package.json`),
    onError(this: Error): Promise<any> | void {
        console.log(this, 2222)
    },
    rules:[
        {
            rule:/\.json/,
            transform({file, code}): Promise<string | void> | string | void {
                try {
                    const json:any = JSON.parse(code)
                    let bool = [
                        new RegExp([
                            'obsession-ui',
                            'wp-request',
                            'unplugin-auto-import-element-plus-preset',
                            'wp-validate',
                            'wp-preprocessor',
                            'vite-plugin-fz',
                            '@oasis-end/utils',
                            '@oasis-end/ui',
                            '@oasis-end/ionicons',
                        ].join("|"),'img').test(JSON.stringify(json.name)),
                        /chentao|Jooies/.test(JSON.stringify(json.author)),
                        /zhijiasoft/.test(JSON.stringify(json.repository))
                    ].includes(true)
                    if(bool){
                        result[json.name] = file
                    }
                }catch (e){
                    // console.log(file, 3333)
                }

            }
        }
    ]
}).compile().then(()=>{
    console.log(result)
})
