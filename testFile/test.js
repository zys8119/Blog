(function() {
    deck.value.on('slidechanged', function() {
        document.querySelectorAll('nav>*').forEach(function(el) {
            el.removeAttribute('class')
            if (Number(el.getAttribute('index')) === deck.value.getState().indexh) {
                el.setAttribute('class', 'active')
            }
        })
    })
    document.querySelectorAll('nav>*').forEach(function(el) {
        el.onclick = function() {
            deck.value.slide(Number(el.getAttribute('index')))
        }
    })
    return {
        center:false
    }
})()
