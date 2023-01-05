import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
export default defineConfig({
    base:'',
    plugins:[
        vue(),
        AutoImport({
            include: [
                /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
                /\.vue$/, /\.vue\?vue/, // .vue
                /\.md$/, // .md
            ],
            imports: [
                'vue',
                'vue-router',
                '@vueuse/core',
                'pinia'
            ],
            resolvers: [
            ]
        }),
        Components({
            resolvers: [
            ]
        }),
    ],
    resolve:{
        alias:{
            '@':path.resolve(__dirname, 'src')
        }
    }
})
