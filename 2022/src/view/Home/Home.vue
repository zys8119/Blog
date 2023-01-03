<template>
    <div v-if="show" ref="container" class="Home reveal">
        <div class="slides">
            <section data-markdown data-background-color="#10162c">
                <textarea data-template>
                    # 2023
                    # 年度工作计划

                    ---

                    # dasdas
                  </textarea>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
// https://revealjs.com/markup/
import Reveal from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js'
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
                plugins: [ Markdown ],
            })
            deck.value.initialize()
        }, 500)
    })
}
import.meta.hot.dispose(init)
onMounted(() => {
    init()
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
