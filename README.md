# Blog

个人爱好，知识积累，点滴成石

## flutter环境搭建

```md
环境要求
当前使用 flutter版本 3.24.5
当前使用 android sdk版本 34
当前使用 dart版本 3.5.4

环境配置
~/.zshrc
export PATH="$PATH":"$HOME/.pub-cache/bin"
alias flutter="fvm flutter"
alias dart="fvm dart"
export PATH="$HOME/.jenv/bin:$PATH"
export STUDIO_JDK=$JAVA_HOME
eval "$(jenv init -)"



flutter 版本管理工具 fvm, java版本管理工具jenv

flutter 修改jdk-dir flutter config --jdk-dir="path/to/jdk" 修改为java17 flutter config --jdk-dir="/Users/zys/.jenv/versions/17"

java下载指定版本： brew install temurin@17

fvm安装
✅ 正确安装 FVM（Flutter 版本管理）
FVM 是一个 Dart 工具，不是 brew 工具
👉 正确方式是用 dart pub 安装

🚀 方法一（推荐）：用 Dart 安装
dart pub global activate fvm

🔧 配置 PATH（必须！）
export PATH="$HOME/.pub-cache/bin:$PATH"
👉 写入 ~/.zshrc：
echo 'export PATH="$HOME/.pub-cache/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

✅ 验证
fvm --version

🚀 方法二（可选）：用 Git 安装（备用方案）
git clone https://github.com/leoafarias/fvm.git ~/.fvm
然后：
export PATH="$HOME/.fvm/bin:$PATH"
👉 不如 Dart 方式简单，不推荐
jenv 安装
一、安装 jenv
✅ macOS（推荐用 Homebrew）
brew install jenv

✅ Linux（通用方式）
git clone https://github.com/jenv/jenv.git ~/.jenv

二、配置环境变量（关键）
根据你用的 shell（你之前用 zsh），编辑：
vim ~/.zshrc
添加：
export PATH="$HOME/.jenv/bin:$PATH"
eval "$(jenv init -)"
然后刷新：
source ~/.zshrc

三、验证安装
jenv --version
如果正常，会输出版本号 ✅

四、添加 Java 版本
👉 先查看你本机已有 Java：
/usr/libexec/java_home -V
示例输出：
/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
👉 添加到 jenv：
jenv add /Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home

五、查看已管理的 Java
jenv versions

六、切换 Java 版本
🌍 全局（推荐）
jenv global 17
📁 当前目录
jenv local 17
🔧 临时（当前 shell）
jenv shell 17

七、启用 jenv 管理（很重要）
默认 jenv 不会接管 java 命令，必须执行：
jenv enable-plugin export
然后重启 shell：
exec $SHELL

八、验证是否生效
java -version
如果显示你设置的版本，说明 OK ✅

```

## flutter 无意义发生器

```sh
# 防止 alias 冲突
unalias flutter 2>/dev/null
flutter() {
  # 拦截 --version
  for arg in "$@"; do
    if [ "$arg" = "--version" ]; then
      echo "
Can't load Kernel binary: Invalid kernel binary format version.
FINE: Pub 3.5.4
FINE: Package Config up to date.
FINE: Package Config up to date.
Flutter 3.41.0 • channel stable • https://github.com/flutter/flutter.git
Framework • revision 44a626f4f0 (8 weeks ago) • 2026-02-10 10:16:12 -0800
Engine • hash cc8e596aa65130a0678cc59613ed1c5125184db4 (revision 3452d735bd) (1 months ago) • 2026-02-09 22:03:17.000Z
Tools • Dart 3.11.0 • DevTools 2.54.1
IO  : Writing 6746 characters to text file /Users/zys/.pub-cache/log/pub_log.txt.
MSG : Logs written to /Users/zys/.pub-cache/log/pub_log.txt."
      return
    fi
    if [ "$arg" = "doctor" ]; then
      echo "[✓] Flutter (Channel stable, 3.24.5, on macOS 26.0.1 25A362 darwin-arm64, locale zh-Hans-CN)
    • Flutter version 3.24.5 on channel stable at /Users/zys/fvm/versions/3.24.5
    • Upstream repository https://github.com/flutter/flutter.git
    • Framework revision dec2ee5c1f (1 year, 5 months ago), 2024-11-13 11:13:06 -0800
    • Engine revision a18df97ca5
    • Dart version 3.5.4
    • DevTools version 2.37.3

[✓] Android toolchain - develop for Android devices (Android SDK version 36.1.0)
    • Android SDK at /Users/zys/Library/Android/sdk
    • Platform android-36, build-tools 36.1.0
    • Java binary at: /Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java
    • Java version OpenJDK Runtime Environment (build 21.0.10+-117844308-b1163.108)
    • All Android licenses accepted.

[✗] Xcode - develop for iOS and macOS
    ✗ Xcode installation is incomplete; a full installation is necessary for iOS and macOS development.
      Download at: https://developer.apple.com/xcode/
      Or install Xcode via the App Store.
      Once installed, run:
        sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
        sudo xcodebuild -runFirstLaunch
    ✗ CocoaPods not installed.
        CocoaPods is a package manager for iOS or macOS platform code.
        Without CocoaPods, plugins will not work on iOS or macOS.
        For more info, see https://flutter.dev/to/platform-plugins
      For installation instructions, see
      https://guides.cocoapods.org/using/getting-started.html#installation

[✓] Chrome - develop for the web
    • Chrome at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome

[✓] Android Studio (version 2025.3)
    • Android Studio at /Applications/Android Studio.app/Contents
    • Flutter plugin can be installed from:
      🔨 https://plugins.jetbrains.com/plugin/9212-flutter
    • Dart plugin can be installed from:
      🔨 https://plugins.jetbrains.com/plugin/6351-dart
    • Java version OpenJDK Runtime Environment (build 21.0.10+-117844308-b1163.108)

[✓] IntelliJ IDEA Ultimate Edition (version 2026.1)
    • IntelliJ at /Applications/IntelliJ IDEA.app
    • Flutter plugin version 91.0.0
    • Dart plugin version 504.0.0

[✓] Connected device (4 available)
    • PKK110 (mobile)              • UW8HNZR4E6BYAUHY • android-arm64  • Android 16 (API 36)
    • sdk gphone16k arm64 (mobile) • emulator-5554    • android-arm64  • Android 17 (API 37) (emulator)
    • macOS (desktop)              • macos            • darwin-arm64   • macOS 26.0.1 25A362 darwin-arm64
    • Chrome (web)                 • chrome           • web-javascript • Google Chrome 146.0.7680.178

[✓] Network resources
    • All expected network resources are available.

! Doctor found issues in 1 category."
      return 
    fi
    if [ "$arg" = "run" ]; then
     echo "Resolving dependencies... (18.4s)
Downloading packages... 
  async 2.11.0 (2.13.1 available)
  boolean_selector 2.1.1 (2.1.2 available)
< characters 1.3.0 (was 1.4.1) (1.4.1 available)
< clock 1.1.1 (was 1.1.2) (1.1.2 available)
< collection 1.18.0 (was 1.19.1) (1.19.1 available)
  cross_file 0.3.4+2 (0.3.5+2 available)
  cupertino_icons 1.0.8 (1.0.9 available)
< fake_async 1.3.1 (was 1.3.3) (1.3.3 available)
  ffi 2.1.3 (2.2.0 available)
  flutter_blue_plus 1.35.5 (2.2.1 available)
  flutter_blue_plus_android 4.0.5 (8.2.1 available)
  flutter_blue_plus_darwin 4.0.1 (8.2.1 available)
  flutter_blue_plus_linux 3.0.2 (8.2.1 available)
  flutter_blue_plus_platform_interface 4.0.2 (8.2.1 available)
  flutter_blue_plus_web 3.0.1 (8.2.1 available)
  flutter_foreground_task 8.17.0 (9.2.2 available)
  flutter_lints 4.0.0 (6.0.0 available)
  flutter_plugin_android_lifecycle 2.0.26 (2.0.34 available)
  flutter_svg 2.1.0 (2.2.4 available)
  fluttertoast 8.2.14 (9.0.0 available)
  http_parser 4.0.2 (4.1.2 available)
  image_cropper 9.1.0 (12.2.0 available)
  image_cropper_for_web 6.1.0 (7.0.0 available)
  image_cropper_platform_interface 7.1.0 (8.0.0 available)
  image_picker 0.8.6+4 (1.2.1 available)
  image_picker_android 0.8.12+15 (0.8.13+16 available)
  image_picker_for_web 2.1.12 (3.1.1 available)
  image_picker_ios 0.8.12+2 (0.8.13+6 available)
  image_picker_platform_interface 2.10.1 (2.11.1 available)
  js 0.6.7 (0.7.2 available)
< leak_tracker 10.0.5 (was 11.0.2) (11.0.2 available)
< leak_tracker_flutter_testing 3.0.5 (was 3.0.10) (3.0.10 available)
< leak_tracker_testing 3.0.1 (was 3.0.2) (3.0.2 available)
  lints 4.0.0 (6.1.0 available)
< matcher 0.12.16+1 (was 0.12.18) (0.12.19 available)
< material_color_utilities 0.11.1 (was 0.13.0) (0.13.0 available)
< meta 1.15.0 (was 1.17.0) (1.18.2 available)
  mqtt_client 10.5.1 (10.11.10 available)
< path 1.9.0 (was 1.9.1) (1.9.1 available)
  petitparser 6.0.2 (7.0.2 available)
  shared_preferences 2.5.3 (2.5.5 available)
  shared_preferences_android 2.4.7 (2.4.23 available)
  shared_preferences_foundation 2.5.4 (2.5.6 available)
  shared_preferences_platform_interface 2.4.1 (2.4.2 available)
> sky_engine 0.0.99 from sdk flutter (was 0.0.0 from sdk flutter)
  source_span 1.10.0 (1.10.2 available)
< stack_trace 1.11.1 (was 1.12.1) (1.12.1 available)
< stream_channel 2.1.2 (was 2.1.4) (2.1.4 available)
  string_scanner 1.2.0 (1.4.1 available)
  term_glyph 1.2.1 (1.2.2 available)
< test_api 0.7.2 (was 0.7.8) (0.7.11 available)
  universal_html 2.2.4 (2.3.0 available)
  universal_io 2.2.2 (2.3.1 available)
  vector_graphics 1.1.18 (1.1.21 available)
  vector_graphics_compiler 1.1.16 (1.2.0 available)
< vector_math 2.1.4 (was 2.2.0) (2.3.0 available)
  video_player 2.9.5 (2.11.1 available)
  video_player_android 2.7.16 (2.9.5 available)
  video_player_avfoundation 2.7.1 (2.9.4 available)
  video_player_platform_interface 6.3.0 (6.6.0 available)
  video_player_web 2.3.5 (2.4.0 available)
  vm_service 14.2.5 (15.0.2 available)
  xml 6.5.0 (6.6.1 available)
Changed 16 dependencies!
62 packages have newer versions incompatible with dependency constraints.
"
      genact -s 5 --exit-after-time "$((RANDOM % 9 + 2))min"
      echo "Try `flutter pub outdated` for more information.
Launching lib/main.dart on sdk gphone16k arm64 in debug mode...

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':gradle:compileGroovy'.
> BUG! exception in phase 'semantic analysis' in source unit '/Users/zys/fvm/versions/3.24.5/packages/flutter_tools/gradle/src/main/groovy/app_plugin_loader.groovy' Unsupported class file major version 65

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.

* Get more help at https://help.gradle.org

BUILD FAILED in 5s
Running Gradle task 'assembleDebug'...                              6.2s

┌─ Flutter Fix ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [!] Your project's Gradle version is incompatible with the Java version that Flutter is using for Gradle.                              │
│                                                                                                                                        │
│ If you recently upgraded Android Studio, consult the migration guide at https://flutter.dev/to/to/java-gradle-incompatibility.         │
│                                                                                                                                        │
│ Otherwise, to fix this issue, first, check the Java version used by Flutter by running `flutter doctor --verbose`.                     │
│                                                                                                                                        │
│ Then, update the Gradle version specified in /Users/zys/work/iron_tower_flutter/android/gradle/wrapper/gradle-wrapper.properties to be │
│ compatible with that Java version. See the link below for more information on compatible Java/Gradle versions:                         │
│ https://docs.gradle.org/current/userguide/compatibility.html#java                                                                      │
│                                                                                                                                        │
│                                                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
Error: Gradle task assembleDebug failed with exit code 1"
      return 1
    fi
  done

  # 其他情况走真实 flutter
  command flutter "$@"
#   genact -m download -s 1000
}

```

## 复制文件 copyfile 

```sh
copyfile() {
  # 参数校验
  if [ -z "$1" ]; then
    echo "Usage: copyfile <file>"
    return 1
  fi

  # 转绝对路径（兼容相对/绝对）
  local file
  file=$(realpath "$1" 2>/dev/null)

  # macOS 没有 realpath 时 fallback
  if [ -z "$file" ]; then
    file=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
  fi

  # 检查文件是否存在
  if [ ! -e "$file" ]; then
    echo "File not found: $1"
    return 1
  fi

  echo "$file"

  # 写入剪切板（Finder 可粘贴）
  osascript -e "set the clipboard to (POSIX file \"$file\")"
}

```

## nodejs判断是否是启动文件

```ts
if (require.main === module) {
//main();
}
```

## ssh前端资源部署服务器自动化脚本

README.md

```md
# 推送教程

## 前置条件

- 本地已安装 `zip` 工具
- 远程主机已配置 SSH 公钥认证 `~/.ssh/authorized_keys`
- 远程主机已安装 `unzip` 工具
- 远程主机已安装 `tar` 工具
- 远程主机已安装 `bash` 工具
- 远程主机已安装 `rsync` 工具

## 配置说明

- 本地构建 / 打包配置
  - `DIST_DIR`：构建输出目录（默认：`dist`）
  - `DIST_ZIP_NAME`：压缩包文件名（默认：`dist.zip`）
  - `LOCAL_ZIP_PATH`：本地压缩包路径（默认：`dist/dist.zip`）

- 远程部署配置
  - `DEPLOY_HOST`：部署主机 IP 或域名（默认：`127.0.0.1`）
  - `DEPLOY_USER`：部署主机用户名（默认：`root`）
  - `REMOTE_TMP_DIR`：远程临时目录（默认：`/tmp`）
  - `REMOTE_ZIP_PATH`：远程压缩包路径（默认：`/tmp/dist.zip`）
  - `BASE_DIR`：部署基础目录（默认：`/home/front-end`）
  - `TARGET_DIR`：部署目标目录（默认：`lqt`）

## 部署流程

1. 本地构建 / 打包
2. 上传压缩包到远程主机
3. 远程部署（变量注入）


## 技巧

*  远程备份恢复脚本
  
\`\`\`sh
cd /home/front-end

# 1. 先备份当前版本（可选但强烈建议）
mv lqt lqt_broken_$(date +"%Y%m%d_%H%M%S")

# 2. 解压指定 .bak
tar -xzf lqt_20251227_103012.bak

# 3. 确认目录恢复
ls -l lqt

\`\`\`
  
```

push.sh

```sh
#!/usr/bin/env bash
set -e

################################
# 本地构建 / 打包配置
################################
DIST_DIR=dist
DIST_ZIP_NAME=dist.zip
LOCAL_ZIP_PATH="${DIST_DIR}/${DIST_ZIP_NAME}"

################################
# 远程部署配置
################################
DEPLOY_HOST=server_host
DEPLOY_USER=user

REMOTE_TMP_DIR=/tmp
REMOTE_ZIP_PATH="${REMOTE_TMP_DIR}/${DIST_ZIP_NAME}"

BASE_DIR=/home/front-end
TARGET_DIR=lqt

################################
# 开始流程
################################

echo '开始构建'
# pnpm build
echo '构建完成'

echo '开始打包'
cd "${DIST_DIR}"
zip -r "${DIST_ZIP_NAME}" . -x "*.zip"
cd ..
echo '打包完成'

echo '开始部署'

# 1️⃣ 上传压缩包
rsync -av "${LOCAL_ZIP_PATH}" "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_ZIP_PATH}"

# 2️⃣ 远程部署（变量注入）
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s << EOF
set -e

BASE_DIR="${BASE_DIR}"
TARGET_DIR="${TARGET_DIR}"
REMOTE_ZIP_PATH="${REMOTE_ZIP_PATH}"

TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="\${TARGET_DIR}_\${TIMESTAMP}.bak"

cd "\${BASE_DIR}"

# 1. 压缩备份旧版本
if [ -d "\${TARGET_DIR}" ]; then
  tar -czf "\${BACKUP_FILE}" "\${TARGET_DIR}"
  rm -rf "\${TARGET_DIR}"
fi

# 2. 创建新目录
mkdir -p "\${TARGET_DIR}"

# 3. 解压新版本
unzip -oq "\${REMOTE_ZIP_PATH}" -d "\${TARGET_DIR}"

EOF

echo "部署完成"

```

## 幼儿园成长手册提示词

帮我画 幼儿园成长画册排版图，主题冬季；尺寸A4大小，内容填充，排版简单、精美、好看
、单页

