# 获取事件冒泡路径，兼容ie11,edge,chrome,firefox,safari

```typescript
/*
 * 获取事件冒泡路径，兼容ie11,edge,chrome,firefox,safari
 * @param evt
 * @returns {*}
 */
function eventPath(evt) {
    const  path = (evt.composedPath && evt.composedPath()) || evt.path,
        target = evt.target;

    if (path != null) {
        return (path.indexOf(window) < 0) ? path.concat(window) : path;
    }

    if (target === window) {
        return [window];
    }

    function getParents(node, memo) {
        memo = memo || [];
        const parentNode = node.parentNode;

        if (!parentNode) {
            return memo;
        } else {
            return getParents(parentNode, memo.concat(parentNode));
        }
    }

    return [target].concat(getParents(target), window);
}
```
