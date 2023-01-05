<template>
    <div class="Home">
        <div
            v-if="show"
            ref="container"
            class="reveal reveal-viewport"
            :class="{
                'markdown-body':query.githubCss !== 'false'
            }"
        >
            <div v-if="isHtml && html" class="slides" v-bind="query" v-html="html"/>
            <div v-else class="slides">
                <section v-if="isMd" :data-markdown="$route.query.fileUrl" data-background-color="#10162c" v-bind="query">
                    <textarea data-template v-text="defaultMd"/>
                </section>
                <section v-else data-markdown data-background-color="#10162c" v-bind="query">
                    <textarea data-template v-text="defaultMd"/>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// https://revealjs.com/markup/
import Reveal, {Options} from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js'
import highlight from 'reveal.js/plugin/highlight/highlight.esm.js'
import search from 'reveal.js/plugin/search/search.esm.js'
import notes from 'reveal.js/plugin/notes/notes.esm.js'
import math from 'reveal.js/plugin/math/math.esm.js'
import zoom from 'reveal.js/plugin/zoom/zoom.esm.js'
import defaultMd from './default.md?raw'
const {query} = useRoute()
const container = ref()
const isMd = computed(() => /\.md$/.test(query.fileUrl as any))
const isHtml = computed(() => /\.(html|htm)$/.test(query.fileUrl as any))
const html = ref<string>(null)
watchEffect(async() => {
    if (isHtml.value) {
        try {
            html.value = await (await fetch(query.fileUrl as string)).text()
        } catch (e) {
            console.error(e)
        }
    }
})

const deck = ref<Reveal.Api>()
const show = ref<boolean>(true)
const init = () => {
    show.value = false
    nextTick(() => {
        show.value = true
        setTimeout(() => {
            deck.value?.destroy?.()
            deck.value = new Reveal(container.value, {
                plugins: [ Markdown, highlight, search, notes, math, zoom ],
            })
            deck.value.initialize(l_merge({} as Options, window.revealJsConfig))
            ;(async() => {
                if (query.configApiUrl) {
                    try {
                        let config:any = {}
                        try {
                            // 尝试json
                            config = await (await fetch(query.configApiUrl as string)).json()
                        } catch (e) {
                            try {
                                // 尝试脚本
                                config = eval(await (await fetch(query.configApiUrl as string)).text())
                            } catch (e) {
                                // err
                            }
                        }
                        deck.value.configure(l_merge({}, config))
                    } catch (e) {
                        console.error(e)
                    }
                }
            })()
        }, 500)
    })
}
if (import.meta.env.DEV) {
    import.meta.hot.dispose(init)
}
watch(query, init)
onMounted(() => {
    init()
    if (query.title) {
        document.title = query.title as string
    }
})
</script>

<style  lang="less">
.Home {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}
</style>
