# monaco-editor 配置worker文件及typescript类型声明扩展

## 安装

`npm i monaco-editor`

## 使用

1、创建 MonacoEnvironment.ts 文件，内容如下：

```typescript
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'
import {Environment, languages} from "monaco-editor"
import global from "./global.ts?raw"

declare global {
    interface Window {
        MonacoEnvironment: any
    }
}

self.MonacoEnvironment = <Environment> {
    getWorker: async function (moduleId, label) {
        return new ({
            less:cssWorker,
            scss:cssWorker,
            css:cssWorker,

            html:htmlWorker,
            handlebars:htmlWorker,
            razor:htmlWorker,

            json:jsonWorker,

            typescript:tsWorker,
            javascript:tsWorker,
        }[label] || editorWorker)
    }
}

languages.typescript.typescriptDefaults.addExtraLib(global)
```

2、业务使用

```tsx
import {defineComponent, ref, onMounted, unref} from "vue";
import * as monaco from 'monaco-editor';
import './MonacoEnvironment';
import Test from "./test?raw"

export default defineComponent({
    name:"test",
    setup(){
        const mdContainer = ref()
        onMounted(async ()=>{
            const md = monaco.editor.create(mdContainer.value, {
                language: 'typescript',
                theme:"vs-dark",
                value:Test
            });
        })
        return ()=> (<div class={'md'} ref={mdContainer}></div>)
    }
})
```