## 3d圣诞树

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Merry Christmas</title>
    <!-- 引入多种字体：Great Vibes(英手写), Ma Shan Zheng(中毛笔), Long Cang(中草书) -->
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Ma+Shan+Zheng&family=Long+Cang&family=Noto+Sans+SC:wght@700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; font-family: 'Segoe UI', sans-serif; transition: background 1s ease; }
        
        /* 背景样式 */
        body.bg-black { background: #000; }
        body.bg-deep { background: radial-gradient(circle at center, #1a1a2e 0%, #000000 100%); }
        body.bg-warm { background: radial-gradient(circle at center, #2e1a1a 0%, #0f0505 100%); }
        body.bg-aurora { background: radial-gradient(circle at top, #0f2027 0%, #203a43 50%, #2c5364 100%); }
        body.bg-china { background: radial-gradient(circle at center, #4a0000 0%, #1a0000 100%); }

        /* 标题基础样式 */
        #main-title {
            position: absolute; top: 20px; left: 0; width: 100%;
            text-align: center; z-index: 50; pointer-events: none; opacity: 0; transition: all 0.5s ease;
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            text-shadow: 0 0 20px rgba(255,215,0,0.3);
            /* 默认字体大小，会被JS覆盖 */
            font-size: 5rem; 
            white-space: nowrap;
        }

        /* 圣诞配色 */
        .style-xmas {
            background: linear-gradient(to bottom, #ffd700, #ffec8b);
        }
        /* 新春配色 */
        .style-cny {
            background: linear-gradient(to bottom, #ff3333, #ffd700);
            text-shadow: 0 0 30px rgba(255, 0, 0, 0.6);
        }

        /* 启动页 */
        #start-screen {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 200; display: flex; flex-direction: column;
            justify-content: center; align-items: center; color: #fff;
        }
        #btn-start {
            padding: 15px 50px; font-size: 20px; background: linear-gradient(90deg, #ffd700, #ffaa00);
            border: none; border-radius: 30px; color: #000; font-weight: bold; cursor: pointer;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); margin-top: 30px; transition: transform 0.2s;
        }
        #btn-start:hover { transform: scale(1.05); }

        /* 照片弹窗 */
        #photo-modal {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.5);
            max-width: 80%; max-height: 80%; background: #fff; padding: 10px 10px 40px 10px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.8); z-index: 150;
            opacity: 0; pointer-events: none; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border-radius: 4px;
        }
        #photo-modal.active { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-3deg); }
        #photo-modal img { max-width: 100%; max-height: 60vh; display: block; }
        #photo-caption { text-align: center; color: #333; font-family: 'Great Vibes', cursive; font-size: 2rem; margin-top: 5px; }

        /* 摄像头小窗 */
        #input_video {
            position: absolute; bottom: 20px; left: 20px;
            width: 200px; height: 150px; border-radius: 12px;
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            transform: scaleX(-1); z-index: 90; object-fit: cover;
            transition: opacity 0.5s ease;
        }
        #input_video.hidden-cam { opacity: 0; pointer-events: none; }

        /* 设置按钮 */
        #toggle-btn {
            position: absolute; top: 20px; right: 20px; width: 40px; height: 40px;
            background: rgba(255,255,255,0.1); border-radius: 50%; color: #fff;
            border: 1px solid rgba(255,255,255,0.2); cursor: pointer; z-index: 101;
            display: flex; justify-content: center; align-items: center; font-size: 18px;
        }

        /* === UI 面板优化 === */
        #ui-panel {
            position: absolute; top: 80px; right: 20px; width: 300px;
            max-height: 85vh; overflow-y: auto;
            background: rgba(15, 15, 20, 0.85); backdrop-filter: blur(15px);
            padding: 20px; border-radius: 12px; color: #fff;
            border: 1px solid rgba(255,255,255,0.15); z-index: 100;
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            box-shadow: -5px 0 20px rgba(0,0,0,0.5);
        }
        #ui-panel.hidden { transform: translateX(130%); }
        /* 滚动条美化 */
        #ui-panel::-webkit-scrollbar { width: 5px; }
        #ui-panel::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

        .control-section { border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 15px; margin-bottom: 15px; }
        .control-section:last-child { border-bottom: none; }
        
        .control-group { margin-bottom: 10px; }
        .control-group label { display: flex; justify-content: space-between; font-size: 12px; color: #ccc; margin-bottom: 5px; }
        
        /* 输入控件样式 */
        input[type=range] { width: 100%; accent-color: #ffd700; cursor: pointer; }
        input[type=text] {
            width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #444;
            color: #ffd700; border-radius: 4px; font-size: 14px; box-sizing: border-box;
        }
        select { width: 100%; padding: 6px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; }
        
        .btn { width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; cursor: pointer; border-radius: 6px; font-size: 12px; transition: 0.2s; }
        .btn:hover { background: rgba(255,255,255,0.2); }
        .btn.active { background: linear-gradient(90deg, #ff7675, #d63031); border:none; font-weight:bold; }

        h3 { margin: 0 0 10px 0; font-size: 14px; color: #ffd700; font-weight: bold; }
    </style>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
</head>
<body class="bg-black">

    <div id="main-title" class="style-xmas">Merry Christmas</div>

    <!-- 启动页 -->
    <div id="start-screen">
        <h1 style="font-family: 'Great Vibes'; font-size: 4rem; color: #ffd700; margin: 0;">Winter Magic</h1>
        <div style="margin-top:20px; text-align:center; color:#aaa; font-size:16px; line-height:1.8;">
            ⬅️ <strong>左手</strong>：控制爆炸 | ➡️ <strong>右手</strong>：捏合取图<br>
            可在控制台自定义标题文字
        </div>
        <button id="btn-start">开始体验 ✨</button>
    </div>

    <div id="photo-modal">
        <img id="modal-img" src="" alt="Memory">
        <div id="photo-caption">Sweet Memory</div>
    </div>

    <button id="toggle-btn">⚙️</button>
    <video id="input_video" class="hidden-cam"></video>

    <!-- 控制面板 -->
    <div id="ui-panel">
        <div class="control-group">
            <button id="btn-fullscreen" class="btn">⛶ 全屏模式</button>
        </div>

        <!-- 1. 文字自定义模块 -->
        <div class="control-section">
            <h3>📝 文字自定义</h3>
            <div class="control-group">
                <label>标题内容</label>
                <input type="text" id="custom-text" value="Merry Christmas">
            </div>
            <div class="control-group">
                <label>字体大小 <span id="val-font-size">5.0</span>rem</label>
                <input type="range" id="font-size" min="2.0" max="10.0" step="0.5" value="5.0">
            </div>
            <div class="control-group">
                <label>选择字体</label>
                <select id="font-family">
                    <option value="'Great Vibes', cursive">Great Vibes (英/手写)</option>
                    <option value="'Ma Shan Zheng', cursive">马善政 (中/毛笔)</option>
                    <option value="'Long Cang', cursive">龙苍 (中/草书)</option>
                    <option value="'Noto Sans SC', sans-serif">思源黑体 (中/粗体)</option>
                    <option value="'Segoe UI', sans-serif">系统默认 (简洁)</option>
                </select>
            </div>
        </div>

        <!-- 2. 风格切换 -->
        <div class="control-section">
            <h3>🎨 风格与场景</h3>
            <div class="control-group">
                <div style="display:flex; gap:10px;">
                    <button id="theme-xmas" class="btn active">🎄 圣诞</button>
                    <button id="theme-cny" class="btn">🧧 新春</button>
                </div>
            </div>
            <div class="control-group">
                <label>背景颜色</label>
                <select id="bg-select">
                    <option value="black">🌌 纯黑 (Black)</option>
                    <option value="deep">🌃 深邃 (Deep Blue)</option>
                    <option value="warm">🔥 暖冬 (Warm)</option>
                    <option value="aurora">❄️ 极光 (Aurora)</option>
                    <option value="china">🧧 中国红 (China Red)</option>
                </select>
            </div>
        </div>

        <!-- 3. 音乐与媒体 -->
        <div class="control-section">
            <h3>🎵 媒体控制</h3>
            <div class="control-group">
                <label>背景音乐</label>
                <button class="btn" onclick="document.getElementById('music-input').click()">📁 上传 MP3</button>
                <input type="file" id="music-input" accept="audio/*" style="display:none;">
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button id="btn-play-pause" class="btn" style="width:40px;">⏸</button>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="0.6">
                </div>
            </div>
            <div class="control-group">
                <label>照片管理</label>
                <button class="btn" style="background:linear-gradient(90deg, #00b894, #00cec9); color:black;" onclick="document.getElementById('folder-input').click()">📷 导入照片 (多选)</button>
                <input type="file" id="folder-input" multiple accept="image/*" style="display:none;">
            </div>
            <div class="control-group">
                <label>辅助显示</label>
                <button id="btn-toggle-cam" class="btn" style="background:rgba(255,255,255,0.15)">📹 显示/隐藏 摄像头</button>
            </div>
        </div>

        <!-- 4. 参数调节 -->
        <div class="control-section">
            <h3>🎛️ 参数调节</h3>
            <div class="control-group">
                <label>旋转速度 <span id="val-rot">0.002</span></label>
                <input type="range" id="rot-speed" min="0" max="0.02" step="0.001" value="0.002">
            </div>
            <div class="control-group">
                <label>树的高度</label>
                <input type="range" id="tree-height" min="40" max="100" step="5" value="70">
            </div>
            <div class="control-group">
                <label>音乐律动</label>
                <input type="range" id="beat-sense" min="0.1" max="3.0" step="0.1" value="1.0">
            </div>
        </div>
    </div>

    <!-- Shader -->
    <script type="x-shader/x-vertex" id="vertexshader">
        attribute float size; attribute vec3 customColor; attribute vec3 spherePos; attribute float type;     
        varying vec3 vColor; varying float vType;
        uniform float uTime; uniform float uExplosion; uniform float uBeat;      
        void main() {
            vColor = customColor; vType = type;
            float t = uExplosion;
            float ease = 1.0 - pow(1.0 - t, 3.0);
            vec3 finalPos = mix(position, spherePos, ease);
            float beatScale = 1.0;
            if (t < 0.2) beatScale += uBeat * 0.15 * (1.0 - t*3.0); 
            if (type > 0.5) beatScale += uBeat * 0.2; 
            vec4 mvPosition = modelViewMatrix * vec4(finalPos * beatScale, 1.0);
            float s = size;
            if(type > 0.5) s *= (1.0 + uBeat * 0.5);
            gl_PointSize = s * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    </script>
    <script type="x-shader/x-fragment" id="fragmentshader">
        uniform float uTime; uniform float uBeat;
        varying vec3 vColor; varying float vType;
        void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            if(length(coord) > 0.5) discard;
            vec3 color = vColor; float alpha = 1.0;
            if(vType > 0.5) {
                float flash = 0.5 + 0.5 * sin(uTime * 5.0 + vType * 10.0);
                color += vec3(0.5) * flash * uBeat * 2.0;
            } else { alpha = 0.8; }
            gl_FragColor = vec4(color, alpha);
        }
    </script>

    <script>
        const state = { 
            explosion: 0.0, targetExplosion: 0.0, photoActive: false, treeHeight: 70, rotationSpeed: 0.002,
            style: 'xmas' // 'xmas' or 'cny'
        };

        let scene, camera, renderer, clock;
        let particleSystem, treeGroup, topDecoration;
        let photoMeshes = [], loadedImages = [];
        let audioCtx, analyser, dataArray, audioEl;
        
        document.getElementById('btn-start').addEventListener('click', () => {
            const screen = document.getElementById('start-screen');
            screen.style.opacity = 0; setTimeout(() => screen.remove(), 1000);
            document.getElementById('main-title').style.opacity = 1;
            document.getElementById('input_video').classList.remove('hidden-cam');
            initAudio(); initThree(); setupUI(); startHandTracking();
        });

        function initAudio() {
            audioEl = new Audio(); audioEl.crossOrigin = "anonymous";
            audioEl.src = "https://thirdparty.gtimg.com/C1000007bNrR1HXkjD.m4a?fromtag=38"; audioEl.loop = true;
            const AudioContext = window.AudioContext || window.webkitAudioContext; audioCtx = new AudioContext();
            analyser = audioCtx.createAnalyser(); analyser.fftSize = 256; dataArray = new Uint8Array(analyser.frequencyBinCount);
            const source = audioCtx.createMediaElementSource(audioEl); source.connect(analyser); analyser.connect(audioCtx.destination);
            audioEl.play().catch(e => console.log(e));
        }

        function initThree() {
            clock = new THREE.Clock(); scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000000, 0.004);
            camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
            camera.position.set(0, 30, 90); camera.lookAt(0, 30, 0);
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(renderer.domElement);
            treeGroup = new THREE.Group(); scene.add(treeGroup);
            
            createParticles(); createTopObject(); createSnow(); animate();
        }

        function createParticles() {
            if(particleSystem) { treeGroup.remove(particleSystem); particleSystem.geometry.dispose(); }
            const count = 18000;
            const geo = new THREE.BufferGeometry();
            const positions = [], spherePos = [], colors = [], sizes = [], types = [];
            const h = state.treeHeight;
            const colorHelper = new THREE.Color();

            for(let i=0; i<count; i++) {
                const y = (i/count) * h;
                const rBase = (1 - y/h) * (h*0.4);
                const angle = i * 0.2;
                const r = rBase * Math.sqrt(Math.random());
                positions.push(Math.cos(angle)*r, y - 10, Math.sin(angle)*r);

                const v = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
                v.multiplyScalar(40 + Math.random()*50);
                spherePos.push(v.x, v.y + 20, v.z);

                const rnd = Math.random();
                let type = 0;
                if (state.style === 'cny') {
                    if(rnd > 0.95) { type = 2; sizes.push(4); colorHelper.setHex(0xffd700); }
                    else if(rnd > 0.85) { type = 1; sizes.push(5); colorHelper.setHex(0xff0000); }
                    else { type = 0; sizes.push(1.5); if(Math.random()>0.5) colorHelper.setHex(0xffcc00); else colorHelper.setHex(0xffaa00); }
                } else {
                    if(rnd > 0.96) { type = 2; sizes.push(4); colorHelper.setHex(0xffaa00); }
                    else if(rnd > 0.92) { type = 1; sizes.push(3); colorHelper.setHex(Math.random()>0.5?0xff0000:0x00aaff); }
                    else { type = 0; sizes.push(1.5); colorHelper.setHex(0x228b22); }
                }
                types.push(type); colors.push(colorHelper.r, colorHelper.g, colorHelper.b);
            }

            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('spherePos', new THREE.Float32BufferAttribute(spherePos, 3));
            geo.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
            geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
            geo.setAttribute('type', new THREE.Float32BufferAttribute(types, 1));

            state.uniforms = { uTime: { value: 0 }, uExplosion: { value: 0 }, uBeat: { value: 0 } };
            const mat = new THREE.ShaderMaterial({
                uniforms: state.uniforms, vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                blending: THREE.AdditiveBlending, depthTest: false, transparent: true
            });
            particleSystem = new THREE.Points(geo, mat);
            treeGroup.add(particleSystem);
        }

        function createTopObject() {
            if(topDecoration) { treeGroup.remove(topDecoration); }
            if(state.style === 'xmas') {
                const s=new THREE.Shape(); const p=5; for(let i=0;i<p*2;i++){ const r=(i%2===0)?4:2; const a=i/p*Math.PI; s.lineTo(Math.cos(a)*r,Math.sin(a)*r); }
                const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelThickness:0.5,bevelSize:0.2});
                topDecoration=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffdd00}));
            } else {
                topDecoration = new THREE.Group();
                const sphere = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000})); sphere.scale.set(1, 0.8, 1);
                const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 32), new THREE.MeshBasicMaterial({color: 0xffd700})); cap1.position.y = 2.6;
                const cap2 = cap1.clone(); cap2.position.y = -2.6;
                const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), new THREE.MeshBasicMaterial({color: 0xff3300})); t1.position.set(0, -6, 0);
                const t2 = t1.clone(); t2.position.set(1, -6, 0); t2.rotation.z=0.2;
                const t3 = t1.clone(); t3.position.set(-1, -6, 0); t3.rotation.z=-0.2;
                topDecoration.add(sphere, cap1, cap2, t1, t2, t3);
            }
            topDecoration.position.y = state.treeHeight;
            treeGroup.add(topDecoration);
        }

        function createSnow() {
            const g=new THREE.BufferGeometry(); const pos=[]; for(let i=0;i<1000;i++) pos.push((Math.random()-0.5)*200,Math.random()*150,(Math.random()-0.5)*200);
            g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
            window.snowSystem=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:0.6,transparent:true,opacity:0.6}));
            scene.add(window.snowSystem);
        }

        function updatePhotos() {
            photoMeshes.forEach(m => treeGroup.remove(m)); photoMeshes = [];
            if(loadedImages.length === 0) return;
            loadedImages.forEach(img => {
                const cvs = document.createElement('canvas'); cvs.width=256; cvs.height=256; const ctx = cvs.getContext('2d');
                ctx.beginPath(); ctx.arc(128,128,120,0,Math.PI*2); ctx.clip();
                const asp = img.width/img.height;
                if(asp>1) ctx.drawImage(img, (img.width-img.height)/2, 0, img.height, img.height, 0,0,256,256); else ctx.drawImage(img, 0, (img.height-img.width)/2, img.width, img.width, 0,0,256,256);
                ctx.lineWidth=10; ctx.strokeStyle = state.style === 'cny' ? '#ffd700' : '#ffffff'; ctx.stroke();
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6,6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs), side: THREE.DoubleSide, transparent:true }));
                const y = Math.random() * (state.treeHeight * 0.8);
                const r = (1 - y/state.treeHeight) * (state.treeHeight*0.4) + 2; 
                const a = Math.random() * Math.PI * 2;
                const origin = new THREE.Vector3(Math.cos(a)*r, y-10, Math.sin(a)*r);
                const explodeDir = origin.clone().normalize().multiplyScalar(40 + Math.random()*30); explodeDir.y += 20;
                mesh.position.copy(origin);
                mesh.userData = { origin: origin, explodePos: explodeDir, imgSrc: img.src };
                treeGroup.add(mesh); photoMeshes.push(mesh);
            });
            alert(`已挂载 ${loadedImages.length} 张照片`);
        }

        function animate() {
            requestAnimationFrame(animate); const t = clock.getElapsedTime();
            let beat = 0; if(analyser) { analyser.getByteFrequencyData(dataArray); let sum = 0; for(let i=0; i<15; i++) sum+=dataArray[i]; beat = (sum/15/255) * parseFloat(document.getElementById('beat-sense').value); }
            if(state.uniforms) { state.uniforms.uTime.value = t; state.uniforms.uBeat.value = beat; state.explosion += (state.targetExplosion - state.explosion) * 0.05; state.uniforms.uExplosion.value = state.explosion; }
            
            const ease = 1.0 - Math.pow(1.0 - state.explosion, 3.0);
            photoMeshes.forEach(p => { p.position.lerpVectors(p.userData.origin, p.userData.explodePos, ease); p.lookAt(camera.position); p.rotation.z += 0.005 * (1 + state.explosion * 5); });
            
            treeGroup.rotation.y += state.rotationSpeed + state.explosion * 0.01;
            
            if(topDecoration) {
                if(state.style === 'xmas') topDecoration.rotation.y -= 0.02;
                else topDecoration.rotation.z = Math.sin(t * 2) * 0.1;
                const s = 1 + beat * 0.3; topDecoration.scale.set(s,s,s);
            }
            if(window.snowSystem) {
                const pos = window.snowSystem.geometry.attributes.position.array;
                for(let i=1; i<pos.length; i+=3) { pos[i] -= 0.3; if(pos[i]<-20) pos[i]=100; }
                window.snowSystem.geometry.attributes.position.needsUpdate = true;
            }
            renderer.render(scene, camera);
        }

        function startHandTracking() {
            const video = document.getElementById('input_video');
            const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
            hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
            hands.onResults(results => {
                let leftFound = false;
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    for (let i = 0; i < results.multiHandedness.length; i++) {
                        const label = results.multiHandedness[i].label; const lm = results.multiHandLandmarks[i];
                        if (label === 'Left') {
                            leftFound = true; const d = Math.hypot(lm[4].x - lm[20].x, lm[4].y - lm[20].y);
                            state.targetExplosion = Math.min(Math.max((d - 0.15) * 4, 0), 1);
                        }
                        if (label === 'Right') {
                            const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
                            if (pinchDist < 0.05) { if (!state.photoActive) { showRandomPhoto(); state.photoActive = true; } }
                            else if (pinchDist > 0.08) { if (state.photoActive) { document.getElementById('photo-modal').classList.remove('active'); state.photoActive = false; } }
                        }
                    }
                }
                if (!leftFound) state.targetExplosion = 0;
            });
            const cameraUtils = new Camera(video, { onFrame: async () => { await hands.send({image: video}); }, width: 320, height: 240 });
            cameraUtils.start();
        }
        function showRandomPhoto() { if(loadedImages.length === 0) return; const img = loadedImages[Math.floor(Math.random() * loadedImages.length)]; const modal = document.getElementById('photo-modal'); document.getElementById('modal-img').src = img.src; modal.classList.add('active'); }

        function setupUI() {
            const fsBtn = document.getElementById('btn-fullscreen');
            fsBtn.addEventListener('click', () => { if(!document.fullscreenElement) { document.documentElement.requestFullscreen(); fsBtn.innerText="❌ 退出全屏模式"; } else { document.exitFullscreen(); fsBtn.innerText="⛶ 全屏模式"; } });
            document.getElementById('btn-toggle-cam').addEventListener('click', () => { document.getElementById('input_video').classList.toggle('hidden-cam'); });
            document.getElementById('bg-select').addEventListener('change', (e) => document.body.className = 'bg-'+e.target.value);
            document.getElementById('toggle-btn').addEventListener('click', () => document.getElementById('ui-panel').classList.toggle('hidden'));
            
            document.getElementById('rot-speed').addEventListener('input', (e) => { state.rotationSpeed = parseFloat(e.target.value); document.getElementById('val-rot').innerText = state.rotationSpeed.toFixed(3); });
            document.getElementById('music-input').addEventListener('change', (e) => { if(e.target.files[0]) { audioEl.src = URL.createObjectURL(e.target.files[0]); audioEl.play(); } });
            document.getElementById('btn-play-pause').addEventListener('click', () => { if(audioEl.paused) { audioEl.play(); document.getElementById('btn-play-pause').innerText="⏸"; } else { audioEl.pause(); document.getElementById('btn-play-pause').innerText="▶"; } });
            document.getElementById('volume-slider').addEventListener('input', (e) => audioEl.volume = e.target.value);
            document.getElementById('folder-input').addEventListener('change', (e) => { const files = Array.from(e.target.files); loadedImages = []; files.forEach(f => { const r = new FileReader(); r.onload=ev=>{ const i=new Image(); i.onload=()=>loadedImages.push(i)===Math.min(files.length,30)&&updatePhotos(); i.src=ev.target.result; }; r.readAsDataURL(f); }); });
            document.getElementById('tree-height').addEventListener('input', (e) => { state.treeHeight = parseInt(e.target.value); createParticles(); if(topDecoration) topDecoration.position.y = state.treeHeight; });
            document.getElementById('beat-sense').addEventListener('input', (e) => document.getElementById('beat-sense').value = e.target.value );

            // === 标题文字控制逻辑 ===
            const titleEl = document.getElementById('main-title');
            const textInput = document.getElementById('custom-text');
            const sizeInput = document.getElementById('font-size');
            const fontSelect = document.getElementById('font-family');
            
            textInput.addEventListener('input', (e) => titleEl.innerText = e.target.value);
            sizeInput.addEventListener('input', (e) => { titleEl.style.fontSize = e.target.value + 'rem'; document.getElementById('val-font-size').innerText = e.target.value; });
            fontSelect.addEventListener('change', (e) => titleEl.style.fontFamily = e.target.value);

            // === 主题切换逻辑 ===
            const switchTheme = (type) => {
                state.style = type;
                if(type === 'xmas') {
                    titleEl.innerText = 'Merry Christmas'; titleEl.className = 'style-xmas'; titleEl.style.fontFamily = "'Great Vibes', cursive";
                    // 更新输入框状态
                    textInput.value = 'Merry Christmas'; fontSelect.value = "'Great Vibes', cursive";
                    document.body.className = 'bg-black'; document.getElementById('bg-select').value = 'black';
                    document.getElementById('theme-xmas').classList.add('active'); document.getElementById('theme-cny').classList.remove('active');
                } else {
                    titleEl.innerText = '新春快乐 万事如意'; titleEl.className = 'style-cny'; titleEl.style.fontFamily = "'Ma Shan Zheng', cursive";
                    textInput.value = '新春快乐 万事如意'; fontSelect.value = "'Ma Shan Zheng', cursive";
                    document.body.className = 'bg-china'; document.getElementById('bg-select').value = 'china';
                    document.getElementById('theme-cny').classList.add('active'); document.getElementById('theme-xmas').classList.remove('active');
                }
                createParticles(); createTopObject(); if(loadedImages.length > 0) updatePhotos();
            };

            document.getElementById('theme-xmas').addEventListener('click', () => switchTheme('xmas'));
            document.getElementById('theme-cny').addEventListener('click', () => switchTheme('cny'));
        }
    </script>
</body>
</html>
```

### vscode代码片段

```json
{
	// Place your 全局 snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and 
	// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope 
	// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is 
	// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: 
	// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. 
	// Placeholders with the same ids are connected.
	// Example:
	"vue setup for ts and less template": {
		"prefix": "vue",
		"body": [
			"<template>",
			"    <div class='$TM_FILENAME_BASE'>$1</div>",
			"</template>",
			"<script setup lang=\"ts\">",
			"",
			"</script>",
			"<style scoped lang=\"less\">",
			".$TM_FILENAME_BASE{}",
			"</style>"
		],
		"description": "vue setup for ts and less template"
	},
	"表格": {
		"prefix": "vuetable",
		"body": [
			"<template>",
			"  <div class=\"$TM_FILENAME_BASE\">",
			"    <search-table :add-form=\"Add\" :list-api=\"\\$apis.mock.list\" :del-api=\"\\$apis.mock.info\" :columns=\"columns\">",
			"    </search-table>",
			"  </div>",
			"</template>",
			"<script setup lang=\"ts\" title=\"$TM_FILENAME_BASE\">",
			"import type { DataTableColumns } from \"naive-ui\";",
			"import Add from \"./alert/add.vue\";",
			"const columns = ref<DataTableColumns>([",
			"  {",
			"    type: \"selection\",",
			"  },",
			"  {",
			"    title: \"#\",",
			"    key: \"key\",",
			"    align: \"center\",",
			"    render: (_: any, index: number) => {",
			"      return `${index + 1}`;",
			"    },",
			"  },",
			"  { title: \"数据项1\", key: \"s\" },",
			"]);",
			"</script>",
			"<style scoped lang=\"less\">",
			".$TM_FILENAME_BASE {}",
			"</style>",
			""
		],
		"description": "表格"
	},
	"弹框": {
		"prefix": "alert",
		"body": [
			"<template class='$TM_FILENAME_BASE'>",
			"    <AlertContent>",
			"        <formValidate ref=\"form\" class=\"useFormDialog\" v-model=\"data\" :field=\"formFields\"",
			"            :config=\"{ labelPlacement: 'left', showFeedback: false }\" :grid-props=\"{ yGap: 8 }\"> </formValidate>",
			"        <template #footer>",
			"            <n-space justify=\"center\">",
			"                <n-button @click=\"close\">取消</n-button>",
			"                <n-button type=\"primary\" @click=\"save\">保存</n-button>",
			"            </n-space>",
			"        </template>",
			"    </AlertContent>",
			"</template>",
			"",
			"<script setup lang=\"ts\">",
			"const props = withDefaults(",
			"    defineProps<{",
			"        row?: any;",
			"    }>(),",
			"    {",
			"    }",
			");",
			"const emit = defineEmits(['save']);",
			"const form = ref()",
			"const data = ref<Record<string, any>>({});",
			"const formFields = ref<FormValidateField>([",
			"    $1",
			"]);",
			"",
			"onMounted(async () => {",
			"    if (props.row) {",
			"        data.value = { ...props.row };",
			"    }",
			"});",
			"",
			"const close = () => {",
			"    \\$alert.dialog.close();",
			"};",
			"const save = async () => {",
			"    await form.value.validate()",
			"    // await \\$apis",
			"    window.\\$message.success('保存成功');",
			"    close();",
			"    emit('save');",
			"};",
			"</script>",
			"",
			"<style scoped lang=\"less\">",
			".$TM_FILENAME_BASE {}",
			"</style>"
		],
		"description": "弹框"
	},
	"console.log": {
		"prefix": ["l","lo","log",".l",".lo",".log","."],
		"body": [
			"console.log($1)",
		],
		"description": "console.log"
	},
	"useVModels helper": {
		"prefix": ["vms","defineModel","useVModels"],
		"body": [
			"const props =$1 withDefaults(defineProps<{",
			"    modelValue?: any",
			"}>(), {",
			"    modelValue: []",
			"})",
			"const emit = defineEmits([\"update:modelValue\"])",
			"const { modelValue } = useVModels(props, emit)"
		],
		"description": "useVModels helper"
	},
	"表单": {
		"prefix": ["f","fo","for","form","form","alert-form"],
		"body": [
			"<template>",
			"  <div class='$TM_FILENAME_BASE'>",
			"    <alert-form v-model=\"modelValue\" @save=\"$emit('save')\" :row=\"row\" :rules=\"rules\">",
			"      <n-form-item label=\"标题\" path=\"title\">",
			"        <n-input placeholder=\"请输入标题\" v-model:value=\"modelValue.title\" />",
			"      </n-form-item>",
			"    </alert-form>",
			"  </div>",
			"</template>",
			"<script setup lang=\"ts\">",
			"import { FormRules } from \"naive-ui\";",
			"const props = withDefaults(defineProps<{",
			"  row?: any",
			"}>(), {",
			"  row: null",
			"})",
			"const emit = defineEmits([\"save\"])",
			"const { row } = useVModels(props, emit)",
			"const modelValue = ref<Record<string, any>>({})",
			"const rules = ref<FormRules>({",
			"  title: [{ required: true, message: \"请输入标题\", trigger: [\"blur\"] }],",
			"})",
			"</script>",
			"<style scoped lang=\"less\">",
			".$TM_FILENAME_BASE {}",
			"</style>"
		],
		"description": "表单"
	}
}
```

### mockjsApi

```ts
export default {
  list(data?: any) {
    return request({
      url: "/mock",
      method: "get",
      data,
    });
  },
  info(data?: any, extraConfig?: any) {
    return request({
      url: "/mockInfo",
      method: "get",
      data: {
        ...data,
        ...extraConfig,
      },
    });
  },
};

