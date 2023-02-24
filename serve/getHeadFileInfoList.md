# 获取git指定Head节点文件详情

```typescript
import {execSync} from "child_process"
const defaultCwd = process.cwd()
const lsTree = (head:string, callback?:(options:{index:string, type:string, hash:string, fileName:string, filePath:string, children})=>void, cwd?:string, filePath:string = '')=>{
    try {
        return execSync(`git ls-tree ${head}`, {encoding:'utf-8', cwd:cwd || defaultCwd}).split('\n')
            .filter(e=>e)
            .map(e=>{
                const [index, type, hash, fileName] = e.replace(/\s+/g,',').split(',')
                const prevFilePath = filePath + (filePath ? '/' : '') + fileName
                const children = type === 'tree' ? lsTree(hash, callback, cwd, prevFilePath) : []
                const result = {index, type, hash, fileName, children, filePath:prevFilePath}
                callback?.(result)
                return result
            })
    }catch (e){
        return []
    }
}
const getHeadFileInfoList = (head:string, cwd?:string)=>{
    const treeMap = {}
    const tree = lsTree(head, (e)=>{
        treeMap[e.filePath] = e;
    }, cwd)
    return {
        tree,
        treeMap,
    }
}
const list = getHeadFileInfoList("b428bdb3", "/Users/zhangyunshan/work/internationalconventioncenter")
const fileInfo = list.treeMap['src/views/ContractManagement/Quotation/QuotationList/Index.vue']
console.log(fileInfo)
console.log(execSync(`git show ${fileInfo.hash}`, {cwd:"/Users/zhangyunshan/work/internationalconventioncenter", encoding:'utf-8'}))

```
