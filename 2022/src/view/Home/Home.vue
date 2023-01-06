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
                <section v-if="isMd" :data-markdown="fileUrl" data-background-color="#10162c" v-bind="query">
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
const vm = getCurrentInstance()
const route = useRoute()
const router = useRouter()
const queryLocal = ref({})
const query:any = computed(() => l_merge({}, route.query, queryLocal.value))
const container = ref()
const fileUrl = computed(() => typeof query.value.fileUrl === 'string' ? decodeURIComponent(query.value.fileUrl as string) : null)
const isMd = computed(() => /\.md/.test(fileUrl.value as any))
const isHtml = computed(() => /\.(html|htm|vue)/.test(fileUrl.value as any))
const html = ref<string>(null)
watchEffect(async() => {
    if (isHtml.value) {
        try {
            html.value = await (await fetch(query.value.fileUrl as string)).text()
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
                if (query.value.configApiUrl) {
                    try {
                        let config:any = {}
                        try {
                            // 尝试json
                            config = await (await fetch(decodeURIComponent(query.value.configApiUrl as string))).json()
                        } catch (e) {
                            try {
                                // 尝试脚本
                                config = eval(await (await fetch(decodeURIComponent(query.value.configApiUrl as string))).text())
                            } catch (e) {
                                // err
                                console.error(e)
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
watch(computed(() => query.value), init)
onMounted(() => {
    init()
    if (query.value.title) {
        document.title = query.value.title as string
    }
})
defineExpose({
    init,
    route,
    router,
    deck,
    fileUrl,
    defaultMd,
    isMd,
    isHtml,
    html,
    container,
    queryLocal,
    Reveal,
    show,
    vm
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