```

### mockJS

```ts
import { mock } from "mockjs";
mock(new RegExp("/mockInfo"), (o) => {
  return mock({
    code: 0,
    msg: "success",
    data: Object.fromEntries(
      Object.entries(JSON.parse(l_get(o, "body", "{}"))).map(
        ([key, value]: any) => {
          return [
            key,
            /^\/.*\/$/.test(value) ? new RegExp(value.slice(1, -1)) : value,
          ];
        },
      ),
    ),
  });
});
mock(new RegExp("/mock"), (o) => {
  return mock({
    code: 0,
    data: {
      "data|10": [
        l_merge(
          {
            a: /\d{4}-T\d{2}/,
            "status|0-9": 0,
            "b|1": true,
            id: "@id",
            s: "@cword(1, 30)",
          },
          Object.fromEntries(
            Object.entries(JSON.parse(l_get(o, "body", "{}"))).map(
              ([key, value]: any) => {
                return [
                  key,
                  /^\/.*\/$/.test(value)
                    ? new RegExp(value.slice(1, -1))
                    : value,
                ];
              },
            ),
          ),
        ),
      ],
      "total|1-100": 1,
    },
  });
});

```

### 串口数据读写

```ts
import { SerialPort } from "serialport";
(async () => {
  const ports = await SerialPort.list();
  // 串口数据
  const info = ports.find((item) => item.path.includes("usb"));
  // console.log(info, 777);
  const port = new SerialPort({
    path: info.path, // 改成你的串口
    baudRate: 9600, // 波特率，一定要和设备一致
  });
  port.on("open", () => {
    console.log("串口已打开");
  });
  port.on("data", (data: Buffer) => {
    console.log("收到数据:", data.toJSON().data);
  });

  port.on("error", (err: any) => {
    console.error("串口错误:", err.message);
  });
  port.on("close", () => {
    console.log("串口已关闭");
  });
  const data = "01 01 0A 00 00 64 64 32 00 27 23";
  const dataBuffer = Buffer.from(
    data.split(/\s+/).map((item) => parseInt(item, 16))
  );
  console.log(dataBuffer.toString());
  port.write(dataBuffer, (err) => {
    if (err) {
      console.error("写入数据失败:", err.message);
    } else {
      console.log("数据写入成功");
    }
  });
})();

```

### window 一键安装sshd

```bash
# 检查是否已安装 OpenSSH Server
$ssh = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'

if ($ssh.State -ne 'Installed') {
    Write-Host "🔧 未安装 OpenSSH Server，开始安装..."
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
} else {
    Write-Host "✅ OpenSSH Server 已安装"
}

# 确保 sshd 服务存在
$service = Get-Service -Name sshd -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "❌ 未找到 sshd 服务，可能安装失败，请重试或手动检查。" -ForegroundColor Red
    exit
}

# 设置 sshd 服务为自动启动
Set-Service -Name sshd -StartupType Automatic

# 启动 sshd 服务
Start-Service sshd

# 防火墙放行 22 端口
if (-not (Get-NetFirewallRule -DisplayName "OpenSSH-Server-In-TCP")) {
    New-NetFirewallRule -Name "OpenSSH-Server-In-TCP" `
        -DisplayName "OpenSSH-Server-In-TCP" `
        -Enabled True `
        -Direction Inbound `
        -Protocol TCP `
        -Action Allow `
        -LocalPort 22
}

Write-Host "`n🎉 SSHD 已安装并成功启动！"
Write-Host "👉 现在可以通过以下方式远程连接："
Write-Host "   ssh <你的 Windows 用户名>@<Windows IP>"

```

### 实时音频采集

```
let audioCtx, source, processor, stream;
stream = await navigator.mediaDevices.getUserMedia({
	audio: {
		// deviceId: deviceId ? { exact: deviceId } : undefined,
		sampleRate: 16000,
		channelCount: 1,
		echoCancellation: false,
		noiseSuppression: false,
		autoGainControl: false
	}
});
audioCtx = new AudioContext({ sampleRate: 16000 });
source = audioCtx.createMediaStreamSource(stream);
processor = audioCtx.createScriptProcessor(4096, 1, 1);
processor.onaudioprocess = (e) => {
	const data = e.inputBuffer.getChannelData(0);
	const int16 = new Int16Array(data.length);
	for (let i = 0; i < data.length; i++) {
		const s = Math.max(-1, Math.min(1, data[i]));
		int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
	}
	socket.emit('audio_chunk', int16.buffer);
};
source.connect(processor);
processor.connect(audioCtx.destination);
socket.emit('start_stream');
```

### 直播数据抓取

```sql 
SELECT id, content->"$.payload.user.nickname" as user,  content->"$.payload.content" as content,content as data FROM chat ORDER BY `content` desc LIMIT 100 
```

```ts
import { launch } from "puppeteer";
import { get, differenceBy } from "lodash";
import query from "./mysql";
import { timeout } from "async";
(async () => {
  const browser = await launch({
    headless: "new",
    // executablePath:
    //   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      "--autoplay-policy=no-user-gesture-required", // 🔥允许无操作自动播放
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: {
      width: 0,
      height: 0,
    },
    protocolTimeout: 0,
  });
  const page = await browser.newPage();
  const chatCache = [];
  await page.exposeFunction(
    "emitEvaluateData",
    async (data, error?: string) => {
      if (error) {
        return console.log(error);
      }
      const newdata = differenceBy(data, chatCache, "msg_id");
      chatCache.push(...newdata);
      newdata.forEach((e) => {
        query("INSERT INTO chat (content) VALUES (?)", [JSON.stringify(e)]);
      });
    }
  );

  await page.goto(
    "直播地址"
  );
  await page.evaluate(
    async function run() {
      try {
        const room = document.querySelector(".webcast-chatroom___list");
        if (room) {
          const roomkeys = Object.keys(room);
          const roomchild = roomkeys.map(
            (e) =>
              room[e].memoizedProps &&
              room[e].memoizedProps.children.props.children.props.children
          );
          roomchild.forEach((e) => {
            if (e) {
              console.log(e);
            }
          });
          const data = Object.keys(room)
            .map(
              (e) =>
                room[e].memoizedProps &&
                room[e].memoizedProps.children.props.children.props.children
            )
            .filter((e) => e)
            .reduce((a, b) => a.concat(b), [])
            .map(
              (e) =>
                e.props &&
                e.props.children.props.children.props.children.props.message
            )
            .filter((e) => e);
          window.emitEvaluateData(data);
        }
      } catch (error) {
        window.emitEvaluateData(null, error.message);
      }
      await new Promise((r) => {
        requestAnimationFrame(async () => {
          await run();
          r(true);
        });
      });
    },
    {
      timeout: 0,
    }
  );
})();
declare global {
  interface Window {
    emitEvaluateData: (data: any, error?: string) => Promise<string>;
    lodashGget: typeof get;
  }
}

```

uni-app 入口

```ts
import { UniEntryAbilityDev, NativeEmbedEvent } from "@dcloudio/uni-app-runtime";
import { initUniModules } from "../uni_modules/index.generated";
import BuildProfile from "BuildProfile";
import * as hmr from '@uni_modules/hmr-for-uni-app'
import window from '@ohos.window';
import { AbilityConstant, ConfigurationConstant, UIAbility, Want,bundleManager} from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { tag } from '@kit.ConnectivityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import emitter from '@ohos.events.emitter'



initUniModules();
interface IHmr {
  init: Function
}
interface NotifyPagePayload {
  action:string
  data:number[] | null | undefined
}
// 发送消息给 uni-app 页面
export function notifyPage(payload:NotifyPagePayload) {
  emitter.emit('message', payload)
}
const DOMAIN = 0x0000;
let nfcTagElementName: bundleManager.ElementName;
let foregroundRegister: boolean;
/**
获取系统信息
 */
async function getSystemInfo(nfcv:tag.NfcVTag, uid:number[]) {
  let cmd = [
    0x22,  // flags
    0x2B,  // Get System Info
    ...uid
  ];

  let resp = await nfcv.transmit(cmd);
  return resp;
}
interface NfcReadResult {
  raw: number[];
  blockSize: number;
  blockCount: number;
}
/**
 * 读取所有块
 * @param tagInfo
 * @returns
 */
export async function readAllBlocks(tagInfo: tag.TagInfo) {
  try {
    const nfcv = tag.getNfcV(tagInfo);

    // -------- 必须倒序 UID --------
    const uid = tagInfo.uid; // 关键点！！

    // -------- Step 1: Get System Info (0x2B) --------
    const sysCmd = [
      0x22,      // flags（需要地址模式）
      0x2B,      // Get System Info
      ...uid
    ];

    const sys = await nfcv.transmit(sysCmd);

    /**
     * 系统信息格式（ISO15693）
     * sys[0] = flags
     * sys[1~8] = UID
     * sys[9] = DSFID（可能有）
     * sys[10] = AFI（可能有）
     * sys[11] = Memory Info Flags
     * sys[12] = block count - 1
     * sys[13] = block size - 1
     */

    const memoryInfoIndex = 12; // 大部分标签从12开始是 Memory Info
    const blockCount = sys[memoryInfoIndex] + 1;    // 块数量
    const blockSize = sys[memoryInfoIndex + 1] + 1; // 每块字节数

    hilog.info(0x0000, "readAllBlocks",
      `BlockSize: ${blockSize}   BlockCount: ${blockCount}`
    );

    // ---------- Step 2: 分批读取所有块 ----------
    const maxBlocksPerRead = 32; // 一次最多读 32 块（兼容大部分标签）
    const allData = new Uint8Array(blockCount * blockSize);
    let offsetBlock = 0;

    while (offsetBlock < blockCount) {
      const readCount = Math.min(maxBlocksPerRead, blockCount - offsetBlock);

      const cmd = [
        0x22,             // flags
        0x23,             // Read Multiple Blocks
        ...uid,
        offsetBlock,      // first block
        readCount - 1     // number of blocks - 1
      ];

      const resp = await nfcv.transmit(cmd);

      // resp[0] = flags, resp[1..N] = 数据
      const payload = resp.slice(1);

      if (payload.length !== readCount * blockSize) {
        hilog.error(0x0000, "readAllBlocks", `块长度异常，读取失败`);
        return null;
      }

      allData.set(payload, offsetBlock * blockSize);
      offsetBlock += readCount;
    }

    // ---------- Step 3: 返回完整数据 ----------
    const result: NfcReadResult = {
      raw: [...allData],
      blockSize,
      blockCount
    };

    return result;

  } catch (error) {
    hilog.error(
      0x0000,
      "readAllBlocks",
      `读取失败: code=${error.code}, msg=${error.message}`
    );
    return null;
  }
}


interface NfcVInfo {
  manufacturer: string | null;          // 制造商
  uid: string | null;                   // UID（16进制字符串）
  totalCapacity: number | null;         // 存储容器容量（字节）
  techList: string[] | null;            // 技术列表
  systemFileLength: number | null;      // 系统文件长度（字节）
  storageFormatID: number | null;       // DSFID
  afi: number | null;                    // AFI
  totalBlockCount: number | null;       // 总区块数
  blockSize: number | null;             // 每个区块字节数
  icReference: number | null;           // IC参考
}
/**
 * 获取制造商
 * @param uidArray
 * @returns
 */
function getManufacturer(uidArray: number[]): string {
  const manufacturerId = uidArray[1];

  switch (manufacturerId) {
    case 0x02:
    case 0x07:
      return 'STMicroelectronics';
    case 0x04:
      return 'Texas Instruments';
    case 0xE0:
      return 'NXP';
    case 0x01:
      return 'Motorola';
    case 0x03:
      return 'Hitachi';
    default:
      return 'Unknown';
  }
}
/**
 * 获取NFCV模式的所有信息
 * @param tagInfo
 * @returns
 */
export async function getNfcVTagInfo(tagInfo:tag.TagInfo): Promise<NfcVInfo> {
  const nfcv = tag.getNfcV(tagInfo);

  // 默认返回 null
  const result: NfcVInfo = {
    manufacturer: null,
    uid: null,
    totalCapacity: null,
    techList: null,
    systemFileLength: null,
    storageFormatID: null,
    afi: null,
    totalBlockCount: null,
    blockSize: null,
    icReference: null,
  };

  try {
    // UID
    const uidArray: number[] = tagInfo.uid ?? [];
    if (uidArray.length === 8) {
      result.uid = uidArray.reverse().map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      // 制造商
      // UID[1] => manufacturer
      result.manufacturer = getManufacturer(uidArray);
    }

    // 技术列表
    result.techList = ['NFC-V'];

    // Get System Info 指令
    const cmd = [0x22, 0x2B, ...tagInfo.uid.reverse()];

    const resp = await nfcv.transmit(cmd);

    if (resp && resp.length >= 15) {
      // DSFID
      result.storageFormatID = resp[10] ?? null;
      result.afi = resp[11] ?? null;
      // Block Size & Count
      const blockSize = (resp[12] ?? null) !== null ? resp[12] + 1 : null;
      const blockCount = (resp[13] ?? null) !== null ? resp[13] + 1 : null;

      result.blockSize = blockSize;
      result.totalBlockCount = blockCount;
      result.totalCapacity = blockSize && blockCount ? blockSize * blockCount : null;

      // 系统文件长度（通常等于总容量）
      result.systemFileLength = result.totalCapacity;

      // IC Reference
      result.icReference = resp[14] ?? null;
    }
  } catch (e) {
    hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+e.code+"message:"+e.message);
  }
  return result;
}
/**
 * 连接NCFV
 * @param tagInfo
 * @returns
 */
async function connect( tagInfo : tag.TagInfo){
  // 获取特定技术类型的NFC标签对象
  if (tagInfo == null || tagInfo == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb tagInfo is invalid');
    return;
  }
  if (tagInfo.uid == null || tagInfo.uid == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb uid is invalid');
    return;
  }
  if (tagInfo.technology == null || tagInfo.technology == undefined || tagInfo.technology.length == 0) {
    hilog.error(0x0000, 'testTag', 'readerModeCb technology is invalid');
    return;
  }

  // 执行读写接口完成标签数据的读取或写入数据到标签
  // use the IsoDep technology to access this nfc tag.
  let isNfcv : tag.NfcVTag | null = null;
  for (let i = 0; i < tagInfo.technology.length; i++) {
    if (tagInfo.technology[i] == tag.NFC_V) {
      try {
        isNfcv = tag.getNfcV(tagInfo);
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'readerModeCb getIsoDep errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
        return;
      }
    }
    // use other technology to access this nfc tag if necessary.
  }
  if (isNfcv == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb getIsoDep is invalid');
    return;
  }

  // connect to this nfc tag using IsoDep technology.
  try {
    isNfcv.connect();
  } catch (error) {
    hilog.error(0x0000, 'testTag', 'readerModeCb isoDep.connect errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
    return;
  }
  if (!isNfcv.isConnected()) {
    hilog.error(0x0000, 'testTag', 'readerModeCb isoDep.isConnected() false.');
    return;
  }
  return isNfcv
}
/**
 * 读取指定块
 * @param tagInfo
 * @param blockIndex
 * @returns
 */
export async function readBlock(
  tagInfo: tag.TagInfo,
  blockIndex: number
){
  try {
    const nfcv = tag.getNfcV(tagInfo);

    // -------- UID 必须倒序 --------
    const uid = tagInfo.uid;

    // -------- 构造命令 0x20 Read Single Block --------
    const cmd = [
      0x22,       // flags（addressed）
      0x20,       // Read Single Block
      ...uid,
      blockIndex  // 块下标
    ];

    const resp = await nfcv.transmit(cmd);

    // resp[0] = flags，resp[1..N] = 数据
    if (resp && resp.length > 1) {
      return resp.slice(1); // 返回纯数据
    } else {
      hilog.error(0x0000, "readBlock", `读取块失败: resp=${resp}`);
      return null;
    }

  } catch (error) {
    hilog.error(
      0x0000,
      "readBlock",
      `读取 NFC-V 块失败: code=${error.code}, msg=${error.message}`
    );
    return null;
  }
}
/**
 * 写入指定块
 * @param tagInfo
 * @param blockIndex
 * @param data
 * @returns
 */
async function writeBlock(tagInfo:tag.TagInfo, blockIndex: number, data: number[]) {
  try {
    const nfcv = tag.getNfcV(tagInfo);
    const cmd = [0x22, 0x21, ...tagInfo.uid,blockIndex, ...data];
    const resp = await nfcv.transmit(cmd);
    if (resp && resp[0] === 0x00) {
      return resp;
    } else {
      hilog.error(
        0x0000,
        'writeSingleBlock',
        `写入失败: resp=${resp ? Array.from(resp).map(b => b.toString(16)) : 'null'}`
      );
      return null;
    }
  }catch (error) {
    hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+error.code+"message:"+error.message);
    return
  }
}
interface KVPair {
  k: number;
  v: (number|null)[];   // 根据实际类型改，比如 string/number/Uint8Array 等
}
/**
 * 通过索引写入指定数据,可以批量连续写入
 * @param tagInfo
 * @param blockIndex
 * @param data
 */
async function writeBlockAnyByIndex(tagInfo:tag.TagInfo, blockIndex: number, data: number[]) {
  const info = await getNfcVTagInfo(tagInfo)
  const map = new Map<number,number>();
  data.forEach((v, k) => {
    map.set(blockIndex + k, v);
  });
  const block = info.totalBlockCount || 0;
  const maxBlock = info.totalCapacity || 0;
  const arr = chunk(
    new Array(maxBlock).fill(null).map((e:null, k) => map.get(k) || null),
    block
  )
    .map((v, k):KVPair => {
      return  {
        k,
        v,
      }
    })
    .filter((e) => e.v.find((e) => e !== null));
  await Promise.allSettled(arr.map(async (item)=>{
    const newData = await readBlock(tagInfo, item.k) || [0,0,0,0]
    item.v.forEach((it,k)=>{
      if(it !== null){
        newData[k] = it
      }
    })
    await writeBlock(tagInfo,item.k, newData)
  }))
}
/***
 * 分快
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array) || size <= 0) return [];

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
/**
 * 读取NFCV回调
 * @param error
 * @param tagInfo
 */
async function readerModeCb(error : BusinessError, tagInfo : tag.TagInfo) {
  if (!error) {
    try {
      await connect(tagInfo)
      await writeBlockAnyByIndex(tagInfo,15, [0x33])
      const blocks = await readAllBlocks(tagInfo)
      const rows = blocks?.raw?.map(e=>e.toString(16).padStart(2,'0').toUpperCase())

      hilog.info(0xff00, 'testTagSuccess', JSON.stringify(rows));
	    notifyPage({ action: "nfcData", data: blocks?.raw});
    }catch (error) {
      hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+error.code+"message:"+error.message);
    }
  } else {
    hilog.info(0x0000, 'testTag', 'readerModeCb readerModeCb errCode: ' + error.code + ', errMessage: ' + error.message);
  }
}
export default class EntryAbility extends UniEntryAbilityDev {
	constructor() {
	  super("HBuilder", {
	    debug: BuildProfile.DEBUG,
	  });
	}
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      hilog.error(DOMAIN, 'testTag', 'Failed to set colorMode. Cause: %{public}s', JSON.stringify(err));
    }
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onCreate');

    // 判断设备是否支持NFC能力
    if (!canIUse("SystemCapability.Communication.NFC.Core")) {
      hilog.error(0x0000, 'testTag', 'nfc unavailable.');
      return;
    }
    let tagInfo : tag.TagInfo | null = null;
    try {
      tagInfo = tag.getTagInfo(want);
    } catch (error) {
      console.error("tag.getTagInfo catch error: " + error);
    }
    if (tagInfo == null) {
      console.error("no TagInfo to be created, ignore it.");
      return;
    }
    nfcTagElementName = {
      bundleName: want.bundleName = '',
      abilityName: want.abilityName = '',
      moduleName: want.moduleName,
    }
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageCreate');
    // windowStage.loadContent('pages/Index', (err) => {
    //   if (err.code) {
    //     hilog.error(DOMAIN, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
    //     return;
    //   }
    //   hilog.info(DOMAIN, 'testTag', 'Succeeded in loading the content.');
    // });
	super.onWindowStageCreate(windowStage)
	hmr.init();
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }
  onDidForeground(): void {

    // Ability has brought to foreground

    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onForeground');
    // Ability has brought to foreground
    if (nfcTagElementName != undefined) {
      // 调用tag模块中前台优先的接口，使能前台应用程序优先处理所发现的NFC标签功能
      // let techList : number[] = [tag.NFC_A, tag.NFC_B, tag.NFC_F, tag.NFC_V];
      let techList : number[] = [
        tag.NFC_V,
        // tag.NDEF_FORMATABLE,
      ];
      try {
        tag.on('readerMode', {
          bundleName: 'uni.app.UNI825C393',// 包名称
          abilityName:  'EntryAbility',// 入口固定不修改
          moduleName: 'entry',// 入口固定不修改
        }, techList, readerModeCb);
        foregroundRegister = true;
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'on readerMode errCode1: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
      }
    }
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onBackground');
    // 退出应用程序NFC标签页面时，调用tag模块退出前台优先功能
    if (foregroundRegister) {
      foregroundRegister = false;
      try {
        tag.off('readerMode', nfcTagElementName);
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'on readerMode errCode2: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
      }
    }
  }
}
```

### 鸿蒙(harmonyos)系统NFC读取数据,NFCV模式读取

```ts
import { AbilityConstant, ConfigurationConstant, UIAbility, Want,bundleManager} from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { tag } from '@kit.ConnectivityKit';
import { BusinessError } from '@kit.BasicServicesKit';

const DOMAIN = 0x0000;
let nfcTagElementName: bundleManager.ElementName;
let foregroundRegister: boolean;
/**
获取系统信息
 */
async function getSystemInfo(nfcv:tag.NfcVTag, uid:number[]) {
  let cmd = [
    0x22,  // flags
    0x2B,  // Get System Info
    ...uid
  ];

  let resp = await nfcv.transmit(cmd);
  return resp;
}
interface NfcReadResult {
  raw: number[];
  blockSize: number;
  blockCount: number;
}
/**
 * 读取所有块
 * @param tagInfo
 * @returns
 */
export async function readAllBlocks(tagInfo: tag.TagInfo) {
  try {
    const nfcv = tag.getNfcV(tagInfo);

    // -------- 必须倒序 UID --------
    const uid = tagInfo.uid; // 关键点！！

    // -------- Step 1: Get System Info (0x2B) --------
    const sysCmd = [
      0x22,      // flags（需要地址模式）
      0x2B,      // Get System Info
      ...uid
    ];

    const sys = await nfcv.transmit(sysCmd);

    /**
     * 系统信息格式（ISO15693）
     * sys[0] = flags
     * sys[1~8] = UID
     * sys[9] = DSFID（可能有）
     * sys[10] = AFI（可能有）
     * sys[11] = Memory Info Flags
     * sys[12] = block count - 1
     * sys[13] = block size - 1
     */

    const memoryInfoIndex = 12; // 大部分标签从12开始是 Memory Info
    const blockCount = sys[memoryInfoIndex] + 1;    // 块数量
    const blockSize = sys[memoryInfoIndex + 1] + 1; // 每块字节数

    hilog.info(0x0000, "readAllBlocks",
      `BlockSize: ${blockSize}   BlockCount: ${blockCount}`
    );

    // ---------- Step 2: 分批读取所有块 ----------
    const maxBlocksPerRead = 32; // 一次最多读 32 块（兼容大部分标签）
    const allData = new Uint8Array(blockCount * blockSize);
    let offsetBlock = 0;

    while (offsetBlock < blockCount) {
      const readCount = Math.min(maxBlocksPerRead, blockCount - offsetBlock);

      const cmd = [
        0x22,             // flags
        0x23,             // Read Multiple Blocks
        ...uid,
        offsetBlock,      // first block
        readCount - 1     // number of blocks - 1
      ];

      const resp = await nfcv.transmit(cmd);

      // resp[0] = flags, resp[1..N] = 数据
      const payload = resp.slice(1);

      if (payload.length !== readCount * blockSize) {
        hilog.error(0x0000, "readAllBlocks", `块长度异常，读取失败`);
        return null;
      }

      allData.set(payload, offsetBlock * blockSize);
      offsetBlock += readCount;
    }

    // ---------- Step 3: 返回完整数据 ----------
    const result: NfcReadResult = {
      raw: [...allData],
      blockSize,
      blockCount
    };

    return result;

  } catch (error) {
    hilog.error(
      0x0000,
      "readAllBlocks",
      `读取失败: code=${error.code}, msg=${error.message}`
    );
    return null;
  }
}


