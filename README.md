# Bolg

个人爱好，知识积累，点滴成石

## Web

web端

[简单的Ajax封装](./web/Ajax/index.md)

[简单的Promise封装](web/Promise/PromiseClass.ts)

[简单的大文件切片上传封装](web/Upload/Upload.vue)

[vue3.0模板初探](https://github.com/zys8119/vuit/tree/master/v3Template)

[前端屏幕共享](web/screenSharing/index.vue)

[window视窗](web/window/index.vue)

[web打印代码](web/print/index.md)

[vue3 动效](web/3D/index.md)

[React Native相关问题](web/ReactNative/index.md)

[Vue WebSocket 简单封装](web/WebSocket/index.md)

[Vue 前端日志监控插件简单封装](web/Console/index.md)

[content-type整理](web/ContentType.md)

[vue 可视化表单配置](web/OneThingJointOffice/index.md)

[vue 悬浮拖拽](web/suspension/suspension.js)

[vue van 列表上拉刷新](web/ListPage.vue)

[vue 数字滚动指令](web/VueNumber/README.md)

[vue 高德地图线路规划](web/amap/README.md)

[vue TbaleH5 表格封装](web/TbaleH5.md)

[vue Loading](web/Loading.md)

[vue 分栏布局](web/LayoutSplit.vue)

[vue3.0 字体响应式](web/FontResponse/index.md)

[svg paths 转 canvas 贝塞曲线](web/svgToBezierCurve/index.md)

[canvas 动画函数](web/canvas/animation.ts)

[canvas 文字自动换行](web/canvas/WrapText.ts)

[获取日历数据](web/CalendarDataJs.ts)

[javascript 算法题及题解](web/JavascriptAlgorithm.md)

[vue3.0 基础表格算法](web/vue3table.md)

[大数据场景背景图布局快速占位](web/BigDataRapidPlaceholder.vue)

[Vite + Vue + monaco-editor](web/MonacoEnvironment.md)

[wisdom-plus + 高德自定义地图 DemoMap.vue](web/DemoMap.vue)

[wisdom-plus + alert.tsx](web/alert.tsx)

[进度图表 CommonProgressChart.vue](web/CommonProgressChart.vue)

[占位图代理](web/PlaceholderImage.md)

[vue3 表单提交通用逻辑](web/vue3-form-submit.md)

[鼠标拖拽坐标捕获 useMouseDownToMove.ts](web/useMouseDownToMove.ts)

[wp-alert 动态表单实现](web/DynamicFormImplementation.md)

[基于wujie的vue3微前端组件封装](web/WujieVueRouterView.vue)

[表情获取](web/Emoji/index.md)

[vue3+vite 动态路由](web/vue/route.md)

[判断鼠标进入方向](web/vue/determineDirectionMouseEntry.md)

[获取事件冒泡路径，兼容ie11,edge,chrome,firefox,safari](web/eventPath.md)





## Serve

服务端

[node控制台输入交互](serve/node/input.md)

[前端资源自动化部署](serve/node/buildServe.js)

[前端资源javascript-obfuscator代码混淆加密](serve/node/javascript-obfuscator-serve.ts)

[创建FormData数据格式](serve/node/FormData.md)

[uf-node + vpn + giaoyun 订阅获取](serve/node/IndexController.ts)

[node-serve 订阅获取](serve/node/SubscriptionQcquisition.md)

[依赖包查找](serve/DependentPackageLookup.ts)

[Chat Gpt AI](serve/ChatGpt.md)

[获取git指定Head节点文件详情](serve/getHeadFileInfoList.md)

[nodejs 17 以下fetch兼容，以axios方式-可解决llama-js 在低版本的nodejs中的正常运行](serve/fetch.ts)

[wisdom-node formData 解析](serve/formData.ts)

## 其他

other

[发布release.cmd](./other/发布release.cmd)

[gitLab Release 自动化推送](./serve/push-release/README.md)

[git 提交规范校验](./other/HooksCommitMsg.js)

## 备忘

[北外测试题](./other/beiwaitest.md)


## UnoCsss 自定义规则

```typescript
import { defineConfig } from 'unocss';

export default defineConfig({
    // ...UnoCSS options
    shortcuts: {
        'flex-center': 'flex justify-center items-center',
        'flex-center-start': 'flex justify-start items-center',
        'flex-center-end': 'flex justify-end items-center',
        'flex-center-between': 'flex justify-between items-center',
        'flex-center-around': 'flex justify-around items-center',
        'flex-v': 'flex flex-col',
        'abs-f': 'fixed',
        'abs-r': 'relative',
        abs: 'absolute',
        'size-content': 'left-0 top-0 w-100% h-100%',
        'abs-content': 'absolute left-0 top-0 w-100% h-100%',
        'abs-start': 'absolute left-0 top-0',
        'abs-end': 'absolute right-0 top-0',
        'abs-end-bottom': 'absolute right-0 bottom-0',
        'abs-start-bottom': 'absolute left-0 bottom-0',
        'abs-center': 'absolute left-50% top-50% translate--50%',
        'abs-x': 'absolute left-50% translate-x--50%',
        'abs-y': 'absolute top-50% translate-y--50%',
        bold: 'font-bold',
        'cur-p': 'cursor-pointer',
        'p-e-n': 'pointer-events-none',
    },
    rules: [
        [
            // 包含小数点的 flex
            /^flex-?([0-9]+(?:\.[0-9]+)?)$/,
            (match) => {
                return {
                    flex: match[1],
                };
            },
        ],
        [
            /^tr-?([xy])(?:-?(-?.+))?$/,
            (match) => {
                return {
                    transform: `translate${match[1].toUpperCase() || 'Y'}(${match[2] || 0})`,
                };
            },
        ],
        [
            /^frame(?:-?(-?.+))?$/,
            (match) => {
                const [name, start, time, ...timing] = match[1].split('-');
                let timingFn = timing;
                let timeStr = time;
                if (time === 'cubic') {
                    timingFn = [time].concat(timing);
                    timeStr = '';
                }
                return {
                    animation: `${name} calc(1 - var(--sy) / ${start}) ${timeStr || ''} ${timingFn.join('-') || 'linear'} forwards reverse`,
                };
            },
        ],
        [
            // c-var--primary-color => color: var(--primary-color)
            /^c-var-([a-zA-Z0-9-]+)$/,
            (match) => {
                return {
                    color: `var(--${match[1]})`,
                };
            },
        ],
        [
            /^(s|size)-([a-zA-Z0-9-]+)$/,
            (match) => {
                return {
                    width: match[2],
                    height: match[2],
                };
            },
        ],
        [
            /^bg-(lg|rlg|rg|rrg|url)-(.{1,})$/,
            (match) => {
                return {
                    'background-image': `${
                        {
                            lg: 'linear-gradient',
                            rlg: 'radial-gradient',
                            rg: 'repeating-linear-gradient',
                            rrg: 'repeating-radial-gradient',
                            url: 'url',
                        }[match[1]]
                    }(${match[2].replace(/--/g, ' , ').replace(/-/g, ' ').replace(/\$([^\s]+)/g, 'var(--$1)')})`,
                };
            },
        ],
    ],
});


```
## uni-app 微信小程序之unocss规则
```typescript
import { defineConfig } from "unocss";
export default defineConfig({
  // ...UnoCSS optionstr
  configResolved(config) {
    config.preflights = [];
  },
  rules: [
    [
      /^u-?(text|bg|color|w)-?(.*)/,
      (m) => {
        return {
          text: `.${m[0]}{color:${m[2].replace("0x", "#")};}`,
          color: `.${m[0]}{color:${m[2].replace("0x", "#")};}`,
          bg: `.${m[0]}{background-color:${m[2].replace("0x", "#")};}`,
          w: `.${m[0]}{width:${m[2]}%;}`,
          h: `.${m[0]}{height:${m[2]}%;}`,
        }[m[1]];
      },
    ],
  ],
});

```
## js 16进制"fe7ae63d" 如何快速转成有符号的10进制

```js
//10进制转成有符号的10进制
function hexToSignedDecimal(hexStr) {
    // 将 16 进制字符串转换为无符号的整数
    const unsignedInt = parseInt(hexStr, 16);

    // 32 位有符号整数的范围
    const INT32_MAX = 0x7FFFFFFF;
    const INT32_MIN = -0x80000000;

    // 判断是否为负数
    if (unsignedInt > INT32_MAX) {
        // 如果无符号整数大于 0x7FFFFFFF，则它在有符号整数的负数范围内
        return unsignedInt - 0x100000000; // 0x100000000 是 2^32，用于从无符号转换为有符号
    } else {
        // 如果不在负数范围内，直接返回值
        return unsignedInt;
    }
}

const hexStr = "fe7ae63d";
const signedDecimal = hexToSignedDecimal(hexStr);

console.log(signedDecimal); // 输出 -126813651


// 转符号10进制示例

function signedDecimalToHex(unsignedInt) {
    // 判断是否为负数
    if (unsignedInt < 0) {
        // 如果无符号整数大于 0x7FFFFFFF，则它在有符号整数的负数范围内
        return (unsignedInt + 0x100000000).toString(16); // 0x100000000 是 2^32，用于从无符号转换为有符号
    } else {
        // 如果不在负数范围内，直接返回值
        return unsignedInt.toString(16);
    }
}
```

## sql文件注释解析

```typescript
import { readFileSync } from "fs"
/**
 * @name sqlCommitFunction sql文件注释解析
 * @param sqlFilePath sql文件路径
 * @returns 
 */
export default function <T = Record<string, any>>(sqlFilePath: string): T{
    const sql = readFileSync(sqlFilePath, 'utf8')
    const sqlNames = []
    sql.replace(/\/\*(.|\n)*?\*\//g, function(m){
        const name = m.match(/@[^*\/]*/)?.[0].replace(/@|\n|\s/g,'') || ''
        sqlNames.push([name, m])
        return ``
    })
    let sqlCopy = sql
    return sqlNames.reverse().reduce((a,b)=>{
        const value = sqlCopy.slice(sql.lastIndexOf(b[1]))
        a[b[0]] = value.replace(b[1],'')
        sqlCopy = sqlCopy.replace(value, '')
        return a
    },{})
}
```

## puppeteer 等待选择器
```typescript
const waitForSelector = async (selector: string) => {
    return await page.evaluate(async function name(selector) {
        if (!document.querySelector(selector)) {
            return await new Promise(r => {
                requestAnimationFrame(async () => {
                    await name(selector)
                    r(true)
                })
            })
        }
    },selector)
}
```

## adb保持手机屏幕不关闭，请使用tsnd 运行
```typescript
import { CronJob  } from 'cron';
import { execSync, execFileSync  } from 'child_process';
new CronJob('* * * * * *',()=>{
    try {
    execSync(`
screen_status=$(adb shell dumpsys power | grep "Display Power" | grep -o 'OFF')
if [ "$screen_status" = "OFF" ]; then
    echo "Screen is off";
    adb shell input keyevent 26;
fi;
adb shell dumpsys window | grep -i "current=[immersive]"
adb devices
        `,{
            stdio:'inherit',
        });
    }catch (error) {
        console.log(error)
    }
}).start();
```

## zsh 常用插件
```
aliases            command-not-found  dirhistory         extract            git-prompt         macos              vscode             z                                                    
colored-man-pages  copyfile           docker             git                history            nmap               wd                                                                    
colorize           copypath           dotenv             git-commit         jsontools          sudo               web-search  
```

## rollup manualChunks for pnpm
```javascript
{
  manualChunks(id) {
      const deps = ['wp-request', 'lodash', 'vueuse/', 'vue/', 'lodash-es', 'vconsole-hide', 'gsap', 'qrcode', 'vant'];
      const dep = deps.find((dep) => new RegExp(`${__dirname}/node_modules.*${dep}`).test(id));
      if (dep) {
          return dep.replace(/\//g, '');
      }
      const depslocl = ['api', 'alert', 'datas', 'utils'];
      const dep2 = depslocl.find((dep) => id.includes(path.resolve(__dirname, 'src', dep)));
      if (dep2) {
          return dep2;
      }
  },
}
```

## CSS 重置

```css
/* 1. Use a more-intuitive box-sizing model */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 2. Remove default margin */
* {
  margin: 0;
}

body {
  /* 3. Add accessible line-height */
  line-height: 1.5;
  /* 4. Improve text rendering */
  -webkit-font-smoothing: antialiased;
}

/* 5. Improve media defaults */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

/* 6. Inherit fonts for form controls */
input, button, textarea, select {
  font: inherit;
}

/* 7. Avoid text overflows */
p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

/* 8. Improve line wrapping */
p {
  text-wrap: pretty;
}
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}

/*
  9. Create a root stacking context
*/
#root, #__next {
  isolation: isolate;
}
```
##  flutter sm4 加解密
```dart
import 'package:flutter/foundation.dart';
import 'package:dart_sm/dart_sm.dart';

class CryptoUtil {
  static String convertToHex(String input) {
    return input.runes.map((rune) {
      return rune.toRadixString(16);
    }).join();
  }

  static final String _SM4KEY = "";
  static final String iv = convertToHex(_SM4KEY);

  //SM4加密
  static String encryptedSM4(String content) {
    SM4.setKey(iv);
    String cipherText = SM4.encrypt(content, mode: SM4CryptoMode.CBC, iv: iv);
    return cipherText.toLowerCase();
  }

  //SM4解密
  static String decryptSM4(String content) {
    SM4.setKey(iv);
    //Stopwatch stopwatch = Stopwatch()..start();
    String cbcDecryptData =
        SM4.decrypt(content, mode: SM4CryptoMode.CBC, iv: iv);
    //stopwatch.stop();
    // print('执行时间：${stopwatch.elapsedMilliseconds} 毫秒');
    return cbcDecryptData;
  }

  static Future<String> encryptedSM4ByAsync(String data) async {
    return await compute(encryptedSM4, data);
  }

  static Future<String> decryptSM4ByAsync(String data) async {
    return await compute(decryptSM4, data);
  }
}

```

## shell 脚本提取私包

```shell
dir='packages'
node_modules_dir='node_modules'
package_json_dir='package.json'
packages=($(echo $(cat $package_json_dir | grep -e 'http' | awk '{print $1}' | sed 's/^"//g' | sed 's/":$//g')))
rm -rf $dir
for i in ${packages[@]};
do
    target=$dir/$i
    mkdir -p $target
    ls $node_modules_dir/$i | grep -E -v "node_modules" | xargs -I {} cp -r $node_modules_dir/$i/{} $target
done
```

## 242 服务vite代理配置

```
{
    '/242': {
        target: 'http://192.168.110.242/',
        rewrite: (path) => {
            console.log(path);
            return path.replace(/^\/242/, '');
        },
        headers: {
            Referrer: 'http://192.168.110.242'
        },
        autoRewrite: true,
        selfHandleResponse: true,
        // changeOrigin: true,
        ws: true,
        configure(proxy: HttpProxy.Server) {
            proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
                const chunks: any = [];
                proxyRes.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                proxyRes.on('end', () => {
                    res.setHeader('access-control-allow-origin', '*');
                    res.end(Buffer.concat(chunks));
                });
            });
        }
    }
}
```

## flutter 依赖重启
```typescript
import { spawn } from "child_process";
import { watch } from "chokidar";
const run = () => {
  const child = spawn("flutter", ["run"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  return child;
};
let child = run();
watch("./pdf_explorer", {
  cwd: process.cwd(),
  awaitWriteFinish: true,
}).on("change", (event, path) => {
  child.kill();
  child = run();
});


```
launch.json
```json
{
  // 使用 IntelliSense 了解相关属性。
  // 悬停以查看现有属性的描述。
  // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "command": "tsnd  --respawn serve.ts  ",
      "name": "Run serve",
      "request": "launch",
      "type": "node-terminal"
    },
    {
      "name": "Flutter Attach",
      "request": "attach",
      "type": "dart",
      "flutterMode": "debug",
      "deviceId": "all"
    }
  ]
}

```

## 获取pdf文件字体

配合浏览器字体api完成,如 `document.fonts` `document.fonts.values()`

```
// 检查特定字体是否已加载
function isFontAvailable(fontName) {
    return document.fonts.check(`16px "${fontName}"`);
}

// 使用示例
if (isFontAvailable('MySpecialFont')) {
    console.log('Font is available!');
} else {
    console.log('Font is not available.');
}

```

```
const pdfjsLib = require('pdfjs-dist/build/pdf');

async function checkMissingFonts(pdfUrl) {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const missingFonts = new Set();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();

        operatorList.argsArray.forEach((args, index) => {
            // 检查操作符是否为使用字体的操作
            if (operatorList.fnArray[index] === pdfjsLib.OPS.setFont) {
                const fontName = args[0];
                // 记录字体名称
                missingFonts.add(fontName);
            }
        });
    }

    console.log('Missing Fonts:', Array.from(missingFonts));
}

// 使用示例
checkMissingFonts('path/to/your.pdf');

```
更改字体,需要启用pdfBug模式
```
window.FontInspector = {
  enabled: true,
  fontAdded(font) {
    if (["g_d0_f1", "g_d0_f20", "g_d0_f3"].includes(font.loadedName)) {
      return;
    }
    font.loadedName = "Nabla";
  },
}
```

## javascript-obfuscator 配置

```typescript
{
    controlFlowFlattening: true,
    stringArrayThreshold: 1,
    unicodeEscapeSequence: true,
    stringArrayEncoding: ['none', 'base64', 'rc4'],
    forceTransformStrings: ['.'],
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    numbersToExpressions: true,
    renameGlobals: true,
    splitStrings: true,
    stringArray: true,
    disableConsoleOutput: true,
}
```
# 防止 debugger 调试
```typescript
(function _debuggerInit(){
  // Check if the DevTools are open by measuring the time taken to execute a function
  const start = Date.now();
  new Function(`debugger;`)()
  const end = Date.now()
  if(Date.now() - start > 100){
    location.replace('about:blank')
  }
  setTimeout(()=>{
    _debuggerInit()
  })
})()
```

# 拖拽悬浮球
```vue
<template>
    <div class="abs-f z-100000 right-0 bottom-$h5-bottom-nav-height tr-y--150px levitated-sphere" :style="style"
        ref="el">
        <Drager ref="drager" @drag-end="handleDragEnd" @drag-start="handleDragStart" v-bind="info2" v-if="show">
            <div class="op-$op levitated-sphere-content">
                <slot>
                    悬浮内容
                </slot>
            </div>
        </Drager>
    </div>
</template>
<script setup lang="ts">
import Drager from 'es-drager'
import winframe from 'winframe'
const props = withDefaults(defineProps<{
    isOp?: boolean | number
}>(), {
    isOp: true
})
const el = ref()
const { top, height } = useElementBounding(el)
const info = ref({
    top: 0,
    left: 0,
})
const info2 = ref({
    top: 0,
    left: 0,
})
const style = computed(() => {
    return {
        right: info.value.left + 'px',
        bottom: info.value.top + 'px',
    }
})
const posY = computed(() => {
    return top.value + height.value
})
const drager = ref(null)
const show = ref(true)
const isOP = ref(true)
const handleDragStart = () => {
    isOP.value = false
}
useCssVars(() => ({
    op: props.isOp ? (isOP.value ? (typeof props.isOp === 'number' ? props.isOp : 0.5) : 1 as any) : 1
}))
const handleDragEnd = (e: any) => {
    isOP.value = true
    show.value = false
    info.value.left += -e.left
    info.value.top += -e.top
    const left = info.value.left
    nextTick(() => {
        show.value = true
        const copyPosY = posY.value
        const copyPosYOffset = copyPosY - height.value
        const top = info.value.top
        winframe((p) => {
            info.value.left = left * (1 - p)
            if (copyPosYOffset < 0) {
                info.value.top = top - height.value + copyPosYOffset * p
            }
            if (copyPosYOffset > innerHeight) {
                info.value.top = top + (copyPosYOffset - innerHeight) * p
            }
        }, 100)
    })
}
</script>
<style scoped lang="less">
.levitated-sphere {}
</style>
```
# 历史面板
```vue
<template>
    <div ref="history_el" class="abs-content hidden" :class="{
        'pointer-events-none': !isShowHistory
    }">
        <div ref="history_mask_el" class="abs left-0 top-0 h-100% w-100% bg-#000 bg-op-36 op-0"
            @click="handleShowHistory(false)"></div>
        <div ref="history_content_el" class="abs left-0 top-0 h-100% w-80% bg-#fff">
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import winframe from 'winframe';
const history_el = ref() as unknown as Ref<HTMLDivElement>
const history_mask_el = ref() as unknown as Ref<HTMLDivElement>
const history_content_el = ref() as unknown as Ref<HTMLDivElement>
const isShowHistory = ref(false)
const debounceTime = ref(0)
const isDone = ref(true)
// timeout 单位ms，开启或关闭的动画时间
const handleShowHistory = async (bool: boolean, timeout = 300, isMoveMode?: boolean) => {
    if (!isDone.value) return
    isDone.value = false
    debounceTime.value = performance.now()
    const opacity = Number(history_mask_el.value.style.opacity)
    if (bool) {
        history_el.value.style.display = 'block'
        history_mask_el.value.style.opacity = '0'
        await nextTick()
        const width = Math.abs(Number(history_content_el.value.style.transform.match(/translateX\((.*)px\)/)?.[1]) || history_content_el.value.offsetWidth)
        history_content_el.value.style.transform = `translateX(${-width}px)`
        await winframe(p => {
            history_mask_el.value.style.opacity = (isMoveMode ? opacity + (1 - opacity) * p : p) as unknown as string
            history_content_el.value.style.transform = `translateX(${-width * (1 - p)}px)`
        }, timeout)
        isShowHistory.value = true
    } else {
        history_el.value.style.display = 'block'
        await nextTick()
        const width = history_content_el.value.offsetWidth
        const width2 = Math.abs(Number(history_content_el.value.style.transform.match(/translateX\((.*)px\)/)?.[1]))
        history_mask_el.value.style.opacity = '1'
        history_content_el.value.style.transform = `translateX(${isMoveMode ? -width2 : 0}px)`
        await winframe(p => {
            history_mask_el.value.style.opacity = (isMoveMode ? opacity * (1 - p) : (1 - p)) as unknown as string
            const translateX = isMoveMode ? -width2 - (width - width2) * p : -width * p
            history_content_el.value.style.transform = `translateX(${translateX}px)`
        }, timeout)
        history_content_el.value.style.transform = `translateX(${-width}px)`
        history_mask_el.value.style.opacity = '0'
        history_el.value.style.display = 'none'
        isShowHistory.value = false
    }
    if (performance.now() - debounceTime.value > timeout) {
        isDone.value = true
    }
}
defineExpose({
    handleShowHistory
})
const useTouchmove = (cb: (data: {
    x: number,
    y: number,
    event: TouchEvent,
    type: 'touchstart' | 'touchmove' | 'touchend',
    isTouchstart: boolean,
}) => void) => {
    let clientX = 0
    let clientY = 0
    let offsetX = 0
    let offsetY = 0
    let isTouchstart = false
    const touchstart = (e: TouchEvent) => {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
        isTouchstart = true
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchstart',
            isTouchstart,
        })
    }
    const touchmove = (e: TouchEvent) => {
        if (!isTouchstart) return
        offsetX = e.touches[0].clientX - clientX
        offsetY = e.touches[0].clientY - clientY
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchmove',
            isTouchstart,
        })
    }
    const touchend = (e: TouchEvent) => {
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchend',
            isTouchstart,
        })
        isTouchstart = false
        clientX = 0
        clientY = 0
        offsetX = 0
        offsetY = 0
    }
    return {
        start() {
            window.addEventListener('touchstart', touchstart)
            window.addEventListener('touchmove', touchmove)
            window.addEventListener('touchend', touchend)
        },
        stop() {
            window.removeEventListener('touchstart', touchstart)
            window.removeEventListener('touchmove', touchmove)
            window.removeEventListener('touchend', touchend)
        }
    }
}
const moveRectWidth = ref(0)
const hasScrollbar: any = (element: HTMLElement) => {
    if (!element || element.attributes.getNamedItem('history-max-box')) { return false }
    return element?.scrollHeight > element?.clientHeight || hasScrollbar(element?.parentElement as any) as unknown as any;
}
const {
    start,
    stop
} = useTouchmove(async ({ x, y, type, isTouchstart, event }) => {
    if (hasScrollbar(event.target as unknown as any)) {
        return
    }
    const mx = 50
    if (Math.abs(y) > mx) {
        handleShowHistory(false, undefined, true)
        return
    }
    if (isShowHistory.value || !history_el.value) { return }
    const offsetMvX = x - mx
    const offset = -moveRectWidth.value + offsetMvX
    setTimeout(async () => {
        if (type === 'touchstart') {
            history_el.value.style.display = 'block'
            history_mask_el.value.style.opacity = '0'
            history_content_el.value.style.transform = `translateX(-100%)`
            await nextTick()
            moveRectWidth.value = history_content_el.value.offsetWidth
            return
        }
        if (type === 'touchend') {
            // Math.abs(offsetMvX) > window.innerWidth / 6 判断是否是现实滑动的最大阀值，默认是屏幕的1/6
            handleShowHistory(Math.abs(offsetMvX) > window.innerWidth / 6, undefined, true)
            return
        }
    }, 0)
    if (isTouchstart && type === 'touchmove') {
        if (offset > 0 && offset < moveRectWidth.value) { return }
        if (x > mx) {
            history_mask_el.value.style.opacity = (1 - Math.abs(offset / moveRectWidth.value) as unknown as string)
            history_content_el.value.style.transform = `translateX(${offset}px)`
        }
    }

})
onMounted(() => {
    start()
})
onBeforeUnmount(() => {
    stop()
})
</script>
<style scoped lang="less">
.history {}
</style>
```

# 移动端触摸移动事件
```typescript
const useTouchmove = (cb: (data: {
    x: number,
    y: number,
    event: TouchEvent,
    type: 'touchstart' | 'touchmove' | 'touchend',
    isTouchstart: boolean,
}) => void) => {
    let clientX = 0
    let clientY = 0
    let offsetX = 0
    let offsetY = 0
    let isTouchstart = false
    const touchstart = (e: TouchEvent) => {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
        isTouchstart = true
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchstart',
            isTouchstart,
        })
    }
    const touchmove = (e: TouchEvent) => {
        if (!isTouchstart) return
        offsetX = e.touches[0].clientX - clientX
        offsetY = e.touches[0].clientY - clientY
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchmove',
            isTouchstart,
        })
    }
    const touchend = (e: TouchEvent) => {
        cb({
            x: offsetX,
            y: offsetY,
            event: e,
            type: 'touchend',
            isTouchstart,
        })
        isTouchstart = false
        clientX = 0
        clientY = 0
        offsetX = 0
        offsetY = 0
    }
    return {
        start() {
            window.addEventListener('touchstart', touchstart)
            window.addEventListener('touchmove', touchmove)
            window.addEventListener('touchend', touchend)
        },
        stop() {
            window.removeEventListener('touchstart', touchstart)
            window.removeEventListener('touchmove', touchmove)
            window.removeEventListener('touchend', touchend)
        }
    }
}
```

# 表单封装
```vue
<template>
    <n-form class="formValidate" ref="formRef" :rules="rules" :model="modelValue" v-bind="config">
        <n-grid v-bind="gridProps" :cols="cols">
            <template v-for="(item, index) in field" :key="index">
                <n-grid-item v-bind="item.gridItemProps" :span="get(item, 'gridItemProps.span', cols)">
                    <n-form-item :label="item.label" :path="item.field" v-bind="item.config">
                        <template v-if="item.slots && item.slots.gridBefore">
                            <component :is="item.slots.gridBefore" :field="item.field" :rules="item.rules"
                                :formConfig="config" :formData="modelValue" />
                        </template>
                        <template v-if="componentMapConfig[item.component]">
                            <component :is="componentMapConfig[item.component]" v-bind="{
                                ...item.props,
                                [item.fieldModel || `value`]: modelValue[item.field],
                                [`onUpdate:${item.fieldModel || 'value'}`]: (v: any) => {
                                    modelValue[item.field] = v
                                }
                            }">
                                <!-- 动态插槽继承，后续其他组件也可以这样做 -->
                                <template v-for="(slotItem, key) in item?.slots" :key="key" #[key]="scope">
                                    <template v-if="!builtInSlot.includes(key)">
                                        <component :is="slotItem" :field="item.field" :rules="item.rules"
                                            :formConfig="config" :formData="modelValue" v-bind="scope" />
                                    </template>
                                </template>
                            </component>
                        </template>
                        <template v-else>
                            <component v-if="item.component" :is="item.component" :field="item.field"
                                :rules="item.rules" :formConfig="config" :formData="modelValue" v-bind="{
                                    ...item.props,
                                    [item.fieldModel || `modelValue`]: modelValue[item.field],
                                    [`onUpdate:${item.fieldModel || 'modelValue'}`]: (v: any) => {
                                        modelValue[item.field] = v
                                    }
                                }" />
                        </template>
                        <template v-if="item.slots && item.slots.gridAefter">
                            <component :is="item.slots.gridAefter" :field="item.field" :rules="item.rules"
                                :formConfig="config" :formData="modelValue" />
                        </template>
                        <!-- 动态插槽继承，后续其他组件也可以这样做 -->
                        <template v-for="(slotItem, key) in item?.slots" :key="key" #[getKey(key)]="scope">
                            <template v-if="builtInFormSlot.includes(key)">
                                <component :is="slotItem" :field="item.field" :rules="item.rules" :formConfig="config"
                                    :formData="modelValue" v-bind="scope" />
                            </template>
                        </template>
                    </n-form-item>
                </n-grid-item>
            </template>
        </n-grid>
    </n-form>
</template>
<script setup lang="ts">
import { FormRules, FormProps, GridProps } from 'naive-ui';
import * as naiveUI from 'naive-ui';
import { get } from 'lodash';
const getKey = (key: any) => {
    const name = (key || '').replace(/form/, '').toLowerCase();
    return name === 'default' ? null : name;
};
const builtInFormSlot = ref<any>(['formFeedback', 'formLabel']);
const builtInSlot = computed<any>(() =>
    ['gridBefore', 'gridAefter'].concat(builtInFormSlot.value)
);
const componentMapConfig = shallowRef<any>({
    input: naiveUI.NInput,
    number: naiveUI.NInputNumber,
    select: naiveUI.NSelect,
    cascader: naiveUI.NCascader,
    datePicker: naiveUI.NDatePicker,
    switch: naiveUI.NSwitch,
    upload: naiveUI.NProUpload,
    transferTree: naiveUI.NTransferTree,
});
const formRef = ref();
const props = defineProps<{
    modelValue: Record<string, any>;
    field: FormValidateField;
    config?: FormProps;
    gridProps?: GridProps;
}>();
const cols = computed(() => {
    return get(props.gridProps, 'cols', 1);
});
const emit = defineEmits(['update:modelValue']);
const { modelValue, field, config } = useVModels(props, emit);
const rules = computed(() => {
    return (field.value || []).reduce<FormRules>((acc, item) => {
        acc[item.field] = item.rules as FormRules[string];
        return acc;
    }, {} as Record<string, FormRules[string]>);
});
defineExpose({
    form: formRef,
    validate: () => {
        return formRef.value?.validate();
    },
});
</script>
<style scoped lang="less">
.formValidate {}
</style>




```
```typescript
export {};
import {
    FormRules,
    FormItemProps,
    InputProps,
    CascaderProps,
    SelectProps,
    DatePickerProps,
    SwitchProps,
    UploadProps,
    InputNumberProps,
    GridItemProps,
    TransferTreeProps,
} from 'naive-ui';
type FormValidateFieldItemComponent = {
    input: InputProps;
    select: SelectProps;
    cascader: CascaderProps;
    datePicker: DatePickerProps;
    switch: SwitchProps;
    upload: UploadProps;
    number: InputNumberProps;
    transferTree: TransferTreeProps;
};
import { Component, VNode, ExtractPropTypes } from 'vue';
declare global {
    type FormValidateField = FormValidateFieldItem[];
    type FormValidateFieldItem<
        C = keyof FormValidateFieldItemComponent | Component | VNode
    > = {
        label?: string;
        component: C;
        field: string;
        rules?: FormRules[string];
        config?: FormItemProps;
        gridItemProps?: GridItemProps;
        props?: C extends keyof FormValidateFieldItemComponent
            ? FormValidateFieldItemComponent[C]
            : C extends VNode | Component
            ? ExtractPropTypes<C>
            : never;
        slots?: {
            formFeedback?: Component | VNode;
            formLabel?: Component | VNode;
            gridBefore?: Component | VNode;
            gridAefter?: Component | VNode;
            [key: string]: Component | VNode;
        };
        fieldModel?: string;
    };
}

```


# ncol 类型补充
```typescript
declare module "ncol" {
  interface Ncol {
    log(...arg: any[]): Ncol;
    error(...arg: any[]): Ncol;
    errorBG(...arg: any[]): Ncol;
    black(...arg: any[]): Ncol;
    blue(...arg: any[]): Ncol;
    success(...arg: any[]): Ncol;
    successBG(...arg: any[]): Ncol;
    info(...arg: any[]): Ncol;
    infoBG(...arg: any[]): Ncol;
    color(callback: (this: Ncol) => void): Ncol;
  }
  const ncol: Ncol;
  export = ncol;
}

```

# nodejs读取execl 文件并提取所有图片（推荐xlsx）
```typescript
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

// 定义Excel文件路径和保存图片的目录
const excelFilePath = "2.xlsx"; // 替换为你的Excel文件路径
const outputDir = "./output_images"; // 图片保存目录

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function extractImagesFromExcel(filePath: any) {
  try {
    // 创建一个新的工作簿实例
    const workbook = new ExcelJS.Workbook();

    // 加载Excel文件
    await workbook.xlsx.readFile(filePath);

    // 遍历每个工作表
    for (const file of (workbook as any).model.media) {
      if (file.type === "image") {
        try {
          // 将图片保存到文件
          const imagePath = `${outputDir}/${file.name}.png`;
          fs.writeFileSync(imagePath, file.buffer);
          console.log(`Saved image: ${imagePath}`);
        } catch (e) {}
      }
    }

    console.log("All images extracted successfully.");
  } catch (error) {
    console.error("Error extracting images:", error);
  }
}

// 调用函数
extractImagesFromExcel(excelFilePath);

```
# nodejs pdf 批注绘制（非浏览器方式绘制）
```typescript
import { createCanvas } from "canvas";
import { writeFileSync, readFileSync } from "fs";
import { PDFDocument, PDFPage } from "pdf-lib";
class pdfForCanvasDraw {
  constructor() {}
  async init() {
    try {
      const pdfFileBuff = readFileSync("test1.pdf");
      const pdfDoc = await PDFDocument.load(pdfFileBuff);
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext(
          "2d"
        ) as unknown as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, width, height);
        //开始绘制===========================
        await this.draw({
          ctx,
          width,
          height,
          page,
        });
        //结束绘制============================
        const buffer = canvas.toBuffer("image/png");
        const pngImage = await pdfDoc.embedPng(buffer);
        writeFileSync("output.png", buffer);
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      writeFileSync("output.pdf", Buffer.from(await pdfDoc.save()));
    } catch (error) {
      console.error("Error:", error);
    }
  }
  async draw({
    ctx,
    page,
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    page: PDFPage;
  }) {}
}
new pdfForCanvasDraw().init();
```

# 无纸化pdf批注nodejs渲染

[非canvas 版本,canvas会导致cpu爆满](./serve/pdf-annotation-synthesis.ts)

```typescript
import { createCanvas } from "canvas";
import { PDFDocument, PDFPage } from "pdf-lib";
import { chunk } from "lodash";
type PenTypeMapRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
type PenTypeMapBRUSHPEN = {
  x: number;
  y: number;
};
type PenTypeMapTEXTPEN = {
  data: any;
  height: any;
  key: any;
  leftTopPdfSize: {
    height: any;
    width: any;
  };
  page: any;
  rightBottomPdfSize: {
    height: any;
    width: any;
  };
  scale: any;
  width: any;
  x: any;
  y: any;
  zoom: any;
};
export class PdfForCanvasDraw {
  get annotations() {
    return JSON.parse(this.annotationsStr);
  }
  constructor(public annotationsStr, public data: Buffer) {}
  async init() {
    try {
      const pdfDoc = await PDFDocument.load(this.data as any);
      const pages = pdfDoc.getPages();
      await Promise.all(
        new Array(pages.length).fill(0).map(
          (_, i) =>
            new Promise((resolve) => {
              (async () => {
                const page = pages[i];
                const { width, height } = page.getSize();
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext(
                  "2d"
                ) as unknown as CanvasRenderingContext2D;
                ctx.clearRect(0, 0, width, height);
                //开始绘制===========================
                await this.draw({
                  ctx,
                  width,
                  height,
                  page,
                  index: i,
                });
                //结束绘制============================
                const buffer = canvas.toBuffer("image/png");
                const pngImage = await pdfDoc.embedPng(buffer as any);
                page.drawImage(pngImage, {
                  x: 0,
                  y: 0,
                  width,
                  height,
                });
                resolve(i);
              })();
            })
        )
      );

      return Buffer.from(await pdfDoc.save());
    } catch (error) {
      console.error("Error:", error);
    }
  }
  toHex8(value: number) {
    let color = null;
    if (value >= 0) {
      color = value.toString(16);
    } else {
      const hex = (value >>> 0).toString(16).toUpperCase();
      color = ("00000000" + hex).slice(-8);
    }
    return chunk(color.slice(2) + color.slice(0, 2), 2)
      .map((e) => parseInt(e.join(""), 16))
      .reduce((a, b, k) => ((a[["r", "g", "b", "a"][k]] = b), a), {} as any);
  }
  async draw({
    ctx,
    index,
    height,
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    page: PDFPage;
    index: number;
  }) {
    const devicePixelRatio = 1;
    await Promise.all(
      this.annotations
        ?.filter((e: any) => e.page === index)
        .map(
          (e: any) =>
            new Promise((resolve) => {
              (async () => {
                if (typeof e.data === "string") {
                  e.data = JSON.parse(e.data as unknown as string);
                }

                const { color: penColor, penWidthScale: penWidth } = JSON.parse(
                  e.data.pen
                );
                const { r, g, b, a } = this.toHex8(penColor) as any;

                switch (e.penType) {
                  case "UNDERWAVELINE":
                    // 波浪线
                    await Promise.all(
                      (
                        JSON.parse(
                          e.data.mergeData as string
                        ) as Array<PenTypeMapRect>
                      ).map(async (ee) => {
                        const startX = ee.left * devicePixelRatio;
                        const startY = height - ee.bottom * devicePixelRatio;
                        const lineWidth =
                          ee.right * devicePixelRatio -
                          ee.left * devicePixelRatio;
                        const amplitude = 2;
                        const frequency = 0.8;
                        const offsetX = 0;
                        const offsetY = startY;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${
                          b || 0
                        }, ${a || 1})`;
                        ctx.lineWidth = penWidth;
                        ctx.moveTo(startX, startY);
                        for (let x = 0; x < lineWidth; x++) {
                          const y =
                            offsetY +
                            amplitude * Math.sin((x + offsetX) * frequency);
                          ctx.lineTo(startX + x, y);
                        }
                        ctx.stroke();
                        ctx.closePath();
                      })
                    );
                    break;
                  case "UNDERLINE":
                    // 下划线
                    (
                      JSON.parse(
                        e.data.mergeData as string
                      ) as Array<PenTypeMapRect>
                    ).forEach((ee) => {
                      // ctx 绘制线段，定义颜色和粗细
                      ctx.beginPath();
                      ctx.lineWidth = penWidth;
                      ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${
                        b || 0
                      }, ${a || 1})`;
                      ctx.moveTo(
                        ee.left * devicePixelRatio,
                        height - ee.bottom * devicePixelRatio
                      );
                      ctx.lineTo(
                        ee.right * devicePixelRatio,
                        height - ee.bottom * devicePixelRatio
                      );
                      ctx.stroke();
                      ctx.closePath();
                    });
                    break;
                  case "HIGHLIGHTPEN":
                    // 矩形
                    (
                      JSON.parse(
                        e.data.mergeData as string
                      ) as Array<PenTypeMapRect>
                    ).forEach((ee) => {
                      ctx.beginPath();
                      ctx.fillStyle = `rgba(${r || 0}, ${g || 0}, ${
                        b || 0
                      }, 0.2)`;
                      ctx.fillRect(
                        ee.left * devicePixelRatio,

                        height - ee.top * devicePixelRatio,
                        (ee.right - ee.left) * devicePixelRatio,

                        (ee.top - ee.bottom) * devicePixelRatio
                      );
                      ctx.stroke();
                      ctx.closePath();
                    });
                    break;
                  case "BRUSHPEN":
                    // 线
                    (e.data.data as Array<PenTypeMapBRUSHPEN>).forEach(
                      (ee, k: number, arr: any[]) => {
                        if (!arr[k + 1]) {
                          return;
                        }
                        // ctx 绘制线段，定义颜色和粗细
                        ctx.beginPath();
                        ctx.lineWidth = penWidth;
                        ctx.strokeStyle = `rgba(${r || 0}, ${g || 0}, ${
                          b || 0
                        }, ${a || 1})`;
                        ctx.moveTo(
                          ee.x * devicePixelRatio,
                          height - ee.y * devicePixelRatio
                        );
                        ctx.lineTo(
                          arr[k + 1].x * devicePixelRatio,
                          height - arr[k + 1].y * devicePixelRatio
                        );
                        ctx.stroke();
                        ctx.closePath();
                      }
                    );
                    break;
                  case "TEXTPEN":
                    await (async (data: PenTypeMapTEXTPEN) => {
                      ctx.fillStyle = `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${
                        a || 1
                      })`;
                      const textMap = data.data.split("\n");
                      ctx.font = `30px 黑体`;
                      ctx.textBaseline = "top";
                      textMap.forEach((text: string, index: number) => {
                        ctx.fillText(
                          text,
                          data.leftTopPdfSize.width * devicePixelRatio,
                          height -
                            data.leftTopPdfSize.height * devicePixelRatio +
                            index * 30,
                          data.width * devicePixelRatio
                        );
                      });
                    })(e.data.data as PenTypeMapTEXTPEN);
                    break;
                }
                resolve(1);
              })();
            })
        )
    );
  }
}
export default PdfForCanvasDraw;
```

