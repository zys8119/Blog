const drawFonts = ({
    texts,
    ctx,
    maxWidth,
    contentStartX,
    contentStartY,
    fontSize,
    lineHeight,
    spacing,
    halfAngleCharacter,
}: {
    // 绘制的文字
    texts:string
    // canvas 上下文
    ctx:CanvasRenderingContext2D
    // 绘制文字换行的最大宽度
    maxWidth:number
    // 绘制起始位置
    contentStartX:number
    // 绘制起始位置
    contentStartY:number
    // 字体大小
    fontSize:number
    // 行高
    lineHeight:number
    // 间距
    spacing:number
    // 半角字符过滤，默认过滤半角字符
    halfAngleCharacter(text:string):boolean
}) => {
    // 间距
    spacing = spacing || 60;
    lineHeight = lineHeight || 60;
    fontSize = fontSize || 18;
    let fontSizeSpacing = fontSize + spacing;
    const textArr = [...texts]
    const halfAngleCharacterFilter = typeof halfAngleCharacter === 'function' ? halfAngleCharacter : (text:any) => /\w/.test(text)
    let lineMaxTextIndex = 0
    let currMaxWidth = 0
    let halfAngleCharacterArr:any[] = []
    let halfAngleCharacterOffset = 0
    let isOffset = false
    let bool = true
    for(let i = 0 ; i < textArr.length; i++) {
        if (halfAngleCharacterFilter(textArr[i])) {
            currMaxWidth += fontSizeSpacing - fontSize*2/3
            if(isOffset){
                halfAngleCharacterOffset += fontSize/3
                halfAngleCharacterArr.push(textArr[i])
            }
            isOffset = true
        }else {
            currMaxWidth += fontSizeSpacing
            isOffset = false
        }
        if(bool){
            if(currMaxWidth > maxWidth){
                bool = false
                break
            }else {
                lineMaxTextIndex += 1
            }
        }

    }
    let line = 0;
    let prevIndex = 0;
    ctx.font = `${fontSize}px 黑体`;
    textArr.forEach((text, k) => {
        const offsetIndex = halfAngleCharacterArr.findIndex(e=>e === text)
        if(offsetIndex > -1){
            halfAngleCharacterArr[offsetIndex] = null
        }
        const offsetX = (offsetIndex+1)*halfAngleCharacterOffset/halfAngleCharacterArr.length || 0
        const t_x = (k + 1) * fontSizeSpacing  - offsetX;
        if (k % lineMaxTextIndex === 0) {
            line += 1;
            prevIndex = t_x;
        }
        const x = (t_x - prevIndex) % maxWidth;
        ctx.fillText(
            text,
            x + contentStartX,
            line * (fontSizeSpacing + lineHeight) + contentStartY
        );
    });
};
