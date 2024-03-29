import {Ref, isRef} from 'vue'
export type TargetType<T> = T | Ref<T | undefined> | Ref<T[] | undefined> | undefined
export type Results = {
    xs:Ref<any>
    ys:Ref<any>
    x:Ref<any>
    y:Ref<any>
    mx:Ref<any>
    my:Ref<any>
    mxs:Ref<any>
    mys:Ref<any>
    ox:Ref<any>
    oy:Ref<any>
    oxs:Ref<any>
    oys:Ref<any>
    isMousedown:Ref<boolean>
    isMousemove:Ref<boolean>
    isMMousedown:Ref<boolean>
    buttonType:Ref<any>
}
export type MouseEventType = MouseEvent & {
    path:HTMLElement[]
}
export type UseMouseDownToMove = (target?:TargetType<HTMLElement | Window>, options?:Partial<{
    onMousedown(result:Results, ev:MouseEventType, key:number):void
    onMousemove(result:Results, ev:MouseEventType, key:number):void
    onMouseup(result:Results, ev:MouseEventType, key:number):void
    onContextmenu(result:Results, ev:MouseEventType, key:number):void
    isMousedown(result:Results, ev:MouseEventType, key:number):boolean | void | undefined
    key:number
}>, isInit?:boolean)=> Results;

const useMouseDownToMove:UseMouseDownToMove = (target:any = window, options = {}, isInit?:boolean) => {
    if (!isRef(target)) {
        target = ref(target)
    }
    const xs = ref<any>(0)
    const ys = ref<any>(0)
    const x = ref<any>(0)
    const y = ref<any>(0)
    const mx = ref<any>(0)
    const my = ref<any>(0)
    const mxs = ref<any>(0)
    const mys = ref<any>(0)
    const ox = ref<any>(0)
    const oy = ref<any>(0)
    const oxs = ref<any>(0)
    const oys = ref<any>(0)
    const buttonType = ref<any>(0)
    const isMousedown = ref<any>(false)
    const isMMousedown = ref<any>(false)
    const isMousemove = ref<any>(false)
    const result:Results = {
        xs,
        ys,
        x,
        y,
        isMousedown,
        mx,
        my,
        mxs,
        mys,
        isMMousedown,
        isMousemove,
        ox,
        oy,
        oxs,
        oys,
        buttonType
    }
    const mousedown = (ev:any) => {
        buttonType.value = ev.button
        isMousemove.value = false
        isMMousedown.value = true
        const bool = options.isMousedown?.(result, ev, options.key as number)
        isMousedown.value = typeof bool === 'boolean' ? bool : true
        if (isMousedown.value) {
            xs.value = ev.layerX
            ys.value = ev.layerY
        }
        if (isMMousedown.value) {
            mxs.value = ev.layerX
            mys.value = ev.layerY
        }
        if (isMousedown.value || isMMousedown.value) {
            oxs.value = ev.pageX
            oys.value = ev.pageY
        }
        options.onMousedown?.(result, ev, options.key as number)
    }
    const mousemove = (ev:any) => {
        isMousemove.value = true
        if (isMMousedown.value) {
            mx.value = ev.layerX - mxs.value
            my.value = ev.layerY - mys.value
        }
        if (isMousedown.value) {
            x.value = ev.layerX - xs.value
            y.value = ev.layerY - ys.value
        }
        if (isMousedown.value || isMMousedown.value) {
            ox.value = ev.pageX - oxs.value
            oy.value = ev.pageY - oys.value
        }
        options.onMousemove?.(result, ev, options.key as number)
    }
    const mouseup = (ev:any) => {
        isMMousedown.value = false
        isMousedown.value = false
        isMousemove.value = false
        options.onMouseup?.(result, ev, options.key as number)
        nextTick(() => {
            xs.value = 0
            ys.value = 0
            x.value = 0
            y.value = 0
            mx.value = 0
            my.value = 0
            mxs.value = 0
            mys.value = 0
            ox.value = 0
            oy.value = 0
            oxs.value = 0
            oys.value = 0
        })
    }
    const init = () => {
        (target.value as HTMLElement).addEventListener('mousedown', mousedown);
        (target.value as HTMLElement).addEventListener('mousemove', mousemove);
        (target.value as HTMLElement).addEventListener('mouseup', mouseup);
        (target.value as HTMLElement).oncontextmenu = (evt:any) => {
            return options.onContextmenu?.(result, evt, options.key as number)
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