interface NfcVInfo {
  manufacturer: string | null;          // 制造商
  uid: string | null;                   // UID（16进制字符串）
  totalCapacity: number | null;         // 存储容器容量（字节）
  techList: string[] | null;            // 技术列表
  systemFileLength: number | null;      // 系统文件长度（字节）
  storageFormatID: number | null;       // DSFID
  afi: number | null;                    // AFI
  totalBlockCount: number | null;       // 总区块数
  blockSize: number | null;             // 每个区块字节数
  icReference: number | null;           // IC参考
}
/**
 * 获取制造商
 * @param uidArray
 * @returns
 */
function getManufacturer(uidArray: number[]): string {
  const manufacturerId = uidArray[1];

  switch (manufacturerId) {
    case 0x02:
    case 0x07:
      return 'STMicroelectronics';
    case 0x04:
      return 'Texas Instruments';
    case 0xE0:
      return 'NXP';
    case 0x01:
      return 'Motorola';
    case 0x03:
      return 'Hitachi';
    default:
      return 'Unknown';
  }
}
/**
 * 获取NFCV模式的所有信息
 * @param tagInfo
 * @returns
 */
export async function getNfcVTagInfo(tagInfo:tag.TagInfo): Promise<NfcVInfo> {
  const nfcv = tag.getNfcV(tagInfo);

  // 默认返回 null
  const result: NfcVInfo = {
    manufacturer: null,
    uid: null,
    totalCapacity: null,
    techList: null,
    systemFileLength: null,
    storageFormatID: null,
    afi: null,
    totalBlockCount: null,
    blockSize: null,
    icReference: null,
  };

  try {
    // UID
    const uidArray: number[] = tagInfo.uid ?? [];
    if (uidArray.length === 8) {
      result.uid = uidArray.reverse().map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      // 制造商
      // UID[1] => manufacturer
      result.manufacturer = getManufacturer(uidArray);
    }

    // 技术列表
    result.techList = ['NFC-V'];

    // Get System Info 指令
    const cmd = [0x22, 0x2B, ...tagInfo.uid.reverse()];

    const resp = await nfcv.transmit(cmd);

    if (resp && resp.length >= 15) {
      // DSFID
      result.storageFormatID = resp[10] ?? null;
      result.afi = resp[11] ?? null;
      // Block Size & Count
      const blockSize = (resp[12] ?? null) !== null ? resp[12] + 1 : null;
      const blockCount = (resp[13] ?? null) !== null ? resp[13] + 1 : null;

      result.blockSize = blockSize;
      result.totalBlockCount = blockCount;
      result.totalCapacity = blockSize && blockCount ? blockSize * blockCount : null;

      // 系统文件长度（通常等于总容量）
      result.systemFileLength = result.totalCapacity;

      // IC Reference
      result.icReference = resp[14] ?? null;
    }
  } catch (e) {
    hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+e.code+"message:"+e.message);
  }
  return result;
}
/**
 * 连接NCFV
 * @param tagInfo
 * @returns
 */
async function connect( tagInfo : tag.TagInfo){
  // 获取特定技术类型的NFC标签对象
  if (tagInfo == null || tagInfo == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb tagInfo is invalid');
    return;
  }
  if (tagInfo.uid == null || tagInfo.uid == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb uid is invalid');
    return;
  }
  if (tagInfo.technology == null || tagInfo.technology == undefined || tagInfo.technology.length == 0) {
    hilog.error(0x0000, 'testTag', 'readerModeCb technology is invalid');
    return;
  }

  // 执行读写接口完成标签数据的读取或写入数据到标签
  // use the IsoDep technology to access this nfc tag.
  let isNfcv : tag.NfcVTag | null = null;
  for (let i = 0; i < tagInfo.technology.length; i++) {
    if (tagInfo.technology[i] == tag.NFC_V) {
      try {
        isNfcv = tag.getNfcV(tagInfo);
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'readerModeCb getIsoDep errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
        return;
      }
    }
    // use other technology to access this nfc tag if necessary.
  }
  if (isNfcv == undefined) {
    hilog.error(0x0000, 'testTag', 'readerModeCb getIsoDep is invalid');
    return;
  }

  // connect to this nfc tag using IsoDep technology.
  try {
    isNfcv.connect();
  } catch (error) {
    hilog.error(0x0000, 'testTag', 'readerModeCb isoDep.connect errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
    return;
  }
  if (!isNfcv.isConnected()) {
    hilog.error(0x0000, 'testTag', 'readerModeCb isoDep.isConnected() false.');
    return;
  }
  return isNfcv
}
/**
 * 读取指定块
 * @param tagInfo
 * @param blockIndex
 * @returns
 */
export async function readBlock(
  tagInfo: tag.TagInfo,
  blockIndex: number
){
  try {
    const nfcv = tag.getNfcV(tagInfo);

    // -------- UID 必须倒序 --------
    const uid = tagInfo.uid;

    // -------- 构造命令 0x20 Read Single Block --------
    const cmd = [
      0x22,       // flags（addressed）
      0x20,       // Read Single Block
      ...uid,
      blockIndex  // 块下标
    ];

    const resp = await nfcv.transmit(cmd);

    // resp[0] = flags，resp[1..N] = 数据
    if (resp && resp.length > 1) {
      return resp.slice(1); // 返回纯数据
    } else {
      hilog.error(0x0000, "readBlock", `读取块失败: resp=${resp}`);
      return null;
    }

  } catch (error) {
    hilog.error(
      0x0000,
      "readBlock",
      `读取 NFC-V 块失败: code=${error.code}, msg=${error.message}`
    );
    return null;
  }
}
/**
 * 写入指定块
 * @param tagInfo
 * @param blockIndex
 * @param data
 * @returns
 */
async function writeBlock(tagInfo:tag.TagInfo, blockIndex: number, data: number[]) {
  try {
    const nfcv = tag.getNfcV(tagInfo);
    const cmd = [0x22, 0x21, ...tagInfo.uid,blockIndex, ...data];
    const resp = await nfcv.transmit(cmd);
    if (resp && resp[0] === 0x00) {
      return resp;
    } else {
      hilog.error(
        0x0000,
        'writeSingleBlock',
        `写入失败: resp=${resp ? Array.from(resp).map(b => b.toString(16)) : 'null'}`
      );
      return null;
    }
  }catch (error) {
    hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+error.code+"message:"+error.message);
    return
  }
}
interface KVPair {
  k: number;
  v: (number|null)[];   // 根据实际类型改，比如 string/number/Uint8Array 等
}
/**
 * 通过索引写入指定数据,可以批量连续写入
 * @param tagInfo
 * @param blockIndex
 * @param data
 */
async function writeBlockAnyByIndex(tagInfo:tag.TagInfo, blockIndex: number, data: number[]) {
  const info = await getNfcVTagInfo(tagInfo)
  const map = new Map<number,number>();
  data.forEach((v, k) => {
    map.set(blockIndex + k, v);
  });
  const block = info.totalBlockCount || 0;
  const maxBlock = info.totalCapacity || 0;
  const arr = chunk(
    new Array(maxBlock).fill(null).map((e:null, k) => map.get(k) || null),
    block
  )
    .map((v, k):KVPair => {
      return  {
        k,
        v,
      }
    })
    .filter((e) => e.v.find((e) => e !== null));
  await Promise.allSettled(arr.map(async (item)=>{
    const newData = await readBlock(tagInfo, item.k) || [0,0,0,0]
    item.v.forEach((it,k)=>{
      if(it !== null){
        newData[k] = it
      }
    })
    await writeBlock(tagInfo,item.k, newData)
  }))
}
/***
 * 分快
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array) || size <= 0) return [];

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
/**
 * 读取NFCV回调
 * @param error
 * @param tagInfo
 */
async function readerModeCb(error : BusinessError, tagInfo : tag.TagInfo) {
  if (!error) {
    try {
      await connect(tagInfo)
      await writeBlockAnyByIndex(tagInfo,15, [0x33])
      const blocks = await readAllBlocks(tagInfo)
      const rows = blocks?.raw?.map(e=>e.toString(16).padStart(2,'0').toUpperCase())

      hilog.info(0x0000, 'testTag', 'success');
    }catch (error) {
      hilog.error(0x0000, 'testTag', '读取 NFC-V 系统信息失败: code:'+error.code+"message:"+error.message);
    }
  } else {
    hilog.info(0x0000, 'testTag', 'readerModeCb readerModeCb errCode: ' + error.code + ', errMessage: ' + error.message);
  }
}
export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      hilog.error(DOMAIN, 'testTag', 'Failed to set colorMode. Cause: %{public}s', JSON.stringify(err));
    }
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onCreate');

    // 判断设备是否支持NFC能力
    if (!canIUse("SystemCapability.Communication.NFC.Core")) {
      hilog.error(0x0000, 'testTag', 'nfc unavailable.');
      return;
    }
    let tagInfo : tag.TagInfo | null = null;
    try {
      tagInfo = tag.getTagInfo(want);
    } catch (error) {
      console.error("tag.getTagInfo catch error: " + error);
    }
    if (tagInfo == null) {
      console.error("no TagInfo to be created, ignore it.");
      return;
    }
    nfcTagElementName = {
      bundleName: want.bundleName = '',
      abilityName: want.abilityName = '',
      moduleName: want.moduleName,
    }
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(DOMAIN, 'testTag', 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }
  onDidForeground(): void {

    // Ability has brought to foreground

    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onForeground');
    // Ability has brought to foreground
    if (nfcTagElementName != undefined) {
      // 调用tag模块中前台优先的接口，使能前台应用程序优先处理所发现的NFC标签功能
      // let techList : number[] = [tag.NFC_A, tag.NFC_B, tag.NFC_F, tag.NFC_V];
      let techList : number[] = [
        tag.NFC_V,
        // tag.NDEF_FORMATABLE,
      ];
      try {
        tag.on('readerMode', {
          bundleName: 'com.example.myapplication',
          abilityName:  'EntryAbility',
          moduleName: 'entry',
        }, techList, readerModeCb);
        foregroundRegister = true;
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'on readerMode errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
      }
    }
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onBackground');
    // 退出应用程序NFC标签页面时，调用tag模块退出前台优先功能
    if (foregroundRegister) {
      foregroundRegister = false;
      try {
        tag.off('readerMode', nfcTagElementName);
      } catch (error) {
        hilog.error(0x0000, 'testTag', 'on readerMode errCode: ' + (error as BusinessError).code + ', errMessage: ' + (error as BusinessError).message);
      }
    }
  }
}

```

### nodejs 原生ssh 密码连接

```ts
import { spawnSync } from 'child_process';

const user = 'root';
const host = '127.0.0.1';
const password = '123456,,';
const command = 'ls -al /';

spawnSync(
    'expect',
    [
        '-c',
        `
spawn ssh ${user}@${host} "${command}"
expect "password:"
send "${password}\\r"
interact
`,
    ],
    { stdio: 'inherit' }
);

```

### shell脚本命令参数

```sh
case "$1" in
  zipdist)
    shift
    zys_zipdist "$@"
    ;;
  help|"")
    echo "zys 工具箱"
    echo "用法:"
    echo "  zys zipdist [-p 路径] [-n 文件名]"
    ;;
  *)
    echo "❌ 未知命令: $1"
    echo "使用: zys help"
    ;;
esac
```

### markdown解析成json,转treejson数据

```sh
import { readFileSync } from "fs";
import markdownIt from "markdown-it";
const content = readFileSync("blog.md", "utf-8");
const md = markdownIt();
const tokens = md.parse(content, {});
function tokensToTree(tokens) {
  const root = { level: 0, children: [] };
  const stack = [root];

  let currentHeading = null;

  const tagToLevel = {
    h1: 1,
    h2: 2,
    h3: 3,
    h4: 4,
    h5: 5,
    h6: 6,
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // ① 捕获 heading_open：开始一个标题
    if (t.type === "heading_open") {
      const level = tagToLevel[t.tag];
      const heading = {
        ...t,
        type: "heading",
        level,
        content: "",
        children: [],
      };
      currentHeading = heading;
      continue;
    }

    // ② 捕获 inline（标题文本）
    if (t.type === "inline" && currentHeading) {
      currentHeading.content = t.content;
      continue;
    }

    // ③ heading_close：结束标题 → 把标题放入树
    if (t.type === "heading_close" && currentHeading) {
      const level = currentHeading.level;

      // 栈弹到正确父节点
      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // 追加到父节点
      stack[stack.length - 1].children.push(currentHeading);

      // 标题入栈
      stack.push(currentHeading);

      // 重置
      currentHeading = null;
      continue;
    }

    // ④ 普通内容 token → 挂在当前最近标题下
    const parent = stack[stack.length - 1];
    parent.children.push(t);
  }

  return root.children;
}
const tokensTree = tokensToTree(tokens);
console.log(tokensTree);

