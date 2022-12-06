import {Ref, isRef} from 'vue'
export type TargetType<T> = T | Ref<T | undefined> | Ref<T[] | undefined> | undefined
export type Results = {
    xs:Ref<any>
    ys:Ref<any>
    x:Ref<any>
    y:Ref<any>
    isMousedown:Ref<boolean>
}
export type UseMouseDownToMove = (target:TargetType<HTMLElement>, options?:Partial<{
    onMousedown(result:Results, ev:MouseEvent, key:number):void
    onMousemove(result:Results, ev:MouseEvent, key:number):void
    onMouseup(result:Results, ev:MouseEvent, key:number):void
    isMousedown(result:Results, ev:MouseEvent, key:number):boolean
    key:number
}>, isInit?:boolean)=> Results;

const useMouseDownToMove:UseMouseDownToMove = (target:any, options = {}, isInit?:boolean) => {
    if (!isRef(target)) {
        target = ref(target)
    }
    const xs = ref<any>(0)
    const ys = ref<any>(0)
    const x = ref<any>(0)
    const y = ref<any>(0)
    const isMousedown = ref<any>(false)
    const result:Results = {
        xs,
        ys,
        x,
        y,
        isMousedown
    }
    const mousedown = (ev:any) => {
        const bool = options.isMousedown?.(result, ev, options.key as number)
        isMousedown.value = typeof bool === 'boolean' ? bool : true
        if (isMousedown.value) {
            xs.value = ev.layerX
            ys.value = ev.layerY
            options.onMousedown?.(result, ev, options.key as number)
        }
    }
    const mousemove = (ev:any) => {
        if (isMousedown.value) {
            x.value = ev.layerX - xs.value
            y.value = ev.layerY - ys.value
            options.onMousemove?.(result, ev, options.key as number)
        }
    }
    const mouseup = (ev:any) => {
        isMousedown.value = false
        options.onMouseup?.(result, ev, options.key as number)
        nextTick(() => {
            x.value = 0
            y.value = 0
            xs.value = 0
            ys.value = 0
        })
    }
    const init = () => {
        if (Object.prototype.toString.call(target.value) === '[object Array]') {
            (target.value as HTMLElement[]).map((t, key) => {
                const res = useMouseDownToMove(t, {...options, key}, true)
                xs.value[key] = res.xs.value
                ys.value[key] = res.ys.value
                x.value[key] = res.x.value
                y.value[key] = res.y.value
                isMousedown.value[key] = res.isMousedown.value
            })
            return
        } else {
            (target.value as HTMLElement).addEventListener('mousedown', mousedown);
            (target.value as HTMLElement).addEventListener('mousemove', mousemove);
            (target.value as HTMLElement).addEventListener('mouseup', mouseup)
        }
    }
    if (isInit) {
        init()
    } else {
        onMounted(init)
    }
    return result
}
export default useMouseDownToMove