# excel表格公式使用

相关依赖

```json
{
  "@handsontable/vue3": "^15.2.0",
  "handsontable": "^15.2.0",
  "hyperformula": "^3.0.0",
}
```

具体代码 

```vue
<template>
    <div class="aaaa abs-center w-80% h-80% of-auto">
        <hot-table v-bind="config"></hot-table>
    </div>
</template>
<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { HyperFormula, FunctionPlugin, FunctionArgumentType, ImplementedFunctions } from 'hyperformula';
registerAllModules();
const licenseKey = 'gpl-v3'
class MyCustomPlugin extends FunctionPlugin {
    static implementedFunctions: ImplementedFunctions = {
        GREET: {
            method: 'GREET',
            parameters: [
                { argumentType: FunctionArgumentType.ANY, },
            ],
            // 如果需要多参数，使用repeatLastArgs
            repeatLastArgs: 1
        },
    };
    constructor(instance) {
        super(instance);
    }
    GREET(ast, state) {
        console.log(11, ast, state)
        return this.runFunction(
            ast.args,
            state,
            this.metadata('GREET'),
            (...firstName) => {
                return `👋 Hello, ${firstName}!`;
            }
        );
    }
}
HyperFormula.registerFunctionPlugin(MyCustomPlugin, {
    enGB: Object.fromEntries(Object.entries(MyCustomPlugin.implementedFunctions).map(([key]: any) => [key, key]))
});

const data = ref([
    new Array(50).fill(''),
    ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
    ['2016', 10, 11, 12, 13],
    ['2017', 20, 11, 14, 13],
    ['2018', 30, 15, 12, "=sum(B5:D5)"],
    ['2018', 30, 15, 12, "=GREET(E5,E3)"]
]);
const config = ref({
    mergeCells: {
        cells: [{ row: 1, col: 1, rowspan: 3, colspan: 2 }]
    },
    formulas: {
        licenseKey,
        engine: HyperFormula.buildEmpty({
            language: 'enGB',
            licenseKey
        }),
    },
    matchWholeCell: true,
    licenseKey,
    data,
    colHeaders: true,
    rowHeaders: true,
})
onMounted(() => {
})
</script>
<style scoped lang="less">
.xlsx {}
</style>
```
# Luckysheet 实现斜角线
```js
DIAGONALLINE: function () {
    if (arguments.length < this.m[0] || arguments.length > this.m[1]) {
      return formula.error.na;
    }
    const a = [];
    a.push.apply(a, arguments);
    return a
      .map(e => {
        try {
          if (typeof e == "object") {
            return e.data.v;
          }
          return e;
        } catch (e) {
          return e;
        }
      })
      .join("__DIAGONALLINE__");
  },
```
```js
/**
 * @param {*} cell 单元格
 * @param {*} postion 单元格位置
 * @param {*} sheetFile 工作表
 * @param {CanvasRenderingContext2D} ctx 画布
 * */
cellRenderAfter: function (cell, postion, sheetFile, ctx) {
  // console.log(postion);
  if (/^=DIAGONALLINE/.test(cell?.f)) {
    const value = cell.v?.split?.("__DIAGONALLINE__") || [cell.v];
    const x = postion.start_c;
    const y = postion.start_r;
    const ex = postion.end_c;
    const ey = postion.end_r;
    const w = Math.abs(postion.end_c - postion.start_c);
    const h = Math.abs(postion.end_r - postion.start_r);
    ctx.clearRect(x, y, w, h);
    ctx.fillStyle = cell.bg || "#fff";
    ctx.fillRect(x, y, w, h);
    let length = value.length - 1
    ctx.strokeStyle = cell.fc;
    ctx.lineWidth = 1;
    if (length % 2 !== 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      length -= 1
    }
    const length2 = length / 2
    for (let i = 0; i < length2; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      const width = w / (length2 + 1) * (i + 1)
      ctx.lineTo(width + x, ey);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      const height = h / (length2 + 1) * (i + 1)
      ctx.lineTo(ex, height + y);
      ctx.stroke();
    }
    // 计算文字位置
    const textPos = []
    const length3 = ((length2 + 1) * 2)
    const textFontSize = typeof Number(cell.fs) === 'number' ? Number(cell.fs) : 16
    function getAngleFromTwoPoints(x1, y1, x2, y2) {
      const dy = y2 - y1;
      const dx = x2 - x1;
      const radians = Math.atan2(dy, dx); // 处理所有象限情况
      const degrees = radians * (180 / Math.PI);
      return degrees;
    }
    function getPointOnLineByTwoPoints(x1, y1, x2, y2, t) {
      // t ∈ [0,1] 表示从 A 到 B 的线段上点
      // t ∈ R 表示整条直线上的点
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      t -= String(value[textPos.length]).length * textFontSize / length
      const x = x1 + t * (x2 - x1);
      const y = y1 + t * (y2 - y1);
      return {
        x,
        y,
        angle: getAngleFromTwoPoints(x1, y1, x2, y2),
      };
    }
    const wz = 0.9
    for (let i = 0; i < length3; i++) {
      if (i % 2 !== 0) {
        continue
      }
      textPos.push(getPointOnLineByTwoPoints(x, y, x + w / length3 * (i + 1), h + y, wz))
      textPos.push(getPointOnLineByTwoPoints(x, y, x + w, h / length3 * (i + 1) + y, wz))
    }
    // 绘制内容

    ctx.font = `${cell.bl === 1 ? 'bold' : ''} ${cell.it === 1 ? 'italic' : ''} ${textFontSize}px ${cell.ff || 'sans-serif'} `
    ctx.fillStyle = cell.fc
    if (value.length === 1) {
      ctx.save();
      ctx.fillText(value[0], x + (w - textFontSize * String(value[0]).length) / 2, y + (h - textFontSize) / 2);
      ctx.restore();
    } else {
      value.forEach((item, index) => {
        ctx.save();
        ctx.translate(textPos[index].x, textPos[index].y);
        ctx.rotate(Math.PI / 180 * textPos[index].angle);
        ctx.textBaseline = "middle";
        ctx.fillText(item, 0, 0);
        ctx.restore();
      })
    }
  }
},
```
# 数据库连接池node-serve 简单封装
```
import { createPool, QueryOptions } from "mysql2";
import * as ncol from "ncol";
const pool = createPool({
  host: "",
  port: 3306,
  user: "root",
  password: "",
  database: "",
  connectionLimit: 10,
});
export default function (sql: string | QueryOptions, values?: any) {
  return new Promise((resolve, reject) => {
    try {
      const query = pool.query(sql as any, values, (err: any, results) => {
        if (err) {
          ncol.color(() => {
            ncol
              .error("【SQL】")
              .info(
                query.sql.replace(/ {1,}/g, " ").replace(/(\n ){1,}/g, "\n ")
              )
              .error("\n【SQL_VALUES】")
              .info(JSON.stringify(values, null, 4))
              .error("\n[SQL_MESSAGE】")
              .error(err.sqlMessage);
          });
          reject(err);
        } else {
          ncol.color(() => {
            ncol
              .success("【SQL】")
              .info(
                query.sql.replace(/ {1,}/g, " ").replace(/(\n ){1,}/g, "\n ")
              )
              .success("\n【SQL_VALUES】")
              .info(JSON.stringify(values, null, 4));
          });
          resolve(results);
        }
      });
    } catch (err) {
      ncol.color(() => {
        ncol.success("【SQL】").success("\n【SQL_VALUES】").info(values);
      });
      reject(err);
    }
  });
}


```