```

### zipdist

```sh
# 默认值
  PATH_TO_ZIP="./dist"
  ZIP_NAME="dist.zip"

  # 读取参数
  while [[ $# -gt 0 ]]; do
      case "$1" in
          -p)
              PATH_TO_ZIP="$2"
              shift 2
              ;;
          -n)
              ZIP_NAME="$2"
              shift 2
              ;;
          *)
              ZIP_NAME="$1"
              shift 1
              ;;
      esac
  done

  # 自动补 .zip 后缀
  if [[ "$ZIP_NAME" != *.zip ]]; then
      ZIP_NAME="${ZIP_NAME}.zip"
  fi

  # 检查目录
  if [ ! -d "$PATH_TO_ZIP" ]; then
      echo "❌ 目录不存在: $PATH_TO_ZIP"
      exit 1
  fi

  # 压缩包最终输出位置 → 在被压缩目录中
  OUTPUT_ZIP="$PATH_TO_ZIP/$ZIP_NAME"

    echo "🗑️  删除所有zip压缩包: $PATH_TO_ZIP/*.zip"
    find "$PATH_TO_ZIP" -maxdepth 1 -type f -name "*.zip" -exec rm {} \;
  # 如果存在上一轮压缩包，删除它（避免重复打包）
  if [ -f "$OUTPUT_ZIP" ]; then
      echo "🗑️  删除旧的压缩包: $OUTPUT_ZIP"
      rm "$OUTPUT_ZIP"
  fi

  echo "📦 开始压缩目录: $PATH_TO_ZIP"
  echo "📁 输出文件: $OUTPUT_ZIP"

  # 进入父目录执行 zip，使排除路径更容易处理
  PARENT_DIR=$(dirname "$PATH_TO_ZIP")
  TARGET_NAME=$(basename "$PATH_TO_ZIP")

  cd "$PARENT_DIR"

  # 压缩并排除旧的 zip 文件
  zip -r "$OUTPUT_ZIP" "$TARGET_NAME" -x "$TARGET_NAME/$ZIP_NAME" >/dev/null

  if [ $? -ne 0 ]; then
      echo "❌ 压缩失败"
      exit 1
  fi

  # 返回原目录
  cd - >/dev/null
  echo "📋 复制压缩包到剪切板: $OUTPUT_ZIP"
  # 判断 OUTPUT_ZIP 是否为绝对路径
    if [[ "$OUTPUT_ZIP" != /* ]]; then
        # 不是绝对路径 → 转换成绝对路径
        OUTPUT_ZIP=$(cd "$(dirname "$OUTPUT_ZIP")" && pwd)/"$(basename "$OUTPUT_ZIP")"
    fi
  osascript -e 'tell application "Finder" to set the clipboard to (POSIX file "'"$OUTPUT_ZIP"'")'

  echo "✅ 完成: 压缩包已生成并复制到剪贴板"
  echo "📁 文件位置: $OUTPUT_ZIP"
```


### zip 快速压缩dist目录,并复制到剪切板

```sh
zip dist/铁塔后台.zip dist/* -r -X "*.zip"  
```

### macos 终端快速复制文件

~/.zshrc

```sh
copyfile() {
  osascript -e 'tell application "Finder" to set the clipboard to (POSIX file "'"$1"'")'
}
```


### luckysheet 工作簿动态加载处理

exportJson 数据为execl文件数据,通过xlsx库解析

```ts
window.luckysheet.create({
	data: exportJson.sheets.map((e, k) => {
		if(k === 0){
			return {
				...e,
				status: 1
			};
		};
		return { 
			...e,
			 celldata: [],
			 status: 0
		};
	}),
	hook: {
		sheetActivate(index) {
			const s = luckysheet.getluckysheetfile().find(x => String(x.index) === String(index));
			console.log(index, s);
			if (!s || s.isLoaded) return;
			if (exportJson.sheets[s.order]) {
				requestAnimationFrame(() => {
					setTimeout(() => {
						const data = JSON.parse(JSON.stringify(exportJson.sheets[s.order]));
						data.celldata.forEach(e => {
							luckysheet.setCellValue(e.r, e.c, e.v);
						});
						luckysheet.refresh();
						luckysheet.refreshFormula();
					});
				});
			};
		}
	}
})
```

### gitlab 部署sh脚本

```sh
source ~/.zshrc
clear
url=$(git remote get-url origin)
host=$(node -e "const a = '$url';console.log(a.replace(/^(http:\/\/[^\/]+)\/(.+)\.git$/g,'\$1'))")
repo=$(node -e "const a = '$url';console.log(a.replace(/^(http:\/\/[^\/]+)\/(.+)\.git$/g,'\$2'))")
json=$(cat package.json)
releases=$( x gl repo release  ls --repo "$repo" -j)
preRelease="$(node -e "const a =$releases; console.log(a[0].name)")"
mkdir -p test
cd test
npm init  -y
clear
npm version "$preRelease"
clear
version=$(npm version patch)
version=$(node -e "console.log(\"$version\".replace(/v/,''))")
cd ..
rm -rf test
ref=$(glola | fzf | awk '{print $2}')
description=$(cat updateChange.md)
x gl repo release create -r "$repo" --ref $ref  --description $description  "$version"
git push --tags


```

### gitlab 仓库扫描搜索

```ts
import Axios from "axios";
import { writeFileSync, existsSync } from "fs";
import cliProgress from "cli-progress";
import colors from "ansi-colors";
import d from "data-preprocessor";
import { minimatch } from "minimatch";
import pLimit from "p-limit";
import os from "os";
const cpus = os.cpus().length;
console.log(`当前系统CPUS:核(${colors.blue(cpus as unknown as string)})\n\n`);
const limit = pLimit(cpus);
const headers = {
  "Content-Type": "application/json",
  "PRIVATE-TOKEN": process.env.PRIVATE_TOKEN,
};
const axios = Axios.create({
  baseURL: process.env.BASE_URL,
  headers: headers,
});
async function runGetProjects(
  results = [],
  page = 1,
  per_page = 100,
  maxLimit = 12
) {
  const res = await Promise.all<any>(
    new Array(maxLimit).fill(0).map(async (_, k) => {
      return limit(async () => {
        const _page = page + k;
        const { data } = await axios({
          url: "/projects",
          method: "GET",
          params: {
            page: _page,
            per_page,
          },
        });
        const projects = data.map((e) => ({
          name: e.name,
          id: e.id,
          http_url_to_repo: e.http_url_to_repo,
          description: e.description,
          path_with_namespace: e.path_with_namespace,
        }));
        results.push(...projects);
        console.log(
          `线程(${k}) 当前页(${_page})  当前项目数量(${projects.length})  总数: (${results.length})`
        );
        return projects;
      });
    })
  );
  const isEmpty = res.find((e) => e.length === 0);
  if (isEmpty) {
    writeFileSync("./projects.json", JSON.stringify(results, null, 2));
    console.log(`Downloaded  Total: ${results.length}`);
    return results;
  } else {
    console.log(colors.blue("建议提高并发数"));
    return await runGetProjects(results, page + cpus, per_page);
  }
}
const cmds: CMDS = {
  "--getProjects": {
    message: "获取所有项目",
    async callback() {
      await runGetProjects();
    },
  },
  "--getFileContent": {
    message: "获取项目下的文件内容",
    async callback({ parames }) {
      const content = d.get("搜索内容参数必填", parames, "[0]");
      const path = d.get("搜索路径", parames, "[1]", "**");
      const run = d.get(parames, "[3]");
      if (["--run", "-r"].includes(run) || !existsSync("./projects.json")) {
        await runGetProjects();
      }
      const search = new RegExp(content, "img");
      const projects = (await import("./projects.json")).default.filter((e) =>
        [420].includes(e.id)
      );
      const projectsNum = projects.length;
      const b1 = new cliProgress.SingleBar({
        format:
          "总进度 |" +
          colors.cyan("{bar}") +
          "| {percentage}% || {value}/{total} 仓库数 \n",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        clearOnComplete: true,
      });
      b1.start(projectsNum, 0);
      const limit2 = pLimit(40);
      await Promise.all(
        projects.map(async (project) => {
          return limit2(async () => {
            const projectId = project.id;
            const { data: branches } = await axios({
              url: `/projects/${projectId}/repository/branches`,
              method: "GET",
              params: {
                per_page: 100,
              },
            });
            const b2 = new cliProgress.SingleBar({
              format:
                "分支进度(" +
                colors.cyan("{branchName}") +
                " )|" +
                colors.yellow("{bar}") +
                "| {percentage}% || {value}/{total} 分支数 \n",
              clearOnComplete: true,
            });
            b2.start(branches.length, 0);
            const limit3 =
              branches.length > 1
                ? pLimit(branches.length)
                : async (fn) => await fn();
            await Promise.all(
              branches.map(async (branch) => {
                return limit3(async () => {
                  const branchName = branch.name;
                  const limit4 = pLimit(5);
                  await (async function run(page = 1, per_page = 100) {
                    const res = await Promise.all(
                      new Array(cpus).fill(0).map(async (_, k) => {
                        const _page = page + k;
                        return limit4(async () => {
                          try {
                            const { data: tree } = await axios({
                              url: `/projects/${projectId}/repository/tree`,
                              method: "GET",
                              params: {
                                recursive: true,
                                ref: branchName,
                                per_page,
                                page: _page,
                              },
                            });
                            await Promise.all(
                              tree
                                .filter((e) => {
                                  return (
                                    e.type === "blob" && minimatch(e.path, path)
                                  );
                                })
                                .map(async (e) => {
                                  const { data } = await axios({
                                    url: `/projects/${projectId}/repository/files/${encodeURIComponent(
                                      e.path
                                    )}`,
                                    method: "GET",
                                    params: {
                                      ref: branchName,
                                    },
                                  });
                                  const content = Buffer.from(
                                    data.content,
                                    data.encoding
                                  ).toString();
                                  if (search.test(content)) {
                                    console.log(
                                      `=======[${project.name}](${
                                        project.description || "暂无!"
                                      })===>> [${colors.bgBlue(
                                        project.http_url_to_repo
                                      )}] <<=======`
                                    );
                                    console.log(
                                      colors.green(
                                        `\n
                       项目名称: ${project.name}
                       项目描述: ${project.description || "-"}
                       项目地址: ${project.http_url_to_repo}
                       分支: ${branchName}
                       文件: ${e.path}
                       \n`
                                          .split("\n")
                                          .map((e) => e.trim())
                                          .join("\n")
                                      )
                                    );
                                    console.log(
                                      colors.yellow("==============")
                                    );
                                  }
                                })
                            );
                            return tree;
                          } catch (error) {
                            return [];
                          }
                        });
                      })
                    );
                    if (!res.find((e) => e.length === 0)) {
                      return await run(page + cpus, per_page);
                    }
                  })();
                  b2.increment({
                    branchName,
                  });
                });
              })
            );

            b1.increment();
          });
        })
      );
    },
  },
};
/**
 * 获取管道数据
 * @param parames
 * @returns
 */
const getParames = async (parames: string[] = []) => {
  if (process.stdin.isTTY) {
    return parames.join("");
  } else {
    return new Promise((r, err) => {
      // 管道模式
      process.stdin.setEncoding("utf8");
      let input = "";
      process.stdin.on("data", (chunk) => {
        input += chunk;
      });
      process.stdin.on("end", async () => {
        r(input || parames.join(""));
      });
      process.stdin.on("err", async (errMsg) => {
        err(errMsg);
      });
    });
  }
};
type CMDCALLBACKARGS = {
  help(): ReturnType<CMDCALLBACK>;
  parames: any[];
};
type CMDCALLBACK = (options: CMDCALLBACKARGS) => any | Promise<any>;
type CMD = Partial<{
  [key: string]: CMDS | string | CMDCALLBACK;
  message: string;
  callback: CMDCALLBACK;
}>;
type CMDS = Record<string, CMD>;
(async function run([cmd, ...parames], cmds: CMDS) {
  const initHelp = {
    message: "查看帮助",
    callback({ help }) {
      help();
    },
  };
  cmds = {
    ...cmds,
    "--help": initHelp,
    "-h": initHelp,
  };
  const keys = Object.keys(cmds).map((e) => e.trim());
  const currentCmd = keys.find((e) => e === cmd);
  const currentCmdInfo = cmds[currentCmd];
  const help = async (isHelp = false) => {
    if (!isHelp && currentCmdInfo) {
      return;
    } else {
      const max = keys.reduce((a: number, b: string) => {
        return a > b.length ? a : b.length;
      }, 0);
      const helpInfo = [[], []];
      keys.map((k) => {
        if (["message", "callback"].includes(k)) {
          return;
        }
        const message = cmds[k]?.message ?? "";
        const log = `${k.padEnd(max, " ")}${"----"
          .padStart(10, " ")
          .padEnd(14, " ")}${message}`.trim();
        if (k.trim().startsWith("-")) {
          helpInfo[1].push(log);
        } else {
          helpInfo[0].push(log);
        }
      });
      console.log(
        `
        命令帮助
        ${helpInfo[0].length > 0 ? `Command:` : ""}
          ${helpInfo[0].map((e) => `\n${e}`).join("")}
        ${helpInfo[1].length > 0 ? `Options:` : ""}
          ${helpInfo[1].map((e) => `\n${e}`).join("")}
      `
          .split("")
          .filter((e) => Boolean(e.trim()))
          .map((e) => {
            return e.trim().replace(/^\n(?=\s*)/, "  ");
          })
          .join("")
      );
    }
  };
  if (currentCmdInfo) {
    const callback =
      typeof currentCmdInfo === "function"
        ? currentCmdInfo
        : typeof currentCmdInfo?.callback === "function"
        ? currentCmdInfo?.callback
        : null;
    if (callback) {
      return await callback({
        parames,
        help: async () => {
          await help(true);
        },
      });
    } else if (typeof currentCmdInfo === "object") {
      return await run(parames, currentCmdInfo || ({} as any));
    } else {
      return await help();
    }
  } else {
    return await help();
  }
})(process.argv.slice(2), cmds);


```

### gitlab 导出所有项目

```ts
import axios from "axios";
import { writeFileSync } from "fs";
(async function run(results = [], page = 1, per_page = 100) {
  console.log(page);
  const { data } = await axios({
    baseURL: process.env.BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "PRIVATE-TOKEN": process.env.PRIVATE_TOKEN,
    },
    url: "/projects",
    method: "GET",
    params: {
      page,
      per_page,
    },
  });
  const projects = data.map((e) => ({
    name: e.name,
    id: e.id,
    http_url_to_repo: e.http_url_to_repo,
    description: e.description,
    path_with_namespace: e.path_with_namespace,
  }));
  console.log(
    `page: ${page}, projects.length: ${projects.length} results.length: ${results.length}`
  );
  results.push(...projects);
  if (projects.length === per_page) {
    return await run(results, page + 1);
  } else {
    writeFileSync("./projects.json", JSON.stringify(results, null, 2));
    console.log(`Downloaded  Total: ${results.length}`);
    return results;
  }
})();

```

### clash 扩展脚本

```
// Define main function (script entry)

function main(config, profileName) {
  config.rules = ["DOMAIN-KEYWORD,qq.com,🔰 节点选择"].concat(config.rules)
  return config;
}

```

### 百度翻译api翻译

```ts
import { get } from "lodash";
import Express from "express";
import Puppeteer from "puppeteer";

const browser = Puppeteer.launch({
  headless: "shell",
  args: [
    "--window-size=1920,1080",
    "--window-position=-1920,100", // 👈 副屏的坐标
    "--start-fullscreen",
  ],
  userDataDir: "/Users/zhangyunshan/fanyi/.puppeteer",
  defaultViewport: null,
  devtools: true,
});
const getRes = async (text: string, lang?: string) => {
  return new Promise<string>((resolve, reject) => {
    try {
      (async function () {
        const page = await (await browser).newPage();
        await page.goto(
          `https://fanyi.baidu.com/mtpe-individual/transText?query=${encodeURIComponent(text)}&lang=${lang}`,
        );
        await page.exposeFunction("log", console.log);
        await page.on("response", async (e) => {
          if (e.url().includes("translate")) {
            const req = await e.request();
            const res = await fetch(e.url(), {
              method: await req.method(),
              headers: await req.headers(),
              body: await req.fetchPostData(),
            }).then((res) => res.text());
            resolve(res);
            await page.close();
          }
        });
      })();
    } catch (error) {
      reject(error);
      console.error(error);
    }
  });
};

const app = Express();
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use("/", async (req, res) => {
  const text = get(req, "body.text", get(req, "query.text", ""));
  const target_lang = get(
    req,
    "body.target_lang",
    get(req, "query.target_lang", ""),
  );
  const source_lang = get(
    req,
    "body.source_lang",
    get(req, "query.source_lang", ""),
  );
  if (!text) {
    return res.status(400).send("No text provided");
  }
  const startTime = Date.now();
  const endTime = Date.now();
  const a: any = await getRes(text, `${source_lang}2${target_lang}`);

  // Parse SSE data
  const events = [];
  const lines = a.split("\n");
  let currentEvent = { event: "", data: "", id: "" };
  for (const line of lines) {
    if (line.startsWith("data:")) {
      currentEvent.data += line.slice(5).trim();
    } else if (line.startsWith("event:")) {
      currentEvent.event = line.slice(6).trim();
    } else if (line.startsWith("id:")) {
      currentEvent.id = line.slice(3).trim();
    } else if (line.trim() === "") {
      // Empty line marks end of event
      if (currentEvent.data) {
        // Try to parse data as JSON
        try {
          currentEvent.data = JSON.parse(currentEvent.data);
        } catch (e) {
          // Keep as string if not valid JSON
        }
        events.push({ ...currentEvent });
        currentEvent = { event: "", data: "", id: "" };
      }
    }
  }
  // Handle last event if no trailing newline
  if (currentEvent.data) {
    try {
      currentEvent.data = JSON.parse(currentEvent.data);
    } catch (e) {
      // Keep as string if not valid JSON
    }
    events.push(currentEvent);
  }
  console.log("Parsed SSE events:", events);
  // Extract dst fields from translation results
  const translations = events
    .map((e: any) => e.data)
    .filter((data) => data && data.data && data.data.list)
    .flatMap((data) => data.data.list.map((item: any) => item.dst));
  console.log("Translations (dst fields):", translations);
  console.log("Combined translation:", translations.join(" "));
  const sseDataObject = events
    .filter((e: any) => e.data.errno === 0)
    .map((item: any) => item.data.data)
    .reduce((prev, cur) => {
      switch (cur.event) {
        case "GetDictSucceed":
          prev.dict = cur.dictResult;
          break;
        case "GetPhoneticSucceed":
          prev.phonetic = cur.phonetic;
          break;
        case "Translating":
          prev.translating = cur.list;
          break;
        case "GetSentSucceed":
          prev.sent = cur.sentResult;
          break;
        case "GetKeywordsSucceed":
          prev.keywords = cur.keywords;
          break;
        default:
          break;
      }
      return prev;
    }, {});
  res.json({
    code: 0,
    translateResult: [
      [
        {
          src: text,
          srcPronounce: get(sseDataObject, "phonetic", [])
            .map((item: any) => item.items)
            .reduce((prev: any, cur: any) => prev.concat(cur), []),
          tgt: `${get(sseDataObject, "translating", [])
            .map((item: any) => item.dst)
            .join("")}`,
          keywords: get(sseDataObject, "keywords", []),
        },
      ],
    ],
    type: "zh-CHS2en",
  });
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

```

### 百度翻译sse

```ts
import { createRoute } from "@wisdom-serve/serve";
import { controller as ControllerType } from "@wisdom-serve/serve/types/type";
import { get } from "lodash";
import { launch } from "puppeteer";
import d from "data-preprocessor";
process.on("unhandledRejection", (reason, p) => {
  console.warn("⚠️ 未捕获的 Promise 拒绝:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 未捕获异常:", err);
});
const sseParser = async (data) => {
  return data
    .split(/\n\n/)
    .filter(Boolean)
    .map((item) => {
      const lines = item.split("\n");
      const event = lines?.[0]?.match?.(/event: (.*)/)?.[1];
      const data = lines?.[1]?.match?.(/data: (.*)/)?.[1];
      return { event, data: JSON.parse(data || "{}") };
    });
};
const controller = async function (...arg) {
  await d.get("内容不能为空", this.$body, "query");
  await d.get("源语言不能为空", this.$body, "from", "en");
  await d.get("目标语言不能为空", this.$body, "to", "zh");
  const browser = await launch({
    timeout: 0,
    headless: "new",
  });
  const page = await browser.newPage();
  try {
    const url = `https://fanyi.baidu.com/mtpe-individual/transText?query=${encodeURIComponent(
      this.$body.query
    )}&lang=${this.$body.from}2${this.$body.to}#/`;
    const data = await new Promise((resolve, reject) => {
      page.on("error", async (error) => {
        await page.close();
        await browser.close();
        reject(error);
      });
      page.on("response", async (response) => {
        if (/\/translate/.test(response.url())) {
          try {
            const data = await response.buffer();
            await page.close();
            await browser.close();
            resolve(data);
          } catch (error) {
            console.log(error.message, 333);
            resolve(true);
          }
        }
      });
      page.goto(url);
    });
    if (data === true) {
      await page.close();
      await browser.close();
      await (controller as any).call(this, ...arg);
      return;
    }
    const sseData = await sseParser(data.toString());
    const sseDataObject = sseData
      .filter((e) => e.data.errno === 0)
      .map((item) => item.data.data)
      .reduce((prev, cur) => {
        console.log(cur);
        switch (cur.event) {
          case "GetDictSucceed":
            prev.dict = cur.dictResult;
            break;
          case "GetPhoneticSucceed":
            prev.phonetic = cur.phonetic;
            break;
          case "Translating":
            prev.translating = cur.list;
            break;
          case "GetSentSucceed":
            prev.sent = cur.sentResult;
            break;
          case "GetKeywordsSucceed":
            prev.keywords = cur.keywords;
            break;
          default:
            break;
        }
        return prev;
      }, {});
    this.$success({
      pinyin: get(sseDataObject, "phonetic", [])
        .map((item) => item.items)
        .reduce((prev, cur) => prev.concat(cur), []),
      dst: `${get(sseDataObject, "translating", [])
        .map((item) => item.dst)
        .join("")}`,
      keywords: get(sseDataObject, "keywords", []),
    });
  } catch (error) {
    await page.close();
    await browser.close();
    this.$error({
      message: error.message,
    });
  }
} as ControllerType;
export default createRoute({
  routes: [
    {
      path: "/test",
      controller,
    },
  ],
});

```


### myinput

```vue
<template>
    <div class='myInput'>
        <div class="abs-r b-1px b-solid b-#e8e8e8 b-rd-40px  abs-content transition-all p-4px" :class="{
            // 'b-#7099ed!': focused
        }">
            <input ref="input" class="b-0! w-100% lh-40px b-rd-40px of-hidden outline-none focus:outline-none"
                v-model="modelValue"></input>
            <div class="abs-content flex-center-start  pointer-events-none text-#999 transition-all" :class="{
                'tr-y--50%': focused || !isShowPlaceholder
            }">
                <span class="transition-all p-x-10px b-rd-5px " :class="{
                    'bg-#e8e8e8 text-#7099ed bg-op-50 text-12px': focused || !isShowPlaceholder
                }">{{ currentPlaceholder }}</span>
            </div>
            <div class="abs transition-all w-0 h-2px left-50% tr-x--50% bottom-0px b-rd-4px of-hidden bg-#f00 pointer-events-none"
                :class="{
                    'w-[calc(100%-28px)]!': focused
                }"></div>
        </div>
    </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue?: any
    placeholder?: any
}>(), {
    modelValue: '',
    placeholder: '请输入'
})
const emit = defineEmits(["update:modelValue"])
const { modelValue } = useVModels(props, emit)
const isShowPlaceholder = computed(() => !(modelValue.value?.length > 0))
const input = ref()
const { focused } = useFocus(input)
const currentPlaceholder = computed(() => focused.value || !isShowPlaceholder.value ? (props.placeholder?.replace?.(/^(请*(输入|选择))(.*)/, '$3') || '请输入') : props.placeholder)
</script>
<style scoped lang="less">
.myInput {}
</style>
```

### zsh 搜索bolg.md

```bash
#!/bin/bash

# 下载 blog.md（如果不存在）
if [[ ! -f 'blog.md' ]]; then
    curl -o blog.md https://raw.githubusercontent.com/zys8119/Blog/refs/heads/master/README.md
fi

title=$(cat blog.md | tsx a.ts --mdTitle | fzf)

echo $title

cat blog.md | tsx a.ts --md "$title"
```

a.ts

```ts
function markdownToFlatTree(md) {
  const lines = md.split(/\r?\n/);
  const result = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      // 遇到新标题，先把上一个存入结果
      if (current) result.push(current);
      current = {
        title: `${heading[1]} ${heading[2].trim()}`,
        value: "",
      };
    } else {
      // 普通内容追加到当前标题
      if (current) {
        // 保留换行，便于格式化
        current.value += (current.value ? "\n" : "") + line;
      }
    }
  }

  // 最后一个标题也要推入
  if (current) result.push(current);
  return result;
}
const cmds: CMDS = {
  "--mdTitle": {
    message: "解析md大纲",
    async callback({ parames }) {
      const content = (await getParames(parames)) as string;
      const contentTree = markdownToFlatTree(content);
      console.log(contentTree.map((e) => e.title).join("\n"));
    },
  },
  "--md": {
    message: "解析Md",
    async callback({ parames }) {
      const content = (await getParames(parames)) as string;
      const contentTree = markdownToFlatTree(content);
      const data = contentTree.find((e) => {
        return parames[0] === e.title;
      });
      console.log(data?.value);
    },
  },
};
/**
 * 获取管道数据
 * @param parames
 * @returns
 */
const getParames = async (parames: string[] = []) => {
  if (process.stdin.isTTY) {
    return parames.join("");
  } else {
    return new Promise((r, err) => {
      // 管道模式
      process.stdin.setEncoding("utf8");
      let input = "";
      process.stdin.on("data", (chunk) => {
        input += chunk;
      });
      process.stdin.on("end", async () => {
        r(input || parames.join(""));
      });
      process.stdin.on("err", async (errMsg) => {
        err(errMsg);
      });
    });
  }
};
type CMDCALLBACKARGS = {
  help(): ReturnType<CMDCALLBACK>;
  parames: any[];
};
type CMDCALLBACK = (options: CMDCALLBACKARGS) => any | Promise<any>;
type CMD = Partial<{
  [key: string]: CMDS | string | CMDCALLBACK;
  message: string;
  callback: CMDCALLBACK;
}>;
type CMDS = Record<string, CMD>;
(async function run([cmd, ...parames], cmds: CMDS) {
  const initHelp = {
    message: "查看帮助",
    callback({ help }) {
      help();
    },
  };
  cmds = {
    ...cmds,
    "--help": initHelp,
    "-h": initHelp,
  };
  const keys = Object.keys(cmds).map((e) => e.trim());
  const currentCmd = keys.find((e) => e === cmd);
  const currentCmdInfo = cmds[currentCmd];
  const help = async (isHelp = false) => {
    if (!isHelp && currentCmdInfo) {
      return;
    } else {
      const max = keys.reduce((a: number, b: string) => {
        return a > b.length ? a : b.length;
      }, 0);
      const helpInfo = [[], []];
      keys.map((k) => {
        if (["message", "callback"].includes(k)) {
          return;
        }
        const message = cmds[k]?.message ?? "";
        const log = `${k.padEnd(max, " ")}${"----"
          .padStart(10, " ")
          .padEnd(14, " ")}${message}`.trim();
        if (k.trim().startsWith("-")) {
          helpInfo[1].push(log);
        } else {
          helpInfo[0].push(log);
        }
      });
      console.log(
        `
        命令帮助
        ${helpInfo[0].length > 0 ? `Command:` : ""}
          ${helpInfo[0].map((e) => `\\n${e}`).join("\n")}
        ${helpInfo[1].length > 0 ? `Options:` : ""}
          ${helpInfo[1].map((e) => `\\n${e}`).join("\n")}
      `
          .split("\n")
          .filter((e) => Boolean(e.trim()))
          .map((e) => {
            return e.trim().replace(/^\\n(?=\s*)/, "  ");
          })
          .join("\n")
      );
    }
  };
  if (currentCmdInfo) {
    const callback =
      typeof currentCmdInfo === "function"
        ? currentCmdInfo
        : typeof currentCmdInfo?.callback === "function"
        ? currentCmdInfo?.callback
        : null;
    if (callback) {
      return await callback({
        parames,
        help: async () => {
          await help(true);
        },
      });
    } else if (typeof currentCmdInfo === "object") {
      return await run(parames, currentCmdInfo || ({} as any));
    } else {
      return await help();
    }
  } else {
    return await help();
  }
})(process.argv.slice(2), cmds);

```

###  nodejs 轻量cli命令定义

```ts
const cmds: CMDS = {
  "--md": {
    message: "解析Md",
    async callback({ parames }) {
      const content = await getParames(parames);
      console.log(content);
    },
  },
};
/**
 * 获取管道数据
 * @param parames
 * @returns
 */
const getParames = async (parames: string[] = []) => {
  if (process.stdin.isTTY) {
    return parames.join("");
  } else {
    return new Promise((r, err) => {
      // 管道模式
      process.stdin.setEncoding("utf8");
      let input = "";
      process.stdin.on("data", (chunk) => {
        input += chunk;
      });
      process.stdin.on("end", async () => {
        r(input || parames.join(""));
      });
      process.stdin.on("err", async (errMsg) => {
        err(errMsg);
      });
    });
  }
};
type CMDCALLBACKARGS = {
  help(): ReturnType<CMDCALLBACK>;
  parames: any[];
};
type CMDCALLBACK = (options: CMDCALLBACKARGS) => any | Promise<any>;
type CMD = Partial<{
  [key: string]: CMDS | string | CMDCALLBACK;
  message: string;
  callback: CMDCALLBACK;
}>;
type CMDS = Record<string, CMD>;
(async function run([cmd, ...parames], cmds: CMDS) {
  const initHelp = {
    message: "查看帮助",
    callback({ help }) {
      help();
    },
  };
  cmds = {
    ...cmds,
    "--help": initHelp,
    "-h": initHelp,
  };
  const keys = Object.keys(cmds).map((e) => e.trim());
  const currentCmd = keys.find((e) => e === cmd);
  const currentCmdInfo = cmds[currentCmd];
  const help = async (isHelp = false) => {
    if (!isHelp && currentCmdInfo) {
      return;
    } else {
      const max = keys.reduce((a: number, b: string) => {
        return a > b.length ? a : b.length;
      }, 0);
      const helpInfo = [[], []];
      keys.map((k) => {
        if (["message", "callback"].includes(k)) {
          return;
        }
        const message = cmds[k]?.message ?? "";
        const log = `${k.padEnd(max, " ")}${"----"
          .padStart(10, " ")
          .padEnd(14, " ")}${message}`.trim();
        if (k.trim().startsWith("-")) {
          helpInfo[1].push(log);
        } else {
          helpInfo[0].push(log);
        }
      });
      console.log(
        `
        命令帮助
        ${helpInfo[0].length > 0 ? `Command:` : ""}
          ${helpInfo[0].map((e) => `\\n${e}`).join("\n")}
        ${helpInfo[1].length > 0 ? `Options:` : ""}
          ${helpInfo[1].map((e) => `\\n${e}`).join("\n")}
      `
          .split("\n")
          .filter((e) => Boolean(e.trim()))
          .map((e) => {
            return e.trim().replace(/^\\n(?=\s*)/, "  ");
          })
          .join("\n")
      );
    }
  };
  if (currentCmdInfo) {
    const callback =
      typeof currentCmdInfo === "function"
        ? currentCmdInfo
        : typeof currentCmdInfo?.callback === "function"
        ? currentCmdInfo?.callback
        : null;
    if (callback) {
      return await callback({
        parames,
        help: async () => {
          await help(true);
        },
      });
    } else if (typeof currentCmdInfo === "object") {
      return await run(parames, currentCmdInfo || ({} as any));
    } else {
      return await help();
    }
  } else {
    return await help();
  }
})(process.argv.slice(2), cmds);

```

### zsh 命令代码补全

```sh
# _testA
#  以下命令添加到 .zshrc 中即可完成补全
# [[ -f _testA.sh ]] && . _testA.sh || true


_testA() {
  # 一级命令
  case ${words[2]} in 
    start)
      local -a cmd1=("asd" "asdas")
      _describe 'command' cmd1
      ;;
    -h)
      local -a cmd1=("askdj" "aa啊谁来打卡老师sdas")
      _describe 'command' cmd1
      ;;
    *)
      local -a cmd1=("start:启动服务" "stop:停止服务" "restart:重启服务" "status:查看状态" "-h:帮助")
      _describe 'command' cmd1
      ;;
  esac
}

# 绑定补全函数到 test.sh
compdef _testA test1.sh
```

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

[vue3 分栏布局（推荐）](web/LayoutSplitVue3.vue)

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
import { default as less } from 'less';
const tint = (color: string, amount: number) =>
    less.functions?.functionRegistry
        .get('tint')(new less.color(color.replace(/#/, '')), new less.dimension(amount, '%'))
        .toRGB();
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
            /^bg-tint-(.+)$/,
            ([, value]) => {
                return { background: `linear-gradient(to right, ${value},${tint(value, 50)})` };
            }
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
    variants: [
        (matcher) => {
            const m = matcher.match(/^(.{1,})-hover:(.{1,})$/);
            if (m) {
                return {
                    matcher: m[2],
                    selector: (s) => `.${m[1]}:hover ${s}`,
                };
            }
        },
         // &-hover-self-.screen_bg:op-100!
        (matcher, { rawSelector }) => {
            const important = /^!|!$/.test(rawSelector) ? '!' : '';
            const importantStart = /^!/.test(rawSelector) ? important : '';
            const importantEnd = /!$/.test(rawSelector) ? important : '';
            const matcherReplace = (matcher) =>
                matcher.replace(/(\.|:|\[|\]|#|&|!|>|\+|~)/g, '\\$1');
            if (/^[^-]+-hover-self-/.test(matcher)) {
                const m = matcher.match(/^([^-]+)-hover-(self-.*)/);
                const mm = m[2].match(
                    /^self-([^\:]+):((?=:*([^:]+):(.*))|(.*))/
                );
                return {
                    matcher: `${mm[4] || mm[2]}`,
                    selector: () => {
                        return `.${matcherReplace(
                            `${importantStart}${
                                m[1] === '&' ? matcher : m[1]
                            }${importantEnd}`
                        )}:hover ${mm[3] ? `:${mm[3]}` : ''} ${
                            m[1] === '&' ? '' : `.${matcherReplace(matcher)}`
                        } ${mm[1]}`;
                    },
                };
            }
            if (/^self/.test(matcher)) {
                const m = matcher.match(
                    /^self-([^\:]+):((?=:*(.*):(.*))|(.*))/
                );
                if (m) {
                    return {
                        matcher: `${m[4] || m[2]}`,
                        selector: () => {
                            return `.${matcherReplace(
                                `${importantStart}${matcher}${importantEnd}`
                            )} ${m[1]}${m[3] ? `:${m[3]}` : ''}`;
                        },
                    };
                } else {
                  const m = matcher.match(/^self(.*):((?=:*(.+)?:(.*))|(.*))/);
                  return {
                    matcher: `${m[4] || m[2]}`,
                    selector: () => {
                      return `.${matcherReplace(
                        `${importantStart}${matcher}${importantEnd}`
                      )} ${m[1]}${m[3] ? `:${m[3]}` : ""}`;
                    },
                  };
                }
            }
        },
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

## node-serve 连接mysql

```
import { createPool, QueryOptions } from "mysql2";
import * as ncol from "ncol";
const pool = createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "rootroot",
  database: "test",
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
# 防止vue路由防卫入侵监测

