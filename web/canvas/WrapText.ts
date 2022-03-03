export default ({texts, ctx, maxWidth, contentStartX, contentStartY, fontSize, lineHeight, spacing}:any)=>{
    // 间距
    spacing = spacing || 60;
    lineHeight = lineHeight || 60;
    fontSize = fontSize || 18;
    const fontSizeSpacing = fontSize + spacing;
    const lineMaxTextIndex = Number((maxWidth/fontSizeSpacing).toFixed(0));
    let line = 0;
    let prevIndex = 0;
    [...texts].forEach((text,k)=>{
        const t_x = (k+1)*fontSizeSpacing;
        if((k % lineMaxTextIndex) === 0){
            line += 1;
            prevIndex = t_x;
        }
        const x = (t_x - prevIndex) % maxWidth;
        ctx.fillText(text,x+contentStartX,line*(fontSizeSpacing+lineHeight)+contentStartY);
    })
}
