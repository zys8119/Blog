<template>
    <div class="LayoutSplit h-full of-hidden" :class="{
        'select-none': pressed,
    }">
        <div class="abs top-0 left-0 LayoutSplitLeft of-auto" :class="{
            'h-full w-$leftHeight': props.horizontally,
            'w-full h-$leftHeight': !props.horizontally,
        }" ref="left">
            <slot name="left"></slot>
        </div>
        <div v-if="isDrag" class="z-1 LayoutSplitLine group flex-center bg-#eee" ref="line" :class="{
            'abs h-100% w-$lienSize top-0 left-50% transform-translate-x-$offset cursor-col-resize':
                props.horizontally,
            'abs-center w-100% h-$lienSize transform-translate-y-$offset cursor-row-resize':
                !props.horizontally,
            'bg-#999!': pressed,
        }">
            <div class="bg-#666 b-rd-[calc(var(--lienSize)/2)] op-0 group-hover:op-100! transition-all" :class="{
                'h-20px w-[calc(var(--lienSize)/2)]': props.horizontally,
                'w-10px h-[calc(var(--lienSize)/2)]': !props.horizontally,
                'bg-#fff!': pressed,
            }"></div>
        </div>
        <div class="abs LayoutSplitRight of-auto" :class="{
            'h-full w-$rightHeight top-0 right-0': props.horizontally,
            'w-full h-$rightHeight  left-0 bottom-0': !props.horizontally,
        }">
            <slot name="right"></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        // 拖拽线的大小
        lienSize?: number | string;
        // 是否水平布局
        horizontally?: boolean;
        // 分割比例
        // 0-1 表示左右比例
        // 0.5 表示中间分割
        // 1 表示右边
        // 1px、1% 表示左边
        span?: any;
        // 拖拽边界阀值, 同span一样类型
        boundary?: any;
        // 是否可以拖拽
        isDrag?: boolean;
        // 是否支持触摸事件
        touch?: boolean;
    }>(),
    {
        lienSize: 5,
        isDrag: true,
        boundary: 0.1,
        touch: false,
    }
);
const el = useCurrentElement() as Ref<HTMLElement>;
const line = ref<HTMLElement>();
const left = ref<HTMLElement>();
const leftRect = useElementBounding(left);
const leftSize = computed(() =>
    props.horizontally ? leftRect.width.value : leftRect.height.value
);
const elRect = useElementBounding(el);
const height = computed(() =>
    props.horizontally ? elRect.width.value : elRect.height.value
);
const lineRect = useElementBounding(line);
const lienHeight = computed(() =>
    props.horizontally ? lineRect.width.value : lineRect.height.value
);
const { pressed } = useMousePressed({ touch: props.touch, target: line });
const mouse = useMouseInElement();
const y = computed(() => (props.horizontally ? mouse.x.value : mouse.y.value));
const movePost = ref(0);
const startPos = ref(0);
const offset = ref(0);
const lienSize = computed(() => {
    return props.isDrag
        ? typeof props.lienSize === 'number'
            ? `${props.lienSize}px`
            : props.lienSize
        : '0px';
});
watch([pressed], () => {
    if (!props.isDrag) {
        return;
    }
    if (pressed.value) {
        startPos.value = y.value;
    } else {
        offset.value += movePost.value;
        movePost.value = 0;
    }
});
const boundary = computed(() => calcValueHelper(props.boundary, true));
watch([y], () => {
    if (!props.isDrag) {
        return;
    }
    // 判断边界，如果超出边界，不允许拖拽，offset 的正负值表示左右方向
    const offset = y.value - startPos.value;
    if (
        (offset < 0 && leftSize.value < boundary.value) ||
        (offset > 0 && height.value - leftSize.value < boundary.value)
    ) {
        return;
    }
    if (pressed.value) {
        movePost.value = offset;
    }
});
// 计算span或boundary的真实值
const calcValueHelper = (value: any, isSource?: boolean) => {
    if (value === undefined) {
        return 0;
    }
    let v = 0;
    if (/px$/.test(value)) {
        v = Number(value.replace('px', '')) / height.value;
    } else if (/%$/.test(value)) {
        v = Number(value.replace('%', '')) / 100;
    } else if (typeof value === 'number') {
        if (value >= 0 && value <= 1) {
            v = value;
        } else {
            v = value / height.value;
        }
    }
    if (v === Infinity || v === -Infinity || isNaN(v)) {
        v = 0;
    }
    if (isSource) {
        // 仅计算相对height的真实值
        return height.value * v;
    }
    // 计算相对height的一半的滑块的真实值
    if (v >= 0 && v <= 0.5) {
        return -height.value * (0.5 - v);
    } else {
        return height.value * (v - 0.5);
    }
};
watch(
    [computed(() => props.span), height],
    () => {
        offset.value = calcValueHelper(props.span) || 0;
    },
    { immediate: true }
);
useCssVars(() => {
    const h = (height.value - lienHeight.value) / 2;
    return {
        leftHeight: `${h + offset.value + movePost.value}px`,
        rightHeight: `${h - (offset.value + movePost.value)}px`,
        offset: `${offset.value + movePost.value}px`,
        lienSize: String(lienSize.value),
    };
});
</script>
<style scoped lang="less">
.LayoutSplit {}
</style>