需要替换你真实的beforeEachHook如代码:

```
const beforeEachHook = (to, form, next) => {
	// 你的路由防卫...
}
router.beforeEach(beforeEachHook);
```

```js
const useCheckRouterHooks = (fn) => {
  function isNative(fn) {
    return (
      typeof fn === "function" &&
      /\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(fn))
    );
  }

  const checkIsNative = (fn) => {
    if (typeof fn === "function") {
      if (isNative(Function.prototype.toString) && isNative(fn)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };
  (function checkRouterHooksRun() {
    fn?.();
    if (checkIsNative(requestAnimationFrame)) {
      requestAnimationFrame(checkRouterHooksRun);
    } else {
      if (checkIsNative(setTimeout)) {
        setTimeout(checkRouterHooksRun);
      } else {
        setInterval(checkRouterHooksRun);
      }
    }
  })();
};
const errorHooks = () => {
  // 重新注册路由守卫
  router.beforeEach(beforeEachHook);
  // 提示用户并刷新页面
  document.body.innerHTML = "";
  const div = document.createElement("div");
  div.innerHTML = "检测到浏览器环境非法入侵,禁止访问!";
  div.style.color = "red";
  div.style.fontSize = "20px";
  document.body.appendChild(div);
  alert(div.innerHTML);
  // 关闭页面程序
  location.replace("about:blank");
  throw new Error(div.innerHTML);
};
useCheckRouterHooks(() => {
  const isExistHooks = []
    .concat(router.afterEach)
    .concat(router.beforeHooks)
    .includes(beforeEachHook);
  if (!isExistHooks) {
    errorHooks();
  }
});
// 禁止浏览器debugger
(function _debuggerInit() {
  const start = Date.now();
  new Function(`debugger;`)();
  const end = Date.now();
  if (Date.now() - start > 100) {
    errorHooks();
  }
  setTimeout(() => {
    _debuggerInit();
  });
})();
```
# puppeteer 禁止debugger
```ts
await page.evaluateOnNewDocument(() => {
    // 重写 Function.prototype.constructor，过滤含 debugger 的代码
    const _constructor = Function.prototype.constructor;
    Function.prototype.constructor = function (...args) {
      if (
        args.some((arg) => typeof arg === "string" && arg.includes("debugger"))
      ) {
        console.log("[Bypass] debugger removed:", args);
        args = args.map((arg) => arg.replace(/debugger;?/g, ""));
      }
      return _constructor.apply(this, args);
    };
  });
```
# puppeteer 删除自动化标识,即关闭 navigator.webdriver
```
args: [
      "--disable-blink-features=AutomationControlled" // 去掉 automation 标记
    ]
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

```typescript
export class shallowRef {
  _value: any;
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
    this.subs.forEach((sub: any) => {
      sub();
    });
  }
}
export function ref(value) {
  return new shallowRef(value) as any;
}
let activeSub = null;
export function effect(fn) {
  activeSub = fn;
  fn();
  activeSub = null;
}
const renderHelper = (element, VNode, type, props, children) => {
  if (type === "text-node") {
    const innerText = typeof children === "function" ? children() : children;
    if (Array.isArray(innerText)) {
      element = VNode.parent.el;
      element.innerHTML = "";
      innerText.forEach((child) => {
        if (child.__v_isVNode) {
          child = VNodeForTsxHelper(child);
        }
        if (child.isVNode || child.__v_isVNode) {
          renderElement(element, child, VNode);
        } else {
          effect(renderHelper.bind(null, element, VNode, type, props, child));
        }
      });
    } else {
      element.textContent =
        children && children.isRef ? children.value : innerText;
    }
  } else if (children && children.isRef) {
    element.innerText = children.value;
  } else {
    const innerText = typeof children === "function" ? children() : children;
    if (Array.isArray(innerText)) {
      element.innerHTML = "";
      innerText.forEach((child) => {
        if (child.isVNode) {
          renderElement(element, child, VNode);
        } else {
          effect(renderHelper.bind(null, element, VNode, type, props, child));
        }
      });
    } else {
      element.innerText = innerText;
    }
  }
};
const VNodeRender = (type, props, children) => {
  return (element, VNode) => {
    renderHelper(element, VNode, type, props, children);
  };
};
export function h(type, props?, children?) {
  if (!props && !children) {
    children = type;
    type = "text-node";
    props = {};
  } else if (!children) {
    children = props;
    props = {};
  }
  return {
    type,
    props,
    children: Array.isArray(children) ? children : [children],
    render: VNodeRender(type, props, children),
    isVNode: true,
  } as any;
}

export function renderElement(el, VNode, parent = null) {
  const { type, props, children } = VNode;
  let element = document.createElement("div");
  try {
    switch (type) {
      case "text-node":
        element = document.createTextNode("") as any;
        break;
      default:
        element = document.createElement(type);
        break;
    }
  } catch (e) {
    element = parent?.el;
  }
  VNode.el = element;
  VNode.parent = parent;
  for (const key in props) {
    const _VNodeRef = props[key];
    if (key === "ref") {
      if (_VNodeRef.isRef) {
        _VNodeRef.value = element;
      } else {
        _VNodeRef?.(element);
      }
      continue;
    }
    const renderArrs = (bool, _value?) => {
      const value = _value ? _value : bool ? _VNodeRef.value : _VNodeRef;
      if (/^style$/.test(key)) {
        for (const styleKey in value) {
          if (styleKey.startsWith("--")) {
            element.style.setProperty(styleKey, value[styleKey]);
          } else {
            element.style[styleKey] = value[styleKey];
          }
        }
      } else if (/^on[A-Z]+/.test(key)) {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    };
    if (_VNodeRef.isRef) {
      effect(renderArrs.bind(null, true));
    } else {
      effect(() => {
        renderArrs(
          false,
          typeof _VNodeRef === "function" && !/^on[A-Z]+/.test(key)
            ? _VNodeRef()
            : _VNodeRef
        );
      });
    }
  }
  children.forEach((child) => {
    if (child && child.isVNode) {
      renderElement(element, child, VNode);
    } else {
      effect(VNode.render.bind(null, element, VNode));
    }
  });
  if (element !== parent?.el) {
    el.appendChild(element);
  }
}
export function render(el: HTMLElement, VNode) {
  if (typeof VNode === "function") {
    VNode = VNode();
  }
  el.innerHTML = "";
  renderElement(el, VNode);
}

const propsKsyMapForTsx = {
  className: "class",
};
function VNodeForTsxHelper(VNode: any) {
  if (VNode.isRef) {
    return h(VNode);
  }
  if (typeof VNode === "function") {
    VNode = VNode();
  }
  if (!VNode?.__v_isVNode) {
    return VNode;
  }
  const { type, props, children } = VNode;
  if (type?.toString?.() === "Symbol(v-txt)") {
    return h(children);
  }
  const _props = Object.fromEntries(
    Object.entries(props || {}).map(([key, value]) => [
      propsKsyMapForTsx[key] || key,
      value,
    ])
  );
  return h(
    type,
    _props,
    (Array.isArray(children) ? children : [children]).map((e) =>
      VNodeForTsxHelper(e)
    )
  );
}
export function createApp(el: HTMLElement, VNode) {
  effect(render.bind(null, el, VNodeForTsxHelper(VNode)));
}

```
# useForm 

```typescript
import { merge } from 'lodash';
export function useForm(fields: any[], options: Record<string, any> = {}) {
    const config = merge(
        {
            showCancel: true,
            showSave: true,
            dialogProps: {},
            success: () => void 0,
        },
        options
    );
    const value = ref<any>({});
    const form = ref();
    $alert.dialog(
        merge(
            {
                title: '提示',
                width: '700px',
                content: fields,
                props: {
                    ref: form,
                    modelValue: value.value,
                    onSave(...args: any[]) {
                        (config.success as unknown as any)(...args);
                    },
                },
                footer: [
                    {
                        title: '取消',
                        props: {
                            type: 'default',
                            onclick() {
                                $alert.dialog.close();
                            },
                        },
                        show: config.showCancel,
                    },
                    {
                        title: '保存',
                        props: {
                            type: 'primary',
                            onClick: async () => {
                                await form.value.validate();
                                window.$message.success(
                                    config.successMsg || '验证成功'
                                );
                                $alert.dialog.close();
                                await (config.success as unknown as any)(
                                    form.value,
                                    config
                                );
                            },
                        },
                        show: config.showSave,
                    },
                ].filter((e) => e.show),
            },
            config.dialogProps
        )
    );
    return {
        data: value,
        form,
    };
}

export default useForm;

```

```typescript
import { createDiscreteApi, DialogReactive, NButton, NSpace } from 'naive-ui';
import dialogAlertTitle from './dialogAlertTitle.vue';
import App from '@/app.vue';
import FormValidate from '@/components/formValidate.vue';
import AlertContent from '@/components/alert-content.vue';
const { dialog, app } = createDiscreteApi(['dialog']);
let isUseInitGlobalProperties = false;
const useInitGlobalProperties = () => {
    try {
        if (!isUseInitGlobalProperties) {
            const appRoot: any = document.getElementById('app');
            const globalProperties: Record<any, any> =
                appRoot.__vue_app__.config.globalProperties;
            const globalPropertiesEntries: Array<[string, any]> =
                Object.entries(globalProperties);
            for (const [k, v] of globalPropertiesEntries) {
                app.config.globalProperties[k] = v;
            }
            isUseInitGlobalProperties = true;
        }
    } catch (e) {
        // err
    }
};
type DialogConfigType = {
    content: any;
    title: any;
    props?: Record<string, any>;
    width?: string | undefined;
    footer?: any;
    hideFooter?: boolean;
    successMsg?: string;
};
const dialogCaches: Array<DialogReactive> = [];
interface DialogDefault {
    (config: DialogConfigType): DialogReactive;
    close(): void;
    closeAll(): void;
}
const renderForm = (config: any) => {
    const form = ref();
    return h(
        defineComponent(() => {
            return () =>
                h(AlertContent, null, {
                    default: () =>
                        h(FormValidate, {
                            field: unref(config.content),
                            config: {},
                            modelValue: {},
                            gridProps: {},
                            ref: form,
                            ...config.props,
                        }),
                    footer: () =>
                        !config.hideFooter
                            ? Object.prototype.toString.call(config.footer) ===
                              '[object Object]'
                                ? config.footer
                                : h(
                                      NSpace,
                                      {
                                          justify: 'center',
                                      },
                                      () => {
                                          return Array.isArray(config.footer)
                                              ? config.footer.map((item: any) =>
                                                    h(
                                                        NButton,
                                                        item.props,
                                                        () => item.title
                                                    )
                                                )
                                              : h(
                                                    NButton,
                                                    {
                                                        type: 'primary',
                                                        onClick: async () => {
                                                            await form.value.validate();
                                                            window.$message.success(
                                                                config.successMsg ||
                                                                    '验证成功'
                                                            );
                                                            $alert.dialog.close();
                                                            await config?.props?.onSave?.(
                                                                form.value,
                                                                config
                                                            );
                                                        },
                                                    },
                                                    () => '确定'
                                                );
                                      }
                                  )
                            : null,
                });
        })
    );
};
const dialogDefault: DialogDefault = (
    config: DialogConfigType = {} as DialogConfigType
) => {
    useInitGlobalProperties();
    const dialogApp = dialog.create({
        title: config.title
            ? () =>
                  h(dialogAlertTitle, {
                      title: config.title,
                  })
            : undefined,
        class: 'alert-dialog-custom-theme',
        style: `width:${config.width || 'auto'}`,
        showIcon: false,
        content: () =>
            typeof config.content === 'object'
                ? h(App, null, {
                      default: () => {
                          if (
                              Array.isArray(config.content) ||
                              isRef(config.content)
                          ) {
                              return renderForm(config);
                          } else {
                              return h(
                                  defineAsyncComponent({
                                      loader: () => config.content,
                                  }),
                                  config.props
                              );
                          }
                      },
                  })
                : config.content,
    } as any);
    dialogCaches.push(dialogApp);
    return dialogApp;
};
dialogDefault.close = () => {
    const dialogPop = dialogCaches.pop();
    setTimeout(() => {
        dialogPop?.destroy();
    }, 200);
};
dialogDefault.closeAll = () => {
    while (dialogCaches.length > 0) {
        dialogDefault.close();
    }
};
export default dialogDefault;

```

### Dockerfile + ohmyzsh + nodejs
```dockerfile
FROM node
COPY . /app
WORKDIR /app
RUN apt-get update
RUN apt-get install zsh git -y
RUN npm i -g pnpm nrm n pm2
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
RUN aliases command-not-found dirhistory extract git-prompt macos vscode z colored-man-pages copyfile docker git history nmap wd colorize copypath dotenv git-commit jsontools sudo web-search 
CMD zsh && tail -f /dev/null
```
### ubuntu 镜像更换
```shell
#!/bin/sh

# 设置你的 Ubuntu 版本代号，例如 focal, jammy, bionic
UBUNTU_CODENAME=focal

# 备份原来的 sources.list
cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 替换为阿里云镜像源
cat > /etc/apt/sources.list <<EOF
deb http://mirrors.aliyun.com/ubuntu/ $UBUNTU_CODENAME main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $UBUNTU_CODENAME-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $UBUNTU_CODENAME-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $UBUNTU_CODENAME-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ $UBUNTU_CODENAME-backports main restricted universe multiverse
EOF
apt update -y
tail -f /dev/null

```
### shell 脚本遍历当前目录下的所有文件夹后并进入文件夹同时执行相应的命令后退出的脚本（作用：同步当前目录下的所有git 仓库）
```shell
#!/bin/sh
# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

# 定义颜色函数
echo_red() {
  printf "${RED}%s${RESET}\n" "$*"
}

echo_green() {
  printf "${GREEN}%s${RESET}\n" "$*"
}

echo_yellow() {
  printf "${YELLOW}%s${RESET}\n" "$*"
}

echo_blue() {
  printf "${BLUE}%s${RESET}\n" "$*"
}

echo_cyan() {
  printf "${CYAN}%s${RESET}\n" "$*"
}

# 保存当前路径
BASE_DIR=$(pwd)
echo_blue "正在执行同步"
# 遍历所有子目录
for dir in */; do
    # 判断是否为目录
    [ -d "$dir" ] || continue

    echo_green "进入目录：$dir"
    cd "$dir" || continue

    # 这里是你要执行的一系列命令，可以添加多条
    echo_yellow "正在执行命令..."
    # 本地分支
    branch=$(git rev-parse --abbrev-ref HEAD)
    # 远程分支
    remote_branch=$(git rev-parse --abbrev-ref --symbolic-full-name @{u})
    echo_blue 当前分支：$branch 远程分支： $remote_branch
    # 获取远程分支最新状态
    git fetch --all

    # 硬重置本地分支到远程分支（覆盖所有提交、代码）
    git reset --hard $remote_branch

    # 删除所有未跟踪文件和目录（彻底干净）
    git clean -fd
    # 拉取最新代码
    git pull

    # 返回到初始目录
    cd "$BASE_DIR"
done

echo_green "所有项目同步完成"

```

### Node.js 中搭建一个 MQTT 服务端

> 推荐使用 Aedes 轻量级 MQTT Broker

1. 安装依赖

```bash
npm install aedes ws
```
2. 创建 Broker 服务（支持 WebSocket 端口）
```js
// server.js
const aedes = require('aedes')();
const http = require('http');
const ws = require('ws');

const server = http.createServer();
const wss = new ws.Server({ server });

wss.on('connection', function connection(wsStream) {
  const duplex = ws.createWebSocketStream(wsStream);
  aedes.handle(duplex);
});

const PORT = 8888;

server.listen(PORT, function () {
  console.log(`MQTT broker started on ws://localhost:${PORT}`);
});

```
// 如果你需要原生 TCP 协议（不是 ws），可使用 net.createServer()。

#### 作为 MQTT 客户端（连接其他 Broker）

> 推荐使用 mqtt.js

1. 安装依赖

```bash
npm install mqtt
```
1. 连接并发布/订阅

```js
// client.js
const mqtt = require('mqtt');

const client = mqtt.connect('ws://localhost:8888'); // 或 mqtt://localhost:1883

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // 订阅主题
  client.subscribe('test/topic', (err) => {
    if (!err) {
      console.log('Subscribed to test/topic');
      // 发布消息
      client.publish('test/topic', 'Hello from Node.js');
    }
  });
});

// 接收消息
client.on('message', (topic, message) => {
  console.log(`Received on ${topic}: ${message.toString()}`);
});

