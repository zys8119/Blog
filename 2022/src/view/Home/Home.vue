<template>
    <div ref="container" class="Home reveal">
        <div class="slides">
            <section data-markdown data-background-color="aquamarine">
                <textarea data-template>
                    ## Slide 1
                    A paragraph with some text and a [link](http://hakim.se).
                    # asdaswd
                    > asdasdad
                    ```
                    asdasda
                    ```
                    ---
                    ## Slide 2
                    ---
                    ## Slide 3asdasdaasdasdasdasdas
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
Reveal.on( 'make-it-pop', () => {
    console.log('✨')
} )
onMounted(() => {
    const deck = new Reveal(container.value, {
        plugins: [ Markdown ],
    })
    deck.initialize()
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
