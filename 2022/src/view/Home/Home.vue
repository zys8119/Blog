<template>
    <div
        v-if="show"
        ref="container"
        class="Home reveal"
        :class="{
            'markdown-body':query.githubCss !== 'false'
        }"
    >
        <div class="slides">
            <section v-if="typeof $route.query.fileUrl === 'string'" :data-markdown="$route.query.fileUrl" data-background-color="#10162c">
                <textarea data-template v-text="defaultMd"/>
            </section>
            <section v-else data-markdown data-background-color="#10162c">
                <textarea data-template v-text="defaultMd"/>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
// https://revealjs.com/markup/
import Reveal from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js'
import highlight from 'reveal.js/plugin/highlight/highlight.esm.js'
import defaultMd from './default.md?raw'
import {useRoute} from 'vue-router'
const container = ref()

const deck = ref<Reveal.Api>()
const show = ref<boolean>(true)
const init = () => {
    show.value = false
    nextTick(() => {
        show.value = true
        setTimeout(() => {
            deck.value?.destroy?.()
            deck.value = new Reveal(container.value, {
                plugins: [ Markdown, highlight ],
            })
            deck.value.initialize()
        }, 500)
    })
}
if (import.meta.env.DEV) {
    import.meta.hot.dispose(init)
}
const {query} = useRoute()
onMounted(() => {
    init()
    if (query.title) {
        document.title = query.title as string
    }
})
</script>

<style scoped lang="less">
.Home {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    :deep(.reveal){
        .make-it-pop {
            filter: drop-shadow(0 0 10px purple);
        }
    }
}
</style>