```

你可以使用 MQTT 客户端工具连接验证：

* [MQTTX（推荐）](https://mqttx.app/)

* MQTT Explorer

* 浏览器端也可用 mqtt.js（需用 WebSocket）

### AutoImportPreset 预设

```typescript
import { camelCase, upperCase, upperFirst, lowerFirst, toLower } from 'lodash';
import { sync } from 'glob';
type PresetArrs = Array<{
    cwd: string;
    prefix?: string;
    suffix?: string;
    import?: string;
}>;
export const AutoImportBusinessPreset = (presetArrs: PresetArrs = []) => {
    const defaultPresetArrs: PresetArrs = (
        [
            {
                cwd: 'src/components/business',
                prefix: 'bs'
            },
            {
                cwd: 'src/hooks',
                suffix: 'hooks'
            }
        ] as PresetArrs
    ).concat(presetArrs);
    const preset = defaultPresetArrs.reduce((pre: any, { cwd, prefix, suffix }) => {
        const presetAlias = sync('**/*.{vue,ts,jsx,tsx}', {
            cwd: cwd,
            absolute: true
        }).reduce<string[]>((pre, cur: string) => {
            const filePath = cur;
            cur = filePath.replace(process.cwd() + '/' + cwd, '').replace(/\..*$/, '');
            const name = upperFirst(camelCase(cur));
            let arr: any = [];
            arr.push(name);
            arr.push(lowerFirst(name));
            if (typeof prefix === 'string') {
                new Array(3).fill(toLower(prefix)).forEach((p, k) => {
                    p =
                        {
                            0: upperCase(p),
                            1: upperFirst(p)
                        }[k] || p;
                    arr.push(`${p}${name}`);
                });
            }
            if (typeof suffix === 'string') {
                arr = arr.map((e: any) => `${e}${upperFirst(camelCase(suffix))}`);
            }
            return pre.concat(
                arr.map((e: string) => ({
                    filePath,
                    import: filePath.replace(process.cwd() + '/src', '@'),
                    as: e,
                    default: 'default'
                })) as any
            );
        }, []);
        presetAlias.forEach((e: any) => {
            pre[e.import] = [...(pre[e.import] || []), [e.default, e.as]];
        });
        return pre;
    }, {});
    return preset;
};
```

抽离版本

// 需要替换scripts脚本 `build-pre`
"dev": "npm run build-pre && vite",
"build": "npm run build-pre && npm run lint && vite build && npm run compress:dist",
"build-pre": "tsnd  -P ./src/utils/scripts/tsconfig-build.json src/utils/scripts/build-pre.ts --run-preset",
        
```typescript
import { camelCase, upperCase, upperFirst, lowerFirst, toLower } from 'lodash';
import { sync } from 'glob';
import { readJSONSync, writeJSONSync } from 'fs-extra';
import { resolve } from 'path';
const oupoutFile = resolve(process.cwd(), 'auto-import-business-preset.json');
type PresetArrs = Array<{
    cwd: string;
    prefix?: string;
    suffix?: string;
    import?: string;
    preset?: any[];
}>;
export const AutoImportBusinessPreset = () => readJSONSync(oupoutFile);
const presetArrsConfig = [
    {
        cwd: 'src/components/business',
        prefix: 'bs'
    },
    {
        cwd: 'src/hooks',
        suffix: 'hooks'
    },
    {
        cwd: 'src/utils/utils/index',
        preset: [['asda']]
    }
] as PresetArrs;
export const run = (presetArrs: PresetArrs = []) => {
    const defaultPresetArrs: PresetArrs = presetArrsConfig.concat(presetArrs);
    const syncCwd: PresetArrs = [];
    const syncCwdPreset: PresetArrs = [];
    defaultPresetArrs.forEach((e) => {
        if (Array.isArray(e.preset)) {
            syncCwdPreset.push(e);
        } else {
            syncCwd.push(e);
        }
    });
    const presets = syncCwd.reduce((pre: any, { cwd, prefix, suffix }) => {
        const presetAlias = sync('**/*.{vue,ts,jsx,tsx}', {
            cwd: cwd,
            absolute: true
        }).reduce<string[]>((pre, cur: string) => {
            const filePath = cur;
            cur = filePath.replace(process.cwd() + '/' + cwd, '').replace(/\..*$/, '');
            const name = upperFirst(camelCase(cur));
            let arr: any = [];
            arr.push(name);
            arr.push(lowerFirst(name));
            if (typeof prefix === 'string') {
                new Array(3).fill(toLower(prefix)).forEach((p, k) => {
                    p =
                        {
                            0: upperCase(p),
                            1: upperFirst(p)
                        }[k] || p;
                    arr.push(`${p}${name}`);
                });
            }
            if (typeof suffix === 'string') {
                arr = arr.map((e: any) => `${e}${upperFirst(camelCase(suffix))}`);
            }
            return pre.concat(
                arr.map((e: string) => ({
                    filePath,
                    import: filePath.replace(process.cwd() + '/src', '@'),
                    as: e,
                    default: 'default'
                })) as any
            );
        }, []);
        presetAlias.forEach((e: any) => {
            pre[e.import] = [...(pre[e.import] || []), [e.default, e.as]];
        });
        return pre;
    }, {});
    syncCwdPreset.forEach(({ cwd, preset }) => {
        const _import = cwd.replace(process.cwd() + '/src', '@').replace(/.*\/*src/, '@');
        presets[_import] = preset || [];
    });
    writeJSONSync(oupoutFile, presets, { spaces: 2 });

    return presets;
};
if (process.argv.includes('--run-preset')) {
    run();
}

```

### 百度翻译

```typescript
import axios from "axios";
import { merge, get } from "lodash";
import { EventEmitter } from "events";
const translating = async (
  options: Partial<{
    data: Partial<{
      query: string;
      from: string;
      to: string;
    }>;
  }> = {}
) => {
  const config = merge(
    {
      data: {},
    },
    options
  );
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const emitter = new EventEmitter();
        const translatingMap = {
          content: null,
          words: null,
        };
        emitter.on("message", (data) => {
          const parsedData = data ? JSON.parse(data) : {};
          if (
            ["GetKeywordsSucceed", "GetDictSucceed"].includes(
              parsedData.data?.event
            )
          ) {
            translatingMap.words =
              (
                get(
                  parsedData,
                  "data.dictResult.simple_means.word_means",
                  []
                ) || []
              ).join("") +
              get(parsedData, "data.keywords", [])
                .map((e) => `【${e.word}】${e.means.join(" ; ")}`)
                .join("\n");
            translatingSuccess();
          }
          if (parsedData.data?.event === "Translating") {
            translatingMap.content = parsedData.data.list
              .map((e) => e.dst)
              .join("\n");
            translatingSuccess();
          }
        });

        const translatingSuccess = () => {
          const { words, content } = translatingMap;
          if (words && content) {
            resolve(`${content}\n${words}`);
          }
        };
        const translating = (data: string) => {
          let event = null;
          let eventData = null;
          data
            .split("\n")
            .filter((e) => e)
            .forEach((e) => {
              if (event && eventData) {
                emitter.emit(event, eventData);
                eventData = null;
                event = null;
              }
              if (e.startsWith("event: ")) {
                event = e.slice(7);
              }
              if (e.startsWith("data: ")) {
                eventData = e.slice(6);
              }
            });
        };
        const res = await axios({
          url: "https://fanyi.baidu.com/ait/text/translate",
          method: "POST",
          data: merge(
            {
              query: "Demo of a customer service ",
              from: "en",
              to: "zh",
              reference: "",
              corpusIds: [],
              needPhonetic: false,
              domain: "common",
              milliTimestamp: 1750648654142,
            },
            config.data
          ),
        });
        translating(res.data);
      } catch (error) {
        reject(error);
      }
    })();
  });
};
(async function () {
  const result = await translating();
  console.log(result);
})();

```

node-serve版本

```typescript
import { Controller } from "@wisdom-serve/serve";
import axios from "axios";
import { merge, get } from "lodash";
import { EventEmitter } from "events";
const translating = async (
  options: Partial<{
    data: Partial<{
      query: string;
      from: string;
      to: string;
    }>;
  }> = {}
) => {
  const config = merge(
    {
      data: {},
    },
    options
  );
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const emitter = new EventEmitter();
        const translatingMap = {
          content: null,
          words: null,
        };
        emitter.on("message", (data) => {
          const parsedData = data ? JSON.parse(data) : {};
          if (
            [
              "GetKeywordsSucceed",
              "GetDictSucceed",
              "TranslationSucceed",
            ].includes(parsedData.data?.event)
          ) {
            translatingMap.words =
              (
                get(
                  parsedData,
                  "data.dictResult.simple_means.word_means",
                  []
                ) || []
              ).join("") +
              get(parsedData, "data.keywords", [])
                .map((e) => `【${e.word}】${e.means.join(" ; ")}`)
                .join("\n");
            translatingSuccess();
          }
          if (parsedData.data?.event === "Translating") {
            translatingMap.content = parsedData.data.list
              .map((e) => e.dst)
              .join("\n");
            translatingSuccess();
          }
          if (parsedData.errno !== 0) {
            throw Error(parsedData.errmsg);
          }
        });

        const translatingSuccess = () => {
          const { words, content } = translatingMap;
          if (typeof words === "string" && typeof content === "string") {
            resolve(`${content}\n${words}`);
          }
        };
        const translating = (data: string) => {
          let event = null;
          let eventData = null;
          const emit = () => {
            if (eventData) {
              emitter.emit(event || "message", eventData);
              eventData = null;
              event = null;
            }
          };
          data
            .split("\n")
            .filter((e) => e)
            .forEach((e) => {
              if (e.startsWith("event: ")) {
                event = e.slice(7);
                emit();
              }
              if (e.startsWith("data: ")) {
                eventData = e.slice(6);
                emit();
              }
            });
        };
        const res = await axios({
          url: "https://fanyi.baidu.com/ait/text/translate",
          method: "POST",
          headers: {
            Cookie: ''
          },
          data: merge(
            {
              query: "Demo of a customer service ",
              from: "en",
              to: "zh",
              reference: "",
              corpusIds: [],
              needPhonetic: false,
              domain: "common",
              milliTimestamp: 1750648654142,
            },
            config.data
          ),
        });
        translating(res.data);
      } catch (error) {
        reject(error);
      }
    })();
  });
};
export default (async function () {
  try {
    const result = await translating({
      data: {
        query: this.$body.text,
        from: this.$body.source_lang.toLowerCase(),
        to: this.$body.target_lang.toLowerCase(),
      },
    });
    this.$send(
      JSON.stringify({
        code: 0,
        translateResult: [
          [
            {
              tgt: result,
            },
          ],
        ],
        type: "zh-CHS2en",
      }),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    this.$send(
      JSON.stringify({
        code: 0,
        translateResult: [
          [
            {
              tgt: error.message,
            },
          ],
        ],
        type: "zh-CHS2en",
      }),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
} as Controller);

```
### macos 配置pm2自启动服务

// 加载
launchctl load ~/Library/LaunchAgents/com.bob.baidu.serve.plist
// 开始服务
launchctl start com.bob.baidu.serve   
// 卸载服务
launchctl unload ~/Library/LaunchAgents/com.bob.baidu.serve.plist


~/Library/LaunchAgents/com.bob.baidu.serve.plist 内容
```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" \
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>EnvironmentVariables</key>
        <dict>
            <key>PATH</key>
            <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        </dict>
        <key>Label</key>
        <string>com.bob.baidu.serve</string>

        <key>ProgramArguments</key>
        <array>
            <string>/usr/local/bin/pm2</string>
            <string>restart</string>
            <string>all</string>
        </array>

        <key>RunAtLoad</key>
        <true /> <!-- 开机或登录时自动运行 -->

        <key>StandardOutPath</key>
        <string>/tmp/com.bob.baidu.serve.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/com.bob.baidu.serve.err</string>
    </dict>
</plist>
```

### commitlint.config.js

```js
const headerTypes = [
    'style',
    'perf',
    'build',
    'ci',
    'revert',
    'create',
    'add',
    'fix',
    'mod',
    'refactor',
    'merge',
    'migration',
    'docs',
    'test',
    'release',
    'chore',
    'feat',
];
const headerTypesStr = headerTypes.join('|');
const headerPattern = new RegExp(
    `^(?:(\\[${headerTypesStr}\\]|${headerTypesStr})(\\([^\\(\\)]+\\):|:)*\\s+)`
);
export default {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
        parserOpts: {
            headerPattern,
            headerCorrespondence: ['type', 'subject'],
        },
    },
    rules: {
        'type-enum': [2, 'always', headerTypes],
    },
    prompt: {
        messages: {
            type: '选择你要提交的类型 :',
            scope: '选择一个提交范围（可选）:',
            customScope: '请输入自定义的提交范围 :',
            subject: '填写简短精炼的变更描述 :',
            body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :',
            breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :',
            footerPrefixesSelect: '选择关联issue前缀（可选）:',
            customFooterPrefix: '输入自定义issue前缀 :',
            footer: '列举关联issue (可选) 例如: #31, #I3244 :',
            generatingByAI: '正在通过 AI 生成你的提交简短描述...',
            generatedSelectByAI: '选择一个 AI 生成的简短描述:',
            confirmCommit: '是否提交或修改commit ?',
        },
        // prettier-ignore
        types: [
          { value: 'feat',     name: '特性:     ✨  新增功能', emoji: ':sparkles:' },
          { value: 'fix',      name: '修复:     🐛  修复缺陷', emoji: ':bug:' },
          { value: 'docs',     name: '文档:     📝  文档变更', emoji: ':memo:' },
          { value: 'style',    name: '格式:     💄  代码格式（不影响功能，例如空格、分号等格式修正）', emoji: ':lipstick:' },
          { value: 'refactor', name: '重构:     ♻️  代码重构（不包括 bug 修复、功能新增）', emoji: ':recycle:' },
          { value: 'perf',     name: '性能:     ⚡️  性能优化', emoji: ':zap:' },
          { value: 'test',     name: '测试:     ✅  添加疏漏测试或已有测试改动', emoji: ':white_check_mark:'},
          { value: 'build',    name: '构建:     📦️  构建流程、外部依赖变更（如升级 npm 包、修改 vite 配置等）', emoji: ':package:'},
          { value: 'ci',       name: '集成:     🎡  修改 CI 配置、脚本',  emoji: ':ferris_wheel:'},
          { value: 'revert',   name: '回退:     ⏪️  回滚 commit',emoji: ':rewind:'},
          { value: 'chore',    name: '其他:     🔨  对构建过程或辅助工具和库的更改（不影响源文件、测试用例）', emoji: ':hammer:'},
        ],
        useEmoji: true,
        emojiAlign: 'center',
    },
};

```

### VueDevTools 选项launchEditor动态配置

```js
(function detectEditor() {
    const envstr = JSON.stringify(process.env);
    if (envstr.match(/trae/)) {
        return 'trae';
    } else if (envstr.match(/cursor/)) {
        return 'code';
    } else if (envstr.match(/vscode/)) {
        return 'code';
    } else {
        return 'code';
    }
})()
```


打开多余的标签解决方法：

在项目根目录中创建一个包含以下内容的 cursorgoto.sh 文件：
```
#!/bin/bash
cursor --goto "$1:$2:$3"
```
将其设置为可执行 chmod +x cursorgoto.sh

在您的 vite 配置中替换它：
```
export default defineConfig({
    plugins: [
        vueDevtools({ launchEditor: './cursorgoto.sh' }),
    ]
});
```
### vue3 创建api弹出层

```ts
import {
    NDrawer,
    DrawerProps,
    NConfigProvider,
    zhCN,
    dateZhCN,
} from 'naive-ui';
const apps: any[] = [];
function show(
    content: any,
    options: {
        drawerProps?: DrawerProps;
        props?: Record<string, any>;
        children?: any;
    } = {}
) {
    const { drawerProps = {}, props = {}, children } = options;
    const el = document.createElement('div');
    el.className = 'n-drawer--bottom-placement-customize';
    const show = ref(false);
    const app = createApp(
        defineComponent(() => {
            onMounted(() => {
                show.value = true;
            });
            const contentChildren =
                typeof content === 'string'
                    ? content
                    : h(
                          toString.call(content) === '[object Promise]'
                              ? defineAsyncComponent({
                                    loader: () => content,
                                })
                              : content,
                          props,
                          children
                      );
            return () =>
                h(
                    NConfigProvider,
                    {
                        locale: zhCN,
                        dateLocale: dateZhCN,
                    },
                    {
                        default: () =>
                            h(
                                NDrawer,
                                {
                                    show: show.value,
                                    closable: true,
                                    onMaskClick: () => {
                                        hide();
                                    },
                                    to: el,
                                    ...drawerProps,
                                },
                                () => contentChildren
                            ),
                    }
                );
        })
    );
    useSetupComprehensive(app);
    useSetupComponents(app);
    app.mount(el);
    document.body.appendChild(el);
    apps.push({
        app,
        el,
        show,
    });
    return {
        app,
        hide,
    };
}
async function hide() {
    const info = apps.shift();
    if (info) {
        info.show.value = false;
        setTimeout(() => {
            info.app.unmount();
            info.el.remove();
        }, 200);
    }
}
function hideAll() {
    while (apps.length) {
        hide();
    }
}
const { Escape } = useMagicKeys();
watch(Escape, (val) => {
    if (val) {
        hide();
    }
});
export default {
    show,
    hide,
    hideAll,
};

```

### js 网页录音

```ts
import Recorder from 'recorder-core';
import 'recorder-core/src/engine/mp3';
import 'recorder-core/src/engine/mp3-engine';
import 'recorder-core/src/engine/wav';
import 'recorder-core/src/engine/beta-webm';
import { merge, cloneDeep } from 'lodash';
type UpLoadInfo = {
    file: File;
    blob: Blob;
    type: string;
    duration: number;
    index: number;
};
export type UpLoadInfoResult = { text: string };
export type PromiseUpLoadInfoResult =
    | Promise<UpLoadInfoResult>
    | UpLoadInfoResult;
export function onUpLoad(info: UpLoadInfo): PromiseUpLoadInfoResult;
export function onUpLoad() {
    return { text: '' };
}
export type DefaultOptions = {
    autoRecord: boolean;
    onUpLoad: typeof onUpLoad;
    // 音频阀值，音频波动大于1000ms才认为说话
    speakingStartThreshold: number;
    // 当处于说话状态，并音频波动小于3000ms的时候认为说话结束
    speakingEndThreshold: number;
    // 音频格式
    audioType: 'wav' | 'mp3' | 'webm';
    // 错误消息
    error?(err: Error): void;
};
const defaultOptions: DefaultOptions = {
    autoRecord: false,
    onUpLoad,
    speakingStartThreshold: 1000,
    speakingEndThreshold: 3000,
    audioType: 'wav',
};
export async function getBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            resolve(base64data);
        };
        reader.onerror = reject;
    });
}

export function formatDuration(ms: number) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    ms %= 24 * 60 * 60 * 1000;

    const hours = Math.floor(ms / (60 * 60 * 1000));
    ms %= 60 * 60 * 1000;

    const minutes = Math.floor(ms / (60 * 1000));
    ms %= 60 * 1000;

    const seconds = Math.floor(ms / 1000);
    ms %= 1000;

    return {
        days,
        hours,
        minutes,
        seconds,
        milliseconds: ms,
    };
}
export function pad(num: number, size = 2) {
    return num.toString().padStart(size, '0');
}
export const useRecorder = (options?: Partial<typeof defaultOptions>) => {
    const mergedOptions = merge(cloneDeep(defaultOptions), options);
    const error =
        typeof mergedOptions.error === 'function'
            ? mergedOptions.error
            : (err: Error) => {
                  console.error('录音错误:', err.message);
              };
    const isPlay = ref(false);
    const recordContentArr = ref<string[]>([]);
    const recordContent = computed(() => recordContentArr.value.join(''));
    /**调用open打开录音请求好录音权限**/
    let rec: any, wave: any;
    const time = ref(performance.now());
    const time2 = ref(performance.now());
    const recordDuration = ref(0);
    const duration = ref(0);
    let isTalk = false;
    let isTalkRequest = false;
    const recordDurationStr = computed(() => {
        const { hours, minutes, seconds } = formatDuration(
            recordDuration.value
        );
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    });
    const recOpen = (success?: () => void) => {
        //一般在显示出录音按钮或相关的录音界面时进行此方法调用，后面用户点击开始录音时就能畅通无阻了
        rec = Recorder({
            //本配置参数请参考下面的文档，有详细介绍
            type: mergedOptions.audioType,
            sampleRate: 16000,
            bitRate: 16, //mp3格式，指定采样率hz、比特率kbps，其他参数使用默认配置；注意：是数字的参数必须提供数字，不要用字符串；需要使用的type类型，需提前把格式支持文件加载进来，比如使用wav格式需要提前加载wav.js编码引擎
            //eslint-disable-next-line
            onProcess: async function (
                buffers: any[],
                powerLevel: any,
                bufferDuration: any,
                bufferSampleRate: any
            ) {
                //录音实时回调，大约1秒调用12次本回调，buffers为开始到现在的所有录音pcm数据块(16位小端LE)
                //可利用extensions/sonic.js插件实时变速变调，此插件计算量巨大，onProcess需要返回true开启异步模式
                //可实时上传（发送）数据，配合Recorder.SampleData方法，将buffers中的新数据连续的转换成pcm上传，或使用mock方法将新数据连续的转码成其他格式上传，可以参考文档里面的：Demo片段列表 -> 实时转码并上传-通用版；基于本功能可以做到：实时转发数据、实时保存数据、实时语音识别（ASR）等
                //可实时绘制波形（extensions目录内的waveview.js、wavesurfer.view.js、frequency.histogram.view.js插件功能）
                wave &&
                    wave.input(
                        buffers[buffers.length - 1],
                        powerLevel,
                        bufferSampleRate
                    );
                recordDuration.value = Math.floor(
                    performance.now() - time2.value
                );
                duration.value = Math.floor(performance.now() - time.value);
                // 音频阀值，音频波动大于1000ms才认为说话
                if (!isTalkRequest) {
                    if (
                        !isTalk &&
                        Math.max.apply(null, buffers.at(-1)) >
                            mergedOptions.speakingStartThreshold
                    ) {
                        time.value = performance.now();
                        isTalk = true;
                    } else {
                        // 当处于说话状态，并音频波动小于3000ms的时候认为说话结束
                        if (
                            isTalk &&
                            performance.now() - time.value >
                                mergedOptions.speakingEndThreshold
                        ) {
                            isTalkRequest = true;
                            await recStop();
                            await recStart();
                            isTalkRequest = false;
                            isTalk = false;
                        }
                    }
                }
            },
        });

        rec.open(
            async function () {
                duration.value = 0;
                //打开了录音后才能进行start、stop调用
                time.value = performance.now();
                time2.value = performance.now();
                recordDuration.value = 0;
                //打开麦克风授权获得相关资源
                recStart(); // 此处可以立即开始录音，但不建议这样编写，因为open是一个延迟漫长的操作，通过两次用户操作来分别调用open和start是推荐的最佳流程

                //创建可视化，指定一个要显示的div
                if (Recorder.WaveView)
                    wave = Recorder.WaveView({ elem: '.recwave' });
                if (success) {
                    success?.();
                }
            },
            function (msg: any, isUserNotAllow: any) {
                //用户拒绝未授权或不支持
                error(
                    new Error(
                        (isUserNotAllow ? 'UserNotAllow，' : '') +
                            '无法录音:' +
                            msg
                    )
                );
            }
        );
    };

    /**开始录音**/
    async function recStart() {
        rec.start();
    }
    /**关闭录音**/
    async function recClose() {
        //打开了录音后才能进行start、stop调用
        rec.close();
    }

    /**结束录音**/
    async function recStop() {
        return new Promise<void>((resolve) => {
            rec.stop(
                async function (blob: Blob, duration: number) {
                    //简单利用URL生成本地文件地址，注意不用了时需要revokeObjectURL，否则霸占内存
                    //此地址只能本地使用，比如赋值给audio.src进行播放，赋值给a.href然后a.click()进行下载（a需提供download="xxx.mp3"属性）
                    // document.getElementById('audio')?.setAttribute('src', localUrl);
                    // document.getElementById('audio')?.play?.();
                    (async () => {
                        const info = {
                            duration,
                            blob,
                            type: 'audio',
                            file: new File(
                                [blob],
                                'audio.' + mergedOptions.audioType
                            ),
                            index: recordContentArr.value.length,
                        };
                        recordContentArr.value.push('');
                        const { text } = await mergedOptions.onUpLoad(info);
                        recordContentArr.value[info.index] = text;
                        console.log(`[音频${info.index + 1}]:识别内容:`, text);
                    })();
                    // rec.close();//释放录音资源，当然可以不释放，后面可以连续调用start；但不释放时系统或浏览器会一直提示在录音，最佳操作是录完就close掉
                    // rec=null;
                    resolve();
                },
                function (msg: any) {
                    error(new Error(msg));
                    // rec.close();//可以通过stop方法的第3个参数来自动调用close
                    // rec=null;
                    resolve();
                }
            );
        });
    }
    const closeRecording = async () => {
        await recStop();
        await recClose();
        rec = null;
    };
    const recording = async () => {
        if (isPlay.value) {
            await closeRecording();
        } else {
            await recOpen();
            await recStart();
        }
        isPlay.value = !isPlay.value;
    };
    if (mergedOptions.autoRecord) {
        tryOnBeforeUnmount(closeRecording);
        tryOnMounted(recording);
    }
    const cancelRecording = async () => {
        recordContentArr.value = [];
        await closeRecording();
    };
    return {
        // 开始录音,重复点击切换:[停止/播放]状态
        start: recording,
        // 关闭录音
        close: cancelRecording,
        recordContentArr,
        recordContent,
        // 推荐使用这个时间
        recordDurationStr,
        recordDuration,
        time,
        time2,
        duration,
        isPlay,
    };
};
export default useRecorder;

```

### uni-app 导出xlsx文件,兼容鸿蒙

```ts
import * as XLSX from 'xlsx';
async function exportExcel() {
    try {
        const workbook = XLSX.utils.book_new(); // 创建新的工作簿
        const worksheet = XLSX.utils.json_to_sheet(data); // 将数据转换为工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1"); // 将工作表添加到工作簿

        const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' }); // 将工作簿写入为数组格式
        // const fileUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
        // console.log(fileUrl)
        const filename = `${Date.now()}.xlsx`
		const dir = plus.io.convertLocalFileSystemURL("_doc/")
        const filePath = `${dir}${filename}`;
        console.log("dir:",dir)
        console.log("filePath:",filePath)
		await new Promise<void>(r=>{
			uni.getFileSystemManager().access({
				path:dir,
				success(res){
					// 目录已存在
					console.log(res,1)
				},
				fail(res){
					// 目录不存在
					console.log(res,2)
					// 递归创建文件
					uni.getFileSystemManager().mkdirSync(dir, true)
				},
				complete(){
					// 结束文件存在判断
					r()
				}
			})
		})
		console.log("目录已创建")
		// 写入临时文件
        uni.getFileSystemManager().writeFileSync(filePath, base64, 'base64');
        console.log("临时文件写入成功")
		// 保存文件
		const saveUrl = uni.getFileSystemManager().saveFileSync(filePath)
		console.log(saveUrl)
		uni.showToast({
			title:`文件保存在:${saveUrl}`	
		})
		console.log("正在打开文件")
		uni.openDocument({
			filePath:saveUrl,
			fileType:'xlsx',
			success(){
				console.log("文件打开成功")
			},
			fail(err){
				console.log("文件打开失败:",err)
			}
		})
		
    } catch (error) {
         console.log(error,333)
    }
	
}
```

### nmap 扫描局域网开放端口

非root权限
```
nmap -Pn -p 7890 --open 192.168.110.0/24  
```
需要root权限
```
sudo nmap -sS -p 7890 --open 192.168.110.0/24  
```
可利用交互命令fzf 进行选择

### liunx 一键设置系统语言为中文

set-chinese.sh

```
#!/usr/bin/env bash
set -e

echo "检测系统类型..."
if [ -f /etc/debian_version ]; then
    OS="debian"
elif [ -f /etc/redhat-release ]; then
    OS="centos"
else
    echo "暂不支持该系统，请手动配置"
    exit 1
fi

echo "安装中文语言包..."
if [ "$OS" = "debian" ]; then
    sudo apt update
    sudo apt install -y language-pack-zh-hans locales
    sudo locale-gen zh_CN.UTF-8
elif [ "$OS" = "centos" ]; then
    sudo yum install -y kde-l10n-Chinese glibc-langpack-zh
fi

echo "设置系统默认语言为中文..."
if [ -f /etc/locale.conf ]; then
    sudo bash -c 'echo -e "LANG=zh_CN.UTF-8\nLC_ALL=zh_CN.UTF-8" > /etc/locale.conf'
elif [ -f /etc/default/locale ]; then
    sudo bash -c 'echo -e "LANG=zh_CN.UTF-8\nLC_ALL=zh_CN.UTF-8" > /etc/default/locale'
else
    echo "未找到 locale 配置文件，请手动设置 LANG=zh_CN.UTF-8"
fi

echo "切换成功！请重新登录或执行以下命令应用："
echo "  source /etc/locale.conf  # 如果存在"
echo "  或重新启动系统"

```

如何还是不是中文,请讲以下命令添加到 编辑 ~/.bashrc 或 ~/.zshrc，加入：

```
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

source /etc/locale.conf
```
### liunx sudo 保持zsh

方法 1：sudo 保留 shell 环境

```
sudo -E zsh  
```

方法 2：切换到 root 时直接用 zsh

```
sudo chsh -s $(which zsh) root


# 切换到 root：
sudo su -
# 或
su - root
```

### 浏览器+vite插件:代码行数跳转

#### gva-position

```js
export default function GvaPosition() {
  return {
    name: "gva-position",
    apply: "serve",
    transform(code, id) {
      const index = id.lastIndexOf(".");
      const ext = id.substr(index + 1);
      if (ext.toLowerCase() === "vue") {
        return codeLineTrack(code, id);
      }
    },
  };
}

const codeLineTrack = (code, id) => {
  const lineList = code.split("\n");
  const newList = [];
  lineList.forEach((item, index) => {
    newList.push(addLineAttr(item, index + 1, id)); // 添加位置属性，index+1为具体的代码行号
  });
  return newList.join("\n");
};

const addLineAttr = (lineStr, line, id) => {
  if (!/^\s+</.test(lineStr)) {
    return lineStr;
  }

  const reg = /((((^(\s)+\<))|(^\<))[\w-]+)|(<\/template)/g;
  let leftTagList = lineStr.match(reg);
  if (leftTagList) {
    leftTagList = Array.from(new Set(leftTagList));
    leftTagList.forEach((item) => {
      const skip = [
        "KeepAlive",
        "template",
        "keep-alive",
        "transition",
        "el-",
        "El",
        "router-view",
      ];
      if (item && !skip.some((i) => item.indexOf(i) > -1)) {
        const reg = new RegExp(`${item}`);
        const location = `${item} code-location="${id}:${line}"`;
        lineStr = lineStr.replace(reg, location);
      }
    });
  }
  return lineStr;
};

```

#### gva-position-server

```js
const child_process = require('child_process')
import * as dotenv from 'dotenv'
import * as fs from 'fs'

const NODE_ENV = process.env.NODE_ENV || 'development'
const envFiles = [`.env.${NODE_ENV}`]
for (const file of envFiles) {
  const envConfig = dotenv.parse(fs.readFileSync(file))
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

export default function GvaPositionServer() {
  return {
    name: 'gva-position-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _, next) => {
        if (req._parsedUrl.pathname === '/gvaPositionCode') {
          const path =
            req._parsedUrl.query && req._parsedUrl.query.split('=')[1]
          if (path && path !== 'null') {
            if (process.env.VITE_EDITOR === 'webstorm') {
              const linePath = path.split(':')[1]
              const filePath = path.split(':')[0]
              const platform = os()
              if (platform === 'win32') {
                child_process.exec(
                  `webstorm64.exe  --line ${linePath} ${filePath}`
                )
              } else {
                child_process.exec(
                  `webstorm --line ${linePath} ${filePath}`
                )
              }
            } else {
              child_process.exec('code -r -g ' + path)
            }
          }
        }
        next()
      })
    },
  }
}

function os() {
  'use strict'
  const os = require('os')
  const platform = os.platform()
  return platform
}

```

### h5上拉刷新分页加载

```vue
<template>
    <div class='pdf-list-page of-x-hidden h-100%'>
        <slot :list="list"></slot>
        <div ref="loadingRef" class="flex-center text-#999 text-30px">
            <template v-if="finished">
                <div class="flex-center w-full gap-30px">
                    <div class="flex-1 b-t-1px b-solid b-#eee"></div>
                    <div>{{ finishedText }}</div>
                    <div class="flex-1 b-t-1px b-solid b-#eee"></div>
                </div>
            </template>
            <template v-else>{{ loadingText }}</template>
        </div>
    </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{
    apiPath?: any
    params?: any
    dataField?: any
    totalField?: any
    finishedText?: string
    loadingText?: string
}>(), {
    apiPath: () => Promise.resolve({ data: [], total: 0 }),
    params: () => ({}) as Record<string, any>,
    dataField: 'data',
    totalField: 'total',
    finishedText: '我是有底线的',
    loadingText: '加载中...',
})
const emit = defineEmits(['update:params', 'update:apiPath'])
const { apiPath, params } = useVModels(props, emit)
const page = ref(-1)
const pageSize = ref(10)
const noPage = ref(false)
const currentParams = computed(() => ({
    pageSize: pageSize.value,
    noPage: noPage.value,
    ...params.value,
    page: page.value,
}))
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const loadingRef = ref<HTMLDivElement>() as Ref<HTMLElement>
const targetIsVisible = ref<boolean>(false)
const el = useCurrentElement() as Ref<HTMLElement>
provide('pdfListPageRef', el)
const { stop } = useIntersectionObserver(
    loadingRef,
    ([entry], observerElement) => {
        targetIsVisible.value = entry?.isIntersecting || false
    },
    {
        root: el
    }
)
const isLoading = ref(false)
const init = async () => {
    if (isLoading.value || finished.value) {
        return
    }
    try {
        isLoading.value = true
        loading.value = true
        finished.value = false
        page.value += 1
        const res = await apiPath.value(currentParams.value)
        const total = res.data[props.totalField] || 0
        list.value = list.value.concat(res.data[props.dataField] || [])
        isLoading.value = false
        loading.value = false
        if (list.value.length >= total) {
            finished.value = true
        } else {
            await nextTick()
            loadingRef.value.scrollTop;
            if (currentParams.value.noPage) {
                return finished.value = true
            }
            if (targetIsVisible.value) {
                await init()
            }
        }
    } catch (error) {
        isLoading.value = false
        loading.value = false
    }
}
const stopWatch = watch(targetIsVisible, async (visible) => {
    if (visible && !isLoading.value && !loading.value && !finished.value) {
        await init()
    }
})
const reset = async () => {
    page.value = -1
    list.value = []
    finished.value = false
    loading.value = false
    isLoading.value = false
    targetIsVisible.value = false
}
onMounted(async () => {
    await reset()
})
onUnmounted(() => {
    loading.value = false
    finished.value = false
    stop()
    stopWatch()
})
defineExpose({
    reset,
})
</script>
<style scoped lang="less">
.pdf-list-page {}
</style>
```

pdf-list-page-item.vue
监听元素在可视区域中在渲染默认插槽内容,不再科室区域则不渲染,这在默认插槽是重组件的情况下,对于垃圾回收很有帮助,代码如下:
```vue
<template>
    <div class='pdf-list-page-item h-$height'>
        <div ref="loadingRef">
            <slot v-if="targetIsVisible"></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