### 计算一年度的周数，第一周必须包含周四

```typescript
/**
 * 根据年份获取指定年份的week信息
 * @param year 年份
 * @param startFirstDayByWeek 非国际算法，指定每年第一周重指定星期开始，默认周一开始， 取值范围0-6，0为周日，同dayjs一致
 */
const getYearWeekOption = (year: number, startFirstDayByWeek = 1) => {
    const startFirstDay = dayjs().year(year).startOf('year');
    const weekA = dayjs(startFirstDay).day()
    let startDay = null
    if (startFirstDayByWeek > 0) {
        // 非国际算法，指定每年第一周重指定星期开始，默认周一开始
        startDay = startFirstDay.add(startFirstDayByWeek - weekA, 'day')
    } else {
        // 国际算法，每年的第一周必须包含周四
        if (weekA > 4) {
            // 今年
            startDay = startFirstDay.add(7 - weekA, 'day')
        } else {
            // 非今年
            startDay = startFirstDay.add(-weekA, 'day')
        }
    }
    return {
        label: year,
        value: year,
        children: new Array(53).fill(0).map((_, k) => {
            const startWeekFirstDay = startDay.add(k * 7, 'day').set('hour', 0).set('m', 0).set('s', 0)
            const startWeekLastDay = startDay.add(k * 7 + 6, 'day').set('hours', 23).set('m', 59).set('s', 59)
            return {
                label: `第${k + 1}周(${startWeekFirstDay.format('MM月DD日')}-${startWeekLastDay.format('MM月DD日')})`,
                value: `${year}年第${k + 1}周`,
                startTime: startWeekFirstDay.toDate().getTime(),
                endTime: startWeekLastDay.toDate().getTime(),
                year,
                week: k + 1,
                isEffective: startWeekFirstDay.year() <= year
            }
        }).filter(e => e.isEffective)
    }
}
/**
 * 获取指定年份的所有week信息
 * @param time 指定年份
 * @param offsetYear 指定年份的上下浮动的年份，默认为前后5年
 */
const getYearWeekOptions = (time: any = null, offsetYear = 5) => {
    return new Array(offsetYear * 2 + 1).fill(0).map((_, index) => {
        const year = dayjs(time || dayjs()).add(index - offsetYear, 'year').year()
        return getYearWeekOption(year)
    });
}
/**
 * 根据时间查询所属周信息
 * @param time 时间
 */
const getWeekByDay = (time: any) => {
    const day = dayjs(time || dayjs())
    const year = day.year()
    const weekData = getYearWeekOption(year)
    const weekList = weekData.children
    const timeNow = day.toDate().getTime()
    return weekList.find(e => e.startTime <= timeNow && e.endTime >= timeNow) as typeof weekList[0]
}
// 获取当前年往后推5年的年份
const getYearRange = async () => {
    options.value = getYearWeekOptions()
    const week = getWeekByDay(dayjs())
    checkDate.value = {
        key: week.year + '年第' + week.week + '周',
        year: week.year,
        week: week.week,
        startTime: week.startTime,
        endTime: week.endTime,
    };
    await getScheduleData();
};
```

