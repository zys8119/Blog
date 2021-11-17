# rem计算

## 使用方法

main.ts

```typescript
import {createApp} from "vue"
import remPlug from "./index"
createApp(<any>App)
    .use(remPlug)
    .mount("#app")
```

vite.config.ts

```typescript
import remPlug from './remPlug.ts'

export default <UserConfig>{
    plugins: [
        remPlug({
            base:1440
        }),
    ],
}

```