# vue3+vite 动态路由

router.ts

```typescript
import {createRouter, createWebHashHistory, RouterView} from "vue-router"
let files = import.meta.glob("./views/**/*.{vue,jsx,tsx}", {})
const pages = import.meta.glob("./views/**/page.json", {eager:true, import:'default'})
const filesKeys = Object.keys(files)
const metaMaps = ROUTES_META
let routes:any = []
// 平铺路由
for(const [key, component] of Object.entries(files)){
    const path = key.replace(/^\.\/views|\.(vue|jsx|tsx)$/img,'')
    const name = path.split('/').filter(e=>e).join("-")
    const fileName = /(?:\/?([^\/]+\.(vue|jsx|tsx)$))/.exec(key)[1]
    const pageJson = key.replace(fileName,'page.json')
    const directory = key.replace('/'+fileName, '')
    const layoutRegs = directory.split('/').map((e, i, arr)=>arr.slice(0, i+1).join('/')).map(e=> new RegExp(`^${e}\/layout\\.(vue|jsx|tsx)`, 'img'))
    const layout = filesKeys.find(e=>layoutRegs.some(ee=>ee.test(e)))
    // 过滤Alert
    if(!/\/alert\//.test(key)){
        console.log()
        routes.push({
            component,
            name,
            path:path.toLowerCase(),
            key,
            fileName,
            layout,
            directory,
            meta:Object.assign(metaMaps[key] || {}, (pages[pageJson] || {})[fileName] || {})
        })
    }
}

const pathToTree = (input, reg) => {
    const currInput = input.map(e=>e.replace(/^\.\/views\//,''))
    const output = [];
    for (let i = 0; i < currInput.length; i++) {
        const key = currInput[i]
        const chain = key.replace(reg, '').split("/");
        const chainJoin = chain.join("-").toLowerCase();
        const suffix = key.match(reg)[1]
        let currentNode:any = output;
        for (let j = 0; j < chain.length; j++) {
            const wantedNode = chain.slice(0, j+1).join('-').toLowerCase();
            const lastNode = currentNode;
            let k = 0
            for (; k < currentNode.length; k++) {
                if (currentNode[k].name == wantedNode) {
                    currentNode = currentNode[k].children;
                    break;
                }
            }
            if (lastNode == currentNode) {
                const directory = chainJoin !== wantedNode
                const path = `./views/${chain.slice(0, j+1).join('/')}${directory ? '' : `.${suffix}`}`
                let layoutComponent:any = RouterView
                if(directory){
                    const layoutPath = input.find(e=>new RegExp(`^${path}\/layout\\.(vue|jsx|tsx)`, 'img').test(e))
                    if(layoutPath){
                        layoutComponent = files[layoutPath]
                    }
                }
                const pageJsonPath = path.replace(new RegExp(`${chain[j]}\\.${suffix}$`,'i'), 'page.json')
                const newNode = {
                    key,
                    name: wantedNode,
                    children: [],
                    directory,
                    suffix:directory ? null : suffix,
                    filePath:path,
                    path:chain[j].toLowerCase(),
                    component:directory ? layoutComponent : files[path],
                    meta:Object.assign(metaMaps[key] || {},(pages[pageJsonPath] || {})[`${chain[j]}.${suffix}`] || {})
                };
                currentNode[k] = newNode
                currentNode = newNode.children;
            } else {
                delete currentNode.children
            }
        }
    }
    return output.map(e=>({
        ...e,
        path:`/${e.path}`
    }));
}

// 嵌套路由
routes = routes.filter(e=>!e.layout).concat(pathToTree(routes.filter(e=>e.layout).map(e=>e.key),/\.(vue|tsx|jsx)$/))
export default createRouter({
    history:createWebHashHistory(),
    routes
})

```

vite.config.ts 

```typescript
import {readFileSync} from 'fs'
import * as sfc from 'vue/compiler-sfc'
import glob from 'fast-glob'
const ROUTES_META = function ():Plugin{
    let routeModuleId = null
    return {
        name:"ROUTES_META",
        enforce:'pre',
        load(id){
            if(/route\.ts$/.test(id)){
                routeModuleId = id
                const map = glob.sync("**/*.vue", {absolute:true}).reduce((res, id)=>{
                    const code = readFileSync(id, 'utf-8')
                    const descriptor = sfc.parse(`${code.match(/<script([^>])*>/)?.[0] || '<script>'}console.log(1)<script/>`).descriptor
                    return {
                        ...res,
                        [id.replace(process.cwd(),'.')]:descriptor?.scriptSetup?.attrs
                    }
                },{})
                return readFileSync(id, 'utf-8').replace('ROUTES_META', JSON.stringify(map))
            }
        },
        handleHotUpdate(cxt){
            cxt.server.reloadModule(cxt.server.moduleGraph.getModuleById(routeModuleId))
        }
    }
}

declare global{
    const ROUTES_META:Record<string, any>
}


export default defineConfig({
    plugins:[
        ROUTES_META()
    ]
})
```