### vue 简单的响应式代理

```
<template>
    <div class='ref'></div>
</template>
<script setup lang="ts">
class shallowRef {
    constructor(value) {
        this._value = value;
    }
    subs = new Set();
    isRef = true;
    get value() {
        if (activeSub) {
            this.subs.add(activeSub);
        }
        return this._value;
    }
    set value(newValue) {
        this._value = newValue;
        this.subs.forEach((sub) => {
            sub();
        });
    }
}
function ref(value) {
    return new shallowRef(value);
}
let activeSub = null;
function effect(fn) {
    activeSub = fn;
    fn();
    activeSub = null;
}
function h(type, props, children) {
    return {
        type,
        props,
        children: Array.isArray(children) ? children : [children],
        render: (element) => {
            if (children && children.isRef) {
                element.innerText = children.value;
            } else {
                element.innerText = typeof children === 'function' ? children() : children;
            }
        },
        isVNode: true,
    }
}
const aa = ref(1222)
setInterval(() => {
    aa.value = Math.random();
}, 1000);
const a = ref(h('div', {
    class: 'w-500px h-500px bg-red-500',
    onClick: () => {
        console.log('click');
    }
}, [
    h('div', {
        class: 'w-100px h-100px bg-blue-500',
        onClick: () => {
            console.log('click');
        }
    }, 'child1'),
    h('span', {
        class: 'w-100px h-100px bg-green-500',
        onClick: () => {
            console.log('click');
        }
    }, 'child2'),
    h('div', {
        class: 'w-100px h-100px bg-green-500',
        onClick: () => {
            console.log('click');
        }
    }, h('span', {
        class: 'w-100px h-100px bg-green-500',
        onClick: (e: MouseEvent) => {
            e.stopPropagation();
            console.log('click');
        }
    }, () => `aa.value:${aa.value}`)),
]));
const el = useCurrentElement<HTMLElement>();
function renderElement(el, VNode) {
    const { type, props, children } = VNode;
    const element = document.createElement(type);
    VNode.el = element;
    for (const key in props) {
        if (/^on[A-Z]+/.test(key)) {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, props[key]);
            continue;
        }
        element.setAttribute(key, props[key]);
    }
    children.forEach((child) => {
        if (child.isVNode) {
            renderElement(element, child);
        } else {
            effect(VNode.render.bind(null, element));
        }
    });
    el.appendChild(element);
}
function render() {
    el.value.innerHTML = "";
    renderElement(el.value, a.value)
}
onMounted(() => {
    effect(render);
})
</script>
<style scoped lang="less">
.ref {}
</style>
```
