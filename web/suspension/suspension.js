export class suspensionInit{
    el = document.createElement("div");
    binding = null;
    vnode = null;
    oldVnode = null;
    touchesTap = {};
    // matrix( scaleX(), skewY(), skewX(), scaleY(), translateX(), translateY() )
    matrix = [1,0,0,1,0,0];
    matrixOld = [1,0,0,1,0,0];
    matrixStyle = [];
    constructor(el,binding,vnode, oldVnode) {
        this.el = el;
        this.binding = binding;
        this.vnode = vnode;
        this.oldVnode = oldVnode;
        try {
            this.init();
        }catch (e){
            console.error(e.message)
        }
    }

    init(){
        this.el.addEventListener("touchstart",ev=>{
            ev.stopPropagation()
            const touche0 = ev.touches[0];
            this.touchesTap.clientX = touche0.clientX;
            this.touchesTap.x = 0;
            this.touchesTap.clientY = touche0.clientY;
            this.touchesTap.y = 0;
            this.matrixStyle = (getComputedStyle(this.el).transform || "").split(",").map(e=>parseFloat(e.replace(/([^\d-.])/img,""))).filter(e=>!isNaN(e));
            this.matrixStyle.forEach((e,k)=>{
                this.matrix[k] = e;
            });
            this.matrixOld = JSON.parse(JSON.stringify(this.matrix));
        })
        this.el.addEventListener("touchmove",ev=>{
            ev.stopPropagation()
            const touche0 = ev.touches[0];
            this.touchesTap.x = touche0.clientX - this.touchesTap.clientX;
            this.touchesTap.y = touche0.clientY - this.touchesTap.clientY;
            this.matrix[4] = this.matrixOld[4] + this.touchesTap.x;
            this.matrix[5] = this.matrixOld[5] + this.touchesTap.y;
            this.el.style.transform = `matrix(${this.matrix.join(",")})`;
        })
    }
}
export default {
    bind(el,binding,vnode, oldVnode){new suspensionInit(el,binding,vnode, oldVnode);}
}