# 使用指南

## 页面query参数说明

| 参数        | 类型        | 数名                 |
|-----------|-----------|--------------------|
| fileUrl   | `string`  | Markdown远程文件地址     |
| title     | `string`  | 当前页面标题             |
| githubCss | `Boolean` | 是否开启github样式, 默认开启 |
| configApiUrl | `string`  | 远程配置参数             |
| 其他未知参数    | `any`     | 作为v-bind注入幻灯片了属性   |

## 微服务架构配置注入

可以扩展 window.revealJsConfig 配置

类型注入如下

```typescript
declare global {
    interface Window {
        revealJsConfig:Options
    }
}
```


<a href="https://revealjs.com/markup/" target="_blank">查看演示文档</a>

