<template>
    <div ref="container" class="Home">
        <div class="slides">
            <section>Horizontal Slide</section>
            <section>
                <section>Vertical Slide 1</section>
                <section>Vertical Slide 2</section>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import Reveal from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js'
const container = ref()
onMounted(() => {
    const deck = new Reveal(container.value, {
        plugins: [ Markdown ],
    })
    deck.initialize()
})
</script>

<style scoped lang="less">
.Home {
}
</style>
