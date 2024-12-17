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
    Stopwatch stopwatch = Stopwatch()..start();
    String cbcDecryptData =
        SM4.decrypt(content, mode: SM4CryptoMode.CBC, iv: iv);
    stopwatch.stop();
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
