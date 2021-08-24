import {DirectiveOptions} from "vue"
import Odometer from "./Odometer"
export default <DirectiveOptions>{
    bind:(el:any,binding)=>{
        el.Odometer = new Odometer(el,{
            len : null, //设置默认位数
            num : binding.value, //初始化值
            speed : 1000, //动画速度
            symbol : '', //分割符
            dot : 0 //保留几位小数点
        });
    },
    update:(el:any,binding)=>{
        el.Odometer.update(binding.value)
    },
    unbind:(el:any)=>{
        el.Odometer = null;
    }
}