const pdfListPageRef = inject('pdfListPageRef') as Ref<HTMLElement>
const loadingRef = ref<HTMLDivElement>() as Ref<HTMLElement>
const targetIsVisible = ref<boolean>(false)
const currentHeight = ref<number>(0)
const { height } = useElementSize(loadingRef)
watchEffect(() => {
    if (height.value > 0) {
        currentHeight.value = height.value
    }
})
useCssVars(() => ({
    height: currentHeight.value > 0 ? `${currentHeight.value}px` : '',
}))
const { stop } = useIntersectionObserver(
    loadingRef,
    ([entry], observerElement) => {
        const visible = entry?.isIntersecting || false
        targetIsVisible.value = visible
    },
    {
        root: pdfListPageRef,
        threshold: 0,
        rootMargin: "100% 100% 100% 100%"
    }
)
onUnmounted(() => {
    stop()
})
</script>
<style scoped lang="less">
.pdf-list-page-item {}
</style>
```

### vue布局底部固定

```vue
<template>
    <div class='footer-fixed flex flex-col'>
        <div class="flex-1 w-100% of-hidden">
            <slot></slot>
        </div>
        <div class="h-$height w-100">
            <div ref="footerRef" class="fixed bottom-0 left-0 w-100%">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
const footerRef = ref();
const { height } = useElementSize(footerRef);
useCssVars(() => ({
    height: `${height.value}px`,
}));
</script>
<style scoped lang="less">
.footer-fixed {}
</style>
```

### 悬浮球指令 

suspension.ts

```ts
import { Directive, DirectiveBinding } from 'vue';

export interface SuspensionOptions {
    container?: HTMLElement | string; // 容器
    edge?: boolean; // 是否启用吸边，默认 true
    autoEdge?: boolean; // 是否在元素初始化渲染完成后自动吸附，默认 false
    edgeMode?: 'all' | 'x' | 'y'; // 吸边方向
    edgeDelay?: number; // 停止拖动多久触发吸边
    edgeDuration?: number; // 吸边动画时长
    onEdge?: () => void; // 吸边完成回调
    onClick?: (ev: MouseEvent) => void; // 点击事件
}

export interface SuspensionModifiers {
    x?: boolean;
    y?: boolean;
    mouse?: boolean;
    touch?: boolean;
    edge?: boolean;
}

export interface SuspensionBinding extends DirectiveBinding<SuspensionOptions> {
    modifiers: any;
}

export class SuspensionInit {
    el: HTMLElement;
    binding: SuspensionBinding;
    vnode: any;
    oldVnode: any;
    touchesTap: { clientX?: number; clientY?: number } = {};
    matrix: number[] = [1, 0, 0, 1, 0, 0];
    matrixOld: number[] = [1, 0, 0, 1, 0, 0];
    startRect: DOMRect | null = null;
    axis: 'x' | 'y' | 'both' = 'both';

    private moveHandler: any;
    private endHandler: any;

    private enableMouse = true;
    private enableTouch = true;
    private container: HTMLElement | Window = window;

    private autoEdgeTimeout: any = null;
    private autoEdgeEnabled = false; // 初始化自动吸附开关
    private edgeEnabled = true;
    private edgeDelay = 3000;
    private edgeDuration = 300;
    private edgeMode: 'all' | 'x' | 'y' = 'all';
    private onEdge?: () => void;

    private isDragging = false;
    private dragThreshold = 5;
    private onClick = (ev: MouseEvent) => ev.stopImmediatePropagation();

    constructor(
        el: HTMLElement,
        binding: SuspensionBinding,
        vnode: any,
        oldVnode: any
    ) {
        this.el = el;
        this.binding = binding;
        this.vnode = vnode;
        this.oldVnode = oldVnode;

        this.updateOptions(binding);
        this.init();
    }

    /** 更新配置实时生效 */
    updateOptions(binding: SuspensionBinding) {
        const value = binding.value || {};
        this.binding = binding;

        // 拖动方向
        if (binding.modifiers.x) this.axis = 'x';
        else if (binding.modifiers.y) this.axis = 'y';
        else this.axis = 'both';

        // 输入方式
        if (binding.modifiers.mouse) {
            this.enableMouse = true;
            this.enableTouch = false;
        } else if (binding.modifiers.touch) {
            this.enableMouse = false;
            this.enableTouch = true;
        } else {
            this.enableMouse = true;
            this.enableTouch = true;
        }

        // 容器
        if (value.container) {
            if (typeof value.container === 'string') {
                const node = document.querySelector(value.container);
                if (node instanceof HTMLElement) this.container = node;
            } else if (value.container instanceof HTMLElement) {
                this.container = value.container;
            }
        } else {
            this.container = window;
        }

        // 吸边配置
        this.edgeEnabled = !!((binding.modifiers.edge || value.edge) ?? false);
        this.autoEdgeEnabled = !!(value.autoEdge ?? false);
        this.edgeMode = value.edgeMode || 'all';
        this.edgeDelay = value.edgeDelay ?? 3000;
        this.edgeDuration = value.edgeDuration ?? 300;
        this.onEdge =
            typeof value.onEdge === 'function' ? value.onEdge : undefined;
        this.onClick =
            typeof value.onClick === 'function'
                ? value.onClick
                : (ev: MouseEvent) => ev;
    }

    private parseMatrix(transform: string | null) {
        if (!transform || transform === 'none') return [1, 0, 0, 1, 0, 0];
        const m = transform
            .replace(/^matrix\(|\)$/g, '')
            .split(',')
            .map((s) => parseFloat(s.trim()));
        return m.length === 6 ? m : [1, 0, 0, 1, 0, 0];
    }

    private getContainerRect() {
        if (this.container instanceof HTMLElement)
            return this.container.getBoundingClientRect();
        return {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    private startDrag(clientX: number, clientY: number) {
        this.clearAutoEdgeTimer();
        this.touchesTap.clientX = clientX;
        this.touchesTap.clientY = clientY;
        this.matrix = this.parseMatrix(getComputedStyle(this.el).transform);
        this.matrixOld = [...this.matrix];
        this.startRect = this.el.getBoundingClientRect();
        this.isDragging = false;
    }

    private doDrag(clientX: number, clientY: number) {
        if (!this.startRect) return;
        const dx = clientX - (this.touchesTap.clientX || 0);
        const dy = clientY - (this.touchesTap.clientY || 0);

        if (
            !this.isDragging &&
            Math.sqrt(dx * dx + dy * dy) < this.dragThreshold
        )
            return;
        this.isDragging = true;

        let proposedLeft = this.startRect.left + (this.axis === 'y' ? 0 : dx);
        let proposedTop = this.startRect.top + (this.axis === 'x' ? 0 : dy);

        const containerRect = this.getContainerRect();
        const elW = this.startRect.width;
        const elH = this.startRect.height;

        const minLeft = containerRect.left;
        const maxLeft = containerRect.left + containerRect.width - elW;
        const minTop = containerRect.top;
        const maxTop = containerRect.top + containerRect.height - elH;

        if (proposedLeft < minLeft) proposedLeft = minLeft;
        if (proposedLeft > maxLeft) proposedLeft = maxLeft;
        if (proposedTop < minTop) proposedTop = minTop;
        if (proposedTop > maxTop) proposedTop = maxTop;

        const dxClamped = proposedLeft - this.startRect.left;
        const dyClamped = proposedTop - this.startRect.top;

        if (this.axis !== 'y') this.matrix[4] = this.matrixOld[4] + dxClamped;
        if (this.axis !== 'x') this.matrix[5] = this.matrixOld[5] + dyClamped;

        this.el.style.transform = `matrix(${this.matrix.join(',')})`;
    }

    private endDrag(ev: any) {
        if (!this.isDragging) this.onClick?.(ev);
        this.matrixOld = [...this.matrix];
        this.startRect = null;
        this.startAutoEdgeTimer();
    }

    private startAutoEdgeTimer() {
        if (!this.edgeEnabled) return; // 禁用吸边
        this.clearAutoEdgeTimer();
        this.autoEdgeTimeout = setTimeout(
            () => this.autoEdge(),
            this.edgeDelay
        );
    }

    private clearAutoEdgeTimer() {
        if (this.autoEdgeTimeout) {
            clearTimeout(this.autoEdgeTimeout);
            this.autoEdgeTimeout = null;
        }
    }

    private autoEdge() {
        if (!this.edgeEnabled) return;

        const containerRect = this.getContainerRect();
        const elRect = this.el.getBoundingClientRect();

        const elLeft = elRect.left - containerRect.left;
        const elTop = elRect.top - containerRect.top;
        const elRight = containerRect.width - (elLeft + elRect.width);
        const elBottom = containerRect.height - (elTop + elRect.height);

        let targetX = this.matrix[4];
        let targetY = this.matrix[5];

        if (this.edgeMode === 'x' || this.edgeMode === 'all')
            targetX += elLeft < elRight ? -elLeft : elRight;
        if (this.edgeMode === 'y' || this.edgeMode === 'all')
            targetY += elTop < elBottom ? -elTop : elBottom;

        this.el.style.transition = `transform ${this.edgeDuration}ms`;
        this.el.style.transform = `matrix(${this.matrix[0]},${this.matrix[1]},${this.matrix[2]},${this.matrix[3]},${targetX},${targetY})`;
        this.matrix = [
            this.matrix[0],
            this.matrix[1],
            this.matrix[2],
            this.matrix[3],
            targetX,
            targetY,
        ];
        this.matrixOld = [...this.matrix];

        setTimeout(() => {
            this.el.style.transition = '';
            this.onEdge?.();
        }, this.edgeDuration);
    }

    init() {
        if (this.enableTouch) {
            this.el.addEventListener(
                'touchstart',
                (ev) =>
                    this.startDrag(
                        ev.touches[0].clientX,
                        ev.touches[0].clientY
                    ),
                { passive: true }
            );
            this.el.addEventListener(
                'touchmove',
                (ev) =>
                    this.doDrag(ev.touches[0].clientX, ev.touches[0].clientY),
                { passive: true }
            );
            this.el.addEventListener('touchend', (ev: any) => this.endDrag(ev));
            this.el.addEventListener('touchcancel', (ev: any) =>
                this.endDrag(ev)
            );
        }

        if (this.enableMouse) {
            this.el.addEventListener('mousedown', (ev) => {
                ev.preventDefault();
                this.startDrag(ev.clientX, ev.clientY);

                this.moveHandler = (moveEv: MouseEvent) =>
                    this.doDrag(moveEv.clientX, moveEv.clientY);
                this.endHandler = (ev: any) => {
                    this.endDrag(ev);
                    document.removeEventListener('mousemove', this.moveHandler);
                    document.removeEventListener('mouseup', this.endHandler);
                };

                document.addEventListener('mousemove', this.moveHandler);
                document.addEventListener('mouseup', this.endHandler);
            });
        }
        // 初始吸边（元素渲染完成后）
        if (this.edgeEnabled && this.autoEdgeEnabled) {
            // 使用 requestAnimationFrame 确保元素渲染完成
            requestAnimationFrame(() => {
                this.autoEdge();
            });
        }
    }

    destroy() {
        this.clearAutoEdgeTimer();
    }
}

export const vSuspension: Directive<HTMLElement, SuspensionOptions> = {
    mounted(el: any, binding: SuspensionBinding, vnode, oldVnode) {
        el._suspension = new SuspensionInit(el, binding, vnode, oldVnode);
    },
    updated(el: any, binding: SuspensionBinding) {
        el._suspension?.updateOptions(binding);
    },
    unmounted(el: any) {
        el._suspension?.destroy();
        delete el._suspension;
    },
};

```

### 移动端元素缩放

```ts
import type { Directive } from 'vue';
import Hammer from 'hammerjs';
/**
 兼容两种绑定格式：
v-pinch-zoom="false" → 禁用缩放

v-pinch-zoom="{ disabled: false, minScale: 1, maxScale: 5 }" → 高级配置
 */
interface PinchZoomOptions {
    disabled?: boolean;
    minScale?: number;
    maxScale?: number;
}

const pinchZoomDirective: Directive<
    HTMLElement,
    boolean | PinchZoomOptions | undefined
> = {
    mounted(el, binding) {
        // 支持布尔值或对象
        const opts: PinchZoomOptions =
            typeof binding.value === 'object'
                ? binding.value
                : { disabled: binding.value === false };

        let enabled = !opts.disabled;
        let MIN_SCALE = opts.minScale ?? 1;
        let MAX_SCALE = opts.maxScale ?? 3;

        let currentScale = 1;
        let initialScale = 1;
        let currentX = 0;
        let currentY = 0;
        let lastX = 0;
        let lastY = 0;

        let mc: HammerManager | null = null;

        const clamp = (v: number, a: number, b: number) =>
            Math.min(Math.max(v, a), b);

        function applyTransform() {
            el.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
        }

        function limitPan() {
            const parent = el.parentElement?.getBoundingClientRect();
            if (!parent) return;
            const rect = el.getBoundingClientRect();
            const maxX = (rect.width * currentScale - parent.width) / 2;
            const maxY = (rect.height * currentScale - parent.height) / 2;
            if (maxX > 0) currentX = clamp(currentX, -maxX, maxX);
            if (maxY > 0) currentY = clamp(currentY, -maxY, maxY);
        }

        function initHammer() {
            if (mc) return; // 不重复初始化

            mc = new Hammer.Manager(el, { touchAction: 'auto' });
            const pinch = new Hammer.Pinch();
            const pan = new Hammer.Pan({ threshold: 0 });
            const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
            mc.add([pinch, pan, doubleTap]);
            pinch.recognizeWith(pan);

            // === 缩放 ===
            mc.on('pinchstart', (ev) => {
                if (!enabled || ev.pointers.length < 2) return;
                initialScale = currentScale;
                el.style.touchAction = 'none';
            });

            mc.on('pinchmove', (ev) => {
                if (!enabled || ev.pointers.length < 2) return;
                const newScale = clamp(
                    initialScale * ev.scale,
                    MIN_SCALE,
                    MAX_SCALE
                );
                currentScale = newScale;
                limitPan();
                applyTransform();
            });

            mc.on('pinchend pinchcancel', () => {
                currentScale = clamp(currentScale, MIN_SCALE, MAX_SCALE);
                el.style.touchAction = currentScale === 1 ? 'auto' : 'none';
                limitPan();
                applyTransform();
            });

            // === 平移 ===
            mc.on('panstart', (ev) => {
                if (!enabled || currentScale <= 1 || ev.pointers.length > 1)
                    return;
                lastX = currentX;
                lastY = currentY;
            });

            mc.on('panmove', (ev) => {
                if (!enabled || currentScale <= 1 || ev.pointers.length > 1)
                    return;
                currentX = lastX + ev.deltaX;
                currentY = lastY + ev.deltaY;
                limitPan();
                applyTransform();
            });

            mc.on('panend pancancel', () => {
                if (currentScale <= 1) return;
                limitPan();
                applyTransform();
            });

            // === 双击重置 ===
            mc.on('doubletap', () => {
                if (!enabled) return;
                currentScale = 1;
                currentX = 0;
                currentY = 0;
                el.style.touchAction = 'auto';
                applyTransform();
            });

            applyTransform();
        }

        // 保留状态，只停用交互
        function setEnabled(state: boolean) {
            enabled = state;
            if (enabled) {
                el.style.touchAction = currentScale === 1 ? 'auto' : 'none';
            } else {
                el.style.touchAction = 'auto'; // 禁用交互但保持缩放
            }
        }

        // 彻底销毁（卸载时）
        function destroyHammer() {
            if (mc) {
                mc.destroy();
                mc = null;
                el.style.touchAction = 'auto';
            }
        }

        // 初始化
        initHammer();
        setEnabled(enabled);

        // 外部控制接口
        (el as any).__pinchZoomUpdate__ = (
            newVal: boolean | PinchZoomOptions
        ) => {
            const newOpts =
                typeof newVal === 'object'
                    ? newVal
                    : { disabled: newVal === false };
            enabled = !newOpts.disabled;
            MIN_SCALE = newOpts.minScale ?? MIN_SCALE;
            MAX_SCALE = newOpts.maxScale ?? MAX_SCALE;
            setEnabled(enabled);
        };

        (el as any).__pinchZoomDestroy__ = destroyHammer;
    },

    updated(el, binding) {
        const updateFn = (el as any).__pinchZoomUpdate__;
        if (updateFn) updateFn(binding.value);
    },

    unmounted(el) {
        const destroyFn = (el as any).__pinchZoomDestroy__;
        if (destroyFn) destroyFn();
        delete (el as any).__pinchZoomUpdate__;
        delete (el as any).__pinchZoomDestroy__;
    },
};

export default pinchZoomDirective;

```

### nodejs ssh 文件推送部署

```js
/* eslint-disable @typescript-eslint/no-var-requires */
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const ZIP_FILE = 'dist_management.zip';
const REMOTE_FILE = 'management';
const USERNAME = 'root';
const PASSWORD = ''

const SERVER = process.argv[2];
const REMOTE_DIR = process.argv[3];

async function main() {
    // 2. 连接服务器
    const ssh = new NodeSSH();
    await ssh.connect({
        host: SERVER,
        username: USERNAME,
        // 推荐用密钥认证，或添加 password 字段
        // privateKey: '/Users/xxx/.ssh/id_rsa',
        password: PASSWORD
    });

    // 3. 上传压缩包
    console.log(`🚀 正在上传到服务器 ${SERVER} ...`);
    await ssh.putFile(ZIP_FILE, path.posix.join(REMOTE_DIR, ZIP_FILE));

    // 4. 远程操作
    console.log('🔄 正在执行部署操作...');
    const backupTime = dayjs().format('YYYYMMDDHHmmss');
    const backupName = `${REMOTE_FILE}_bak_${backupTime}`;
    const remoteCommands = [
        `cd '${REMOTE_DIR}' || exit 1`,
        `[ -d '${REMOTE_FILE}' ] && mv -v '${REMOTE_FILE}' '${backupName}' || echo '无旧版本'`,
        `unzip -o -q '${ZIP_FILE}' -d '${REMOTE_FILE}'`, // 修改这里：直接解压到目标目录
        `rm -v '${ZIP_FILE}'`
    ].join(' && ');

    const result = await ssh.execCommand(remoteCommands, { cwd: REMOTE_DIR });
    if (result.stderr) {
        console.error('❌ 远程部署失败:', result.stderr);
        process.exit(1);
    }

    // 5. 本地清理
    fs.unlinkSync(ZIP_FILE);
    console.log(`\n✅ 部署成功！新版文件位于：${REMOTE_DIR}/${REMOTE_FILE}`);

    ssh.dispose();
}

main().catch((err) => {
    console.error('❌ 部署失败:', err);
    process.exit(1);
});

```
