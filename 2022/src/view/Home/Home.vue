<template>
    <div ref="container" class="Home">
        Home
    </div>
</template>

<script setup lang="ts">
import Reveal from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js'
const container = ref()
const deck = new Reveal({
    plugins: [ Markdown ],
})
deck.initialize()
</script>

<style scoped lang="less">
.Home {
}
</style>
