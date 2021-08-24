# vue 数字滚动指令

## 使用

1、

```js
import number from "./directive/number"
vue.directive("number", number)
```

2、

```css
.number-animate{line-height:45px; height: 45px;font-size: 40px;overflow: hidden; display: inline-block; position: relative; }
.number-animate .number-animate-dot{ width: 21px; float: left; text-align: center;}
.number-animate .number-animate-dom{ width: 27px;  text-align: center; float: left; position: relative; top: 0;}
.number-animate .number-animate-dom span,.number-animate .number-animate-dot span{float: left;width: 100%;height: 45px;line-height: 1;}
```

3、

```vue
<template>
    <div v-number="num"></div>
</template>

<script>
export default {
    name: "RendaLegislativeWork",
    data() {
        return {
            num:0,
        }
    },
    mounted() {
    }
}
</script>
```