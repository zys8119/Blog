# Blog

个人爱好，知识积累，点滴成石

## 零度 llama 一键启动脚本

presets.ini

```ini
# llama.cpp 模型预设
# [*] 是全局默认；命令行参数优先级高于这里，所以 ctx-size 会被启动脚本覆盖
[*]
cache-type-k = q8_0
cache-type-v = q8_0

# ---------------------------------------------------------------
# 单个模型的配置。段名要跟 WebUI 下拉框里显示的模型名一致，
# 如果不生效，先看启动日志里 llama.cpp 是怎么命名这个模型的，再改这里。
# ---------------------------------------------------------------
[Muse-Glimmer-30B]
ctx-size = 32768
flash-attn = on
mmproj = models/Muse-Glimmer-30B/mmproj-kquant.gguf
spec-type = draft-dflash
spec-draft-model = models/Muse-Glimmer-30B/dflash-kquant.gguf
spec-draft-n-max = 15
spec-draft-ngl = all

```

llama-oneclick.sh

```sh
#!/bin/bash
# ============================================================================
# llama.cpp 一键启动器 (macOS)
# 自动检测 Apple Silicon / GPU / 内存 → 计算参数 → 启动 llama-server
# 支持单模型 / router 多模型 / DFlash / EAGLE3 / presets.ini
#
# 用法：
#   ./llama-oneclick.sh
#   ./llama-oneclick.sh -Single glimmer -Spec on
#   ./llama-oneclick.sh -Single glimmer -Spec off
#   ./llama-oneclick.sh -NoMenu
#   ./llama-oneclick.sh -Ctx 65536
#   ./llama-oneclick.sh -Port 8080
# ============================================================================

set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

PORT=8080
SINGLE=""
SPEC="ask"
NO_SPEC=0
NO_MENU=0
CTX_OVERRIDE=0

MODELS_DIR="$SCRIPT_DIR/models"
PRESETS="$SCRIPT_DIR/presets.ini"

say() {
    printf '%s\n' "$*"
}

die() {
    say ""
    say "  $*" >&2
    exit 1
}

usage() {
    cat <<EOF
用法：
  $0
  $0 -Single <模型关键词> [-Spec on|off]
  $0 -NoMenu
  $0 -Ctx <上下文token数>
  $0 -Port <端口>

参数：
  -Single <keyword>   只启动匹配的模型
  -Spec on|off|ask    投机解码：开 / 关 / 启动时询问
  -NoSpec             等同于 -Spec off
  -NoMenu             跳过启动菜单
  -Ctx <n>             手动指定上下文长度
  -Port <n>            HTTP 服务端口，默认 8080
  -h, --help          显示帮助
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -Single|--single)
            [[ $# -ge 2 ]] || die "$1 缺少参数"
            SINGLE="$2"
            shift 2
            ;;
        -Spec|--spec)
            [[ $# -ge 2 ]] || die "$1 缺少参数"
            case "$2" in
                on|off|ask) SPEC="$2" ;;
                *) die "-Spec 只能是 on / off / ask" ;;
            esac
            shift 2
            ;;
        -NoSpec|--no-spec)
            NO_SPEC=1
            shift
            ;;
        -NoMenu|--no-menu)
            NO_MENU=1
            shift
            ;;
        -Ctx|--ctx)
            [[ $# -ge 2 ]] || die "$1 缺少参数"
            [[ "$2" =~ ^[0-9]+$ ]] || die "-Ctx 必须是数字"
            CTX_OVERRIDE="$2"
            shift 2
            ;;
        -Port|--port)
            [[ $# -ge 2 ]] || die "$1 缺少参数"
            [[ "$2" =~ ^[0-9]+$ ]] || die "-Port 必须是数字"
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            die "未知参数：$1"
            ;;
    esac
done

if [[ "$NO_SPEC" -eq 1 ]]; then
    SPEC="off"
fi

# -Single 通常用于录制/脚本场景，无人交互时默认开启投机解码
if [[ -n "$SINGLE" && "$SPEC" == "ask" ]]; then
    SPEC="on"
fi

printf '\033c'
say ""
say "  llama.cpp 一键启动器"
say "  ---------------------------------------------"

# ============================================================================
# 1. 硬件检测
# ============================================================================

GPU_NAME="无独立显卡"
VRAM_GB=0
VENDOR="cpu"

ARCH="$(uname -m)"

# Apple Silicon：macOS 使用统一内存，无法像 NVIDIA VRAM 那样严格分离。
# llama.cpp Metal 会共享系统统一内存，因此这里把物理内存作为 GPU 可用内存预算。
if [[ "$ARCH" == "arm64" ]]; then
    GPU_NAME="$(system_profiler SPDisplaysDataType 2>/dev/null |
        awk -F': ' '/Chipset Model:/ {print $2; exit}')"

    [[ -n "$GPU_NAME" ]] || GPU_NAME="Apple GPU"

    VENDOR="metal"

    MEM_BYTES="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
    if [[ "$MEM_BYTES" =~ ^[0-9]+$ && "$MEM_BYTES" -gt 0 ]]; then
        VRAM_GB="$(awk -v b="$MEM_BYTES" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"
    fi
else
    # Intel Mac：优先读取显卡名称。
    GPU_NAME="$(system_profiler SPDisplaysDataType 2>/dev/null |
        awk -F': ' '/Chipset Model:/ {print $2; exit}')"

    if [[ -n "$GPU_NAME" ]]; then
        case "$GPU_NAME" in
            *AMD*|*Radeon*|*Apple*)
                VENDOR="metal"
                ;;
            *)
                VENDOR="cpu"
                ;;
        esac
    fi
fi

RAM_BYTES="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
RAM_GB="$(awk -v b="$RAM_BYTES" 'BEGIN {
    if (b > 0) printf "%.1f", b/1024/1024/1024;
    else print "0";
}')"

CORES="$(sysctl -n hw.physicalcpu 2>/dev/null || echo 0)"
[[ "$CORES" =~ ^[0-9]+$ ]] || CORES=0

if (( CORES < 1 )); then
    CORES="$(sysctl -n hw.ncpu 2>/dev/null || echo 4)"
fi

THREADS="$CORES"
(( THREADS < 4 )) && THREADS=4
(( THREADS > 16 )) && THREADS=16

say ""
say "  显卡     : $GPU_NAME"
if awk -v v="$VRAM_GB" 'BEGIN { exit !(v > 0) }'; then
    say "  显存/统一内存 : $VRAM_GB GB"
else
    say "  显存     : —"
fi
say "  内存     : $RAM_GB GB"
say "  物理核心 : $CORES"

# ============================================================================
# 2. 查找 llama-server
# ============================================================================

EXE=""

# 优先搜索脚本目录及常见位置。
if [[ -x "$SCRIPT_DIR/llama-server" ]]; then
    EXE="$SCRIPT_DIR/llama-server"
elif [[ -x "$SCRIPT_DIR/bin/llama-server" ]]; then
    EXE="$SCRIPT_DIR/bin/llama-server"
elif command -v llama-server >/dev/null 2>&1; then
    EXE="$(command -v llama-server)"
fi

if [[ -z "$EXE" ]]; then
    say ""
    say "  未找到 llama-server。" 
    say "  尝试通过 Homebrew 安装 llama.cpp…" 
    say ""

    if command -v brew >/dev/null 2>&1; then
        if brew install llama.cpp; then
            EXE="$(command -v llama-server || true)"
        fi
    else
        say "  未找到 Homebrew。"
        say "  请先安装 Homebrew，再执行："
        say "    brew install llama.cpp"
    fi
fi

if [[ -z "$EXE" ]]; then
    die "安装失败。请手动安装 llama.cpp，确保 llama-server 在 PATH 中。"
fi

# ============================================================================
# 3. 探测 llama-server 支持的参数
# ============================================================================

HELP="$("$EXE" --help 2>&1 || true)"

has_flag() {
    local flag="$1"
    grep -Fq -- "$flag" <<< "$HELP"
}

if [[ -z "$SINGLE" ]] && ! has_flag "--models-dir"; then
    say ""
    say "  你的 llama.cpp 版本不支持 router 模式（--models-dir）。"
    say "  请升级 llama.cpp 后重试。"
    say ""
    read -r -p "  按回车退出..."
    exit 1
fi

HAS_SPEC=0
if has_flag "--spec-type"; then
    HAS_SPEC=1
fi

# ============================================================================
# 4. 按内存/显存档位计算参数
# ============================================================================

# 原 Windows 脚本按 VRAM 分档。
# Apple Silicon 使用统一内存，因此这里使用统一内存作为预算。
CTX=4096
KVQ=1
MAX_MODELS=1
TIER="纯 CPU / 低内存模式"

if awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 32) }'; then
    CTX=131072
    MAX_MODELS=2
    TIER="32G+ 统一内存档"
elif awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 24) }'; then
    CTX=65536
    MAX_MODELS=1
    TIER="24G 档"
elif awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 16) }'; then
    CTX=32768
    MAX_MODELS=1
    TIER="16G 档"
elif awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 11) }'; then
    CTX=16384
    MAX_MODELS=1
    TIER="12G 档"
elif awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 7) }'; then
    CTX=8192
    MAX_MODELS=1
    TIER="8G 档"
elif awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 4) }'; then
    CTX=4096
    MAX_MODELS=1
    TIER="6G 及以下"
fi

if awk -v r="$RAM_GB" 'BEGIN { exit !(r < 16) }' && (( CTX > 8192 )); then
    CTX=8192
fi

if (( CTX_OVERRIDE > 0 )); then
    CTX="$CTX_OVERRIDE"
    say ""
    say "  已手动指定上下文长度：$CTX tokens"
fi

say ""
say "  匹配档位 : $TIER"
say "  后端     : $VENDOR"
say "  上下文   : $CTX tokens"

if (( CTX < 65536 )); then
    say "             （Hermes Agent 要求 ≥64K，接 Agent 框架请加 -Ctx 65536）"
fi

say "  KV 缓存  : q8_0 压缩（省内存，质量几乎无损）"

# ============================================================================
# 5. 模型扫描
# ============================================================================

mkdir -p "$MODELS_DIR"

MODEL_DIRS=()
MODEL_NAMES=()
MODEL_MAIN=()
MODEL_MMPROJ=()
MODEL_DRAFTER=()
MODEL_SPEC_TYPE=()
MODEL_SIZE_GB=()
MODEL_VERDICT=()
MODEL_SPEC_OK=()

add_model() {
    local dir="$1"
    local main="$2"
    local mmproj="$3"
    local drafter="$4"
    local spec_type="$5"

    local name
    if [[ "$dir" == "$MODELS_DIR" ]]; then
        name="$(basename "$main" .gguf)"
    else
        name="$(basename "$dir")"
    fi

    local size_bytes=0
    [[ -f "$main" ]] && size_bytes=$((size_bytes + $(stat -f%z "$main" 2>/dev/null || echo 0)))
    [[ -n "$mmproj" && -f "$mmproj" ]] && size_bytes=$((size_bytes + $(stat -f%z "$mmproj" 2>/dev/null || echo 0)))
    [[ -n "$drafter" && -f "$drafter" ]] && size_bytes=$((size_bytes + $(stat -f%z "$drafter" 2>/dev/null || echo 0)))

    local size_gb
    size_gb="$(awk -v b="$size_bytes" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"

    MODEL_DIRS+=("$dir")
    MODEL_NAMES+=("$name")
    MODEL_MAIN+=("$main")
    MODEL_MMPROJ+=("$mmproj")
    MODEL_DRAFTER+=("$drafter")
    MODEL_SPEC_TYPE+=("$spec_type")
    MODEL_SIZE_GB+=("$size_gb")
}

# 根目录 + 所有子目录。
DIRS=("$MODELS_DIR")
while IFS= read -r -d '' d; do
    DIRS+=("$d")
done < <(find "$MODELS_DIR" -type d -print0 2>/dev/null)

for d in "${DIRS[@]}"; do
    files=()
    while IFS= read -r -d '' f; do
        files+=("$f")
    done < <(find "$d" -maxdepth 1 -type f -name "*.gguf" -print0 2>/dev/null)

    (( ${#files[@]} == 0 )) && continue

    mmproj=""
    drafter=""
    mains=()
    shard1=""

    for f in "${files[@]}"; do
        base="$(basename "$f")"

        if [[ "$base" =~ mmproj ]]; then
            [[ -z "$mmproj" ]] && mmproj="$f"
            continue
        fi

        if [[ "$base" =~ (dflash|dspark|eagle3|draft) ]]; then
            [[ -z "$drafter" ]] && drafter="$f"
            continue
        fi

        if [[ "$base" =~ -[0-9]{5}-of-[0-9]{5}\.gguf$ ]]; then
            if [[ "$base" =~ -00001-of-[0-9]{5}\.gguf$ ]]; then
                shard1="$f"
            fi
            continue
        fi

        mains+=("$f")
    done

    [[ -n "$shard1" ]] && mains+=("$shard1")
    (( ${#mains[@]} == 0 )) && continue

    main="${mains[0]}"
    for f in "${mains[@]}"; do
        a="$(stat -f%z "$f" 2>/dev/null || echo 0)"
        b="$(stat -f%z "$main" 2>/dev/null || echo 0)"
        (( a > b )) && main="$f"
    done

    spec_type=""
    if [[ -n "$drafter" ]]; then
        base="$(basename "$drafter")"
        if [[ "$base" =~ dspark ]]; then
            spec_type="draft-dspark"
        elif [[ "$base" =~ eagle3 ]]; then
            spec_type="draft-eagle3"
        else
            spec_type="draft-dflash"
        fi
    fi

    add_model "$d" "$main" "$mmproj" "$drafter" "$spec_type"
done

COUNT="${#MODEL_NAMES[@]}"

say ""

if (( COUNT == 0 )); then
    say "  models 文件夹是空的。"
    say "  按你的统一内存，推荐先下载对应量化模型。"
    say ""
    say "  目录建议："
    say "    models/Muse-Glimmer-30B/Muse-Glimmer-30B-UD-Q4_K_XL.gguf"
    say "    models/Muse-Glimmer-30B/mmproj-kquant.gguf"
    say "    models/Muse-Glimmer-30B/dflash-kquant.gguf"
    say ""
    say "  放好后重新运行本脚本即可。"
    read -r -p "  按回车退出..."
    exit 0
fi

# ============================================================================
# 5.1 判断模型适配程度
# ============================================================================

get_verdict() {
    local idx="$1"

    local main="${MODEL_MAIN[$idx]}"
    local mmproj="${MODEL_MMPROJ[$idx]}"
    local drafter="${MODEL_DRAFTER[$idx]}"

    local main_bytes
    main_bytes="$(stat -f%z "$main" 2>/dev/null || echo 0)"

    local mm_bytes=0
    local draft_bytes=0

    [[ -n "$mmproj" ]] && mm_bytes="$(stat -f%z "$mmproj" 2>/dev/null || echo 0)"
    [[ -n "$drafter" ]] && draft_bytes="$(stat -f%z "$drafter" 2>/dev/null || echo 0)"

    local core_gb draft_gb
    core_gb="$(awk -v b="$((main_bytes + mm_bytes))" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"
    draft_gb="$(awk -v b="$draft_bytes" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"

    if awk -v v="$VRAM_GB" 'BEGIN { exit !(v <= 0) }'; then
        MODEL_VERDICT[$idx]="cpu"
        MODEL_SPEC_OK[$idx]=0
        return
    fi

    if awk -v v="$VRAM_GB" -v c="$core_gb" -v d="$draft_gb" \
        'BEGIN { exit !(v >= c+d+1.5) }'; then
        MODEL_VERDICT[$idx]="full"
        if [[ -n "$drafter" ]]; then
            MODEL_SPEC_OK[$idx]=1
        else
            MODEL_SPEC_OK[$idx]=0
        fi
    elif awk -v v="$VRAM_GB" -v c="$core_gb" \
        'BEGIN { exit !(v >= c+1.5) }'; then
        MODEL_VERDICT[$idx]="full"
        MODEL_SPEC_OK[$idx]=0
    elif awk -v v="$VRAM_GB" -v c="$core_gb" \
        'BEGIN { exit !(v >= c*0.55) }'; then
        MODEL_VERDICT[$idx]="part"
        MODEL_SPEC_OK[$idx]=0
    else
        MODEL_VERDICT[$idx]="over"
        MODEL_SPEC_OK[$idx]=0
    fi
}

for (( i=0; i<COUNT; i++ )); do
    get_verdict "$i"
done

say "  发现 $COUNT 个模型："

for (( i=0; i<COUNT; i++ )); do
    tags=""
    [[ -n "${MODEL_MMPROJ[$i]}" ]] && tags="多模态"
    [[ -n "${MODEL_DRAFTER[$i]}" ]] && {
        [[ -n "$tags" ]] && tags="$tags · "
        tags="${tags}投机加速"
    }

    [[ -n "$tags" ]] && tags="  [$tags]"

    case "${MODEL_VERDICT[$i]}" in
        full)
            verdict_text="全速"
            ;;
        part)
            verdict_text="部分层跑内存，速度打折"
            ;;
        over)
            verdict_text="显存明显不够，建议换更低量化"
            ;;
        *)
            verdict_text="纯 CPU，会很慢"
            ;;
    esac

    say "    · ${MODEL_NAMES[$i]}  (${MODEL_SIZE_GB[$i]} GB)$tags"
    say "      └ 你的 ${VRAM_GB} GB 显存/统一内存：$verdict_text"
done

# ============================================================================
# 5.5 投机解码菜单
# ============================================================================

SPEC_READY=()
SPEC_ALL=()

for (( i=0; i<COUNT; i++ )); do
    [[ -n "${MODEL_DRAFTER[$i]}" ]] && SPEC_ALL+=("$i")
    [[ -n "${MODEL_DRAFTER[$i]}" && "${MODEL_SPEC_OK[$i]}" == "1" ]] && SPEC_READY+=("$i")
done

if [[ -z "$SINGLE" && "$NO_MENU" -eq 0 && "$HAS_SPEC" -eq 1 && ${#SPEC_ALL[@]} -gt 0 ]]; then
    say ""
    say "  ---------------------------------------------"

    if (( ${#SPEC_READY[@]} > 0 )); then
        say "  检测到支持投机解码的模型。"
        say "  加速原理：小模型先猜一整块 token，大模型批量验证。"
        say "  输出内容和不开时一致，具体加速倍数取决于模型和硬件。"
    else
        say "  检测到带草稿模型的模型，但当前内存预算不适合同时加载加速组件。"
        say "  仍可强行开启，但速度可能变慢。"
    fi

    say ""
    say "    [1] 多模型模式          网页里随时热切换模型（不开加速）"
    say "    [2] 单模型 + 开启加速"
    say "    [3] 单模型 + 关闭加速"
    say ""

    read -r -p "  请输入 1 / 2 / 3（直接回车 = 1）" choice
    [[ -z "$choice" ]] && choice="1"

    if [[ "$choice" == "2" || "$choice" == "3" ]]; then
        if (( ${#SPEC_READY[@]} > 0 )); then
            PICK=("${SPEC_READY[@]}")
        else
            PICK=("${SPEC_ALL[@]}")
        fi

        if (( ${#PICK[@]} == 1 )); then
            SINGLE="${MODEL_NAMES[${PICK[0]}]}"
        else
            say ""
            say "  选择要启动的模型："
            for (( j=0; j<${#PICK[@]}; j++ )); do
                idx="${PICK[$j]}"
                say "    [$((j+1))] ${MODEL_NAMES[$idx]}"
            done

            say ""
            read -r -p "  请输入序号（直接回车 = 1）" mi
            [[ -z "$mi" ]] && mi="1"

            if [[ "$mi" =~ ^[0-9]+$ ]] && (( mi >= 1 && mi <= ${#PICK[@]} )); then
                SINGLE="${MODEL_NAMES[${PICK[$((mi-1))]}]}"
            else
                SINGLE="${MODEL_NAMES[${PICK[0]}]}"
            fi
        fi

        if [[ "$choice" == "2" ]]; then
            SPEC="on"
        else
            SPEC="off"
        fi

        say ""
        say "  已选择：$SINGLE  投机加速 = $SPEC"
    else
        SPEC="off"
    fi
fi

# ============================================================================
# 6/7. 构造 llama-server 参数
# ============================================================================

SRV_ARGS=()

find_model_index() {
    local keyword="$1"

    for (( i=0; i<COUNT; i++ )); do
        if [[ "${MODEL_NAMES[$i]}" == *"$keyword"* ||
              "$(basename "${MODEL_MAIN[$i]}")" == *"$keyword"* ]]; then
            echo "$i"
            return 0
        fi
    done

    return 1
}

if [[ -n "$SINGLE" ]]; then
    IDX="$(find_model_index "$SINGLE" || true)"

    [[ -n "$IDX" ]] || {
        say ""
        say "  没找到匹配「$SINGLE」的模型。"
        read -r -p "  按回车退出..."
        exit 1
    }

    G_NAME="${MODEL_NAMES[$IDX]}"
    G_MAIN="${MODEL_MAIN[$IDX]}"
    G_MMPROJ="${MODEL_MMPROJ[$IDX]}"
    G_DRAFTER="${MODEL_DRAFTER[$IDX]}"
    G_SPEC_TYPE="${MODEL_SPEC_TYPE[$IDX]}"
    G_VERDICT="${MODEL_VERDICT[$IDX]}"

    main_bytes="$(stat -f%z "$G_MAIN" 2>/dev/null || echo 0)"
    mm_bytes=0
    [[ -n "$G_MMPROJ" ]] && mm_bytes="$(stat -f%z "$G_MMPROJ" 2>/dev/null || echo 0)"

    core_gb="$(awk -v b="$((main_bytes + mm_bytes))" 'BEGIN { printf "%.1f", b/1024/1024/1024 }')"
    free_gb="$(awk -v v="$VRAM_GB" -v c="$core_gb" 'BEGIN { printf "%.1f", v-c }')"

    say ""
    say "  单模型模式：$G_NAME"
    say "  模型权重 : $core_gb GB（主模型 + 视觉编码器）"
    say "  剩余显存 : $free_gb GB"

    case "$G_VERDICT" in
        full) say "  预期表现 : 全速" ;;
        over) say "  预期表现 : 显存明显不够" ;;
        part) say "  预期表现 : 部分层跑内存，速度打折" ;;
        *) say "  预期表现 : 纯 CPU，会很慢" ;;
    esac

    CAN_FULL_OFFLOAD=0
    [[ "$G_VERDICT" == "full" ]] && CAN_FULL_OFFLOAD=1

    USE_SPEC="${MODEL_SPEC_OK[$IDX]}"

    [[ "$SPEC" == "off" ]] && USE_SPEC=0

    if [[ "$SPEC" == "on" && -n "$G_DRAFTER" ]]; then
        if [[ "${MODEL_SPEC_OK[$IDX]}" != "1" ]]; then
            say "  注意：当前内存预算不足，但已按你的要求强制开启加速"
            say "        如果速度反而变慢，可使用 -Spec off"
        fi
        USE_SPEC=1
    fi

    if [[ "$CAN_FULL_OFFLOAD" -eq 0 && "$VENDOR" != "cpu" ]]; then
        say "  → 使用 llama.cpp 的自动分层能力，部分层可能跑在内存上"
    fi

    SRV_ARGS+=(
        "-m" "$G_MAIN"
        "--host" "127.0.0.1"
        "--port" "$PORT"
        "-c" "$CTX"
        "-t" "$THREADS"
        "--alias" "$G_NAME"
    )

    if [[ "$CAN_FULL_OFFLOAD" -eq 1 ]]; then
        SRV_ARGS+=("-ngl" "99")
    fi

    if [[ -n "$G_MMPROJ" ]] && has_flag "--mmproj"; then
        SRV_ARGS+=("--mmproj" "$G_MMPROJ")
    fi

    if (( KVQ )) && has_flag "--cache-type-k"; then
        SRV_ARGS+=("--cache-type-k" "q8_0" "--cache-type-v" "q8_0")
    fi

    if has_flag "--jinja"; then
        SRV_ARGS+=("--jinja")
    fi

    if has_flag "--flash-attn"; then
        SRV_ARGS+=("-fa" "on")
    fi

    if [[ -n "$G_DRAFTER" && "$HAS_SPEC" -eq 1 && "$USE_SPEC" -eq 1 ]]; then
        SRV_ARGS+=("--spec-type" "$G_SPEC_TYPE" "-md" "$G_DRAFTER")

        if [[ "$G_SPEC_TYPE" == "draft-dspark" ]]; then
            N_MAX=7
        else
            N_MAX=15
        fi

        if has_flag "--spec-draft-n-max"; then
            SRV_ARGS+=("--spec-draft-n-max" "$N_MAX")
        fi

        if [[ "$CAN_FULL_OFFLOAD" -eq 1 ]] && has_flag "--spec-draft-ngl"; then
            SRV_ARGS+=("--spec-draft-ngl" "all")
        fi

        say "  投机解码 : 已开启（$G_SPEC_TYPE，草稿 $N_MAX token）"
    elif [[ -n "$G_DRAFTER" && "$SPEC" == "off" ]]; then
        say "  投机解码 : 已关闭（对比模式）"
    elif [[ -n "$G_DRAFTER" && "$HAS_SPEC" -eq 0 ]]; then
        say "  投机解码 : 检测到草稿模型，但当前 llama.cpp 版本不支持，已跳过"
    elif [[ -n "$G_DRAFTER" && "$USE_SPEC" -eq 0 ]]; then
        say "  投机解码 : 已跳过——内存不足以同时装下主模型和草稿模型"
    fi

else
    # ------------------------------------------------------------------------
    # router，多模型热切换
    # ------------------------------------------------------------------------

    SRV_ARGS+=(
        "--models-dir" "$MODELS_DIR"
        "--host" "127.0.0.1"
        "--port" "$PORT"
        "-c" "$CTX"
        "-t" "$THREADS"
    )

    if has_flag "--models-max"; then
        SRV_ARGS+=("--models-max" "$MAX_MODELS")
    fi

    if [[ -f "$PRESETS" ]] && has_flag "--models-preset"; then
        SRV_ARGS+=("--models-preset" "$PRESETS")
        say "  已加载 presets.ini（参数已固化）"
    fi

    if (( KVQ )) && has_flag "--cache-type-k"; then
        SRV_ARGS+=("--cache-type-k" "q8_0" "--cache-type-v" "q8_0")
    fi

    if has_flag "--jinja"; then
        SRV_ARGS+=("--jinja")
    fi

    EXTRA_MB=0

    for (( i=0; i<COUNT; i++ )); do
        mm="${MODEL_MMPROJ[$i]}"
        [[ -z "$mm" ]] && continue

        mb="$(stat -f%z "$mm" 2>/dev/null || echo 0)"
        mb="$(awk -v b="$mb" 'BEGIN { printf "%d", b/1024/1024 }')"

        (( mb > EXTRA_MB )) && EXTRA_MB="$mb"
    done

    if has_flag "--fit-target"; then
        if awk -v v="$VRAM_GB" 'BEGIN { exit !(v >= 16) }'; then
            BASE=2048
        else
            BASE=1024
        fi

        SRV_ARGS+=("--fit-target" "$((BASE + EXTRA_MB))")

        if (( EXTRA_MB > 0 )); then
            say "  显存余量 : $BASE + $EXTRA_MB MB（已为 mmproj 预留）"
        fi
    fi

    if (( ${#SPEC_READY[@]} > 0 )) && [[ "$HAS_SPEC" -eq 1 && "$NO_MENU" -eq 1 ]]; then
        say ""
        say "  提示：以下模型可使用投机解码："
        for idx in "${SPEC_READY[@]}"; do
            say "        · ${MODEL_NAMES[$idx]}"
        done
        say "        去掉 -NoMenu 重新运行，在菜单里选择单模型 + 加速。"
    fi
fi

if [[ "$VENDOR" == "cpu" ]] && has_flag "--no-warmup"; then
    SRV_ARGS+=("--no-warmup")
fi

# ============================================================================
# 8. 启动
# ============================================================================

say ""
say "  启动命令："
printf '  %q' "$EXE"
for arg in "${SRV_ARGS[@]}"; do
    printf ' %q' "$arg"
done
say ""
say ""
say "  正在启动… 浏览器会自动打开 http://127.0.0.1:$PORT"

if [[ -z "$SINGLE" ]]; then
    say "  在网页左上角的下拉框里可以随时切换模型，无需重启。"
fi

say "  按 Ctrl+C 停止服务。"
say ""

# 后台等待健康检查。
(
    for (( i=0; i<60; i++ )); do
        sleep 1
        if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
            open "http://127.0.0.1:$PORT" >/dev/null 2>&1
            exit 0
        fi
    done
) &

# exec 保证 Ctrl+C / 信号直接作用于 llama-server。
exec "$EXE" "${SRV_ARGS[@]}"

```


## 微信小程序access_token

```ts
import axios from "axios";
import { readJsonSync, writeJsonSync, existsSync } from "fs-extra";
(async () => {
  const tokenPath = "./token.json";
  if (!existsSync(tokenPath)) {
	writeJsonSync(tokenPath, {});
  }
  let token = readJsonSync(tokenPath);
  if (!token.access_token) {
	token = {};
  }
  if (!token.expires_in) {
	token = {};
  }
  if (new Date().getTime() > token.expires_in) {
	token = {};
  }
  if (!token.access_token) {
	let res = await axios({
	  url: "https://api.weixin.qq.com/cgi-bin/token",
	  method: "get",
	  params: {
		appid: "",
		secret: "",
		grant_type: "client_credential",
	  },
	});
	token = res.data;
	token.expires_in = new Date().getTime() + token.expires_in;
	writeJsonSync(tokenPath, token);
  }
})()
```

## llama.ccp 运行gguf

对话

```sh
llama-cli -m ~/Desktop/MiniCPM5-1B-Q8_0.gguf -ngl 999 -p "你好"
```

服务

```sh
llama-server \
-m ~/Desktop/MiniCPM5-1B-Q8_0.gguf \ 
-ngl 999 \
-c 32768 \
-n 4096 \
--host 127.0.0.1 \
--port 11434 \
--jinja
```

## blog 下载工具命令

a.js

```
"use strict";var e3=Object.defineProperty,n3=Object.defineProperties;var t3=Object.getOwnPropertyDescriptors;var gf=Object.getOwnPropertySymbols;var r3=Object.prototype.hasOwnProperty,i3=Object.prototype.propertyIsEnumerable;var xf=(n,i,r)=>i in n?e3(n,i,{enumerable:!0,configurable:!0,writable:!0,value:r}):n[i]=r,xr=(n,i)=>{for(var r in i||(i={}))r3.call(i,r)&&xf(n,r,i[r]);if(gf)for(var r of gf(i))i3.call(i,r)&&xf(n,r,i[r]);return n},mr=(n,i)=>n3(n,t3(i));var xe=(n,i,r)=>new Promise((f,o)=>{var a=b=>{try{h(r.next(b))}catch(g){o(g)}},l=b=>{try{h(r.throw(b))}catch(g){o(g)}},h=b=>b.done?f(b.value):Promise.resolve(b.value).then(a,l);h((r=r.apply(n,i)).next())});const mf={};function c3(n){let i=mf[n];if(i)return i;i=mf[n]=[];for(let r=0;r<128;r++){const f=String.fromCharCode(r);i.push(f)}for(let r=0;r<n.length;r++){const f=n.charCodeAt(r);i[f]="%"+("0"+f.toString(16).toUpperCase()).slice(-2)}return i}function sn(n,i){typeof i!="string"&&(i=sn.defaultChars);const r=c3(i);return n.replace(/(%[a-f0-9]{2})+/gi,function(f){let o="";for(let a=0,l=f.length;a<l;a+=3){const h=parseInt(f.slice(a+1,a+3),16);if(h<128){o+=r[h];continue}if((h&224)===192&&a+3<l){const b=parseInt(f.slice(a+4,a+6),16);if((b&192)===128){const g=h<<6&1984|b&63;g<128?o+="��":o+=String.fromCharCode(g),a+=3;continue}}if((h&240)===224&&a+6<l){const b=parseInt(f.slice(a+4,a+6),16),g=parseInt(f.slice(a+7,a+9),16);if((b&192)===128&&(g&192)===128){const E=h<<12&61440|b<<6&4032|g&63;E<2048||E>=55296&&E<=57343?o+="���":o+=String.fromCharCode(E),a+=6;continue}}if((h&248)===240&&a+9<l){const b=parseInt(f.slice(a+4,a+6),16),g=parseInt(f.slice(a+7,a+9),16),E=parseInt(f.slice(a+10,a+12),16);if((b&192)===128&&(g&192)===128&&(E&192)===128){let v=h<<18&1835008|b<<12&258048|g<<6&4032|E&63;v<65536||v>1114111?o+="����":(v-=65536,o+=String.fromCharCode(55296+(v>>10),56320+(v&1023))),a+=9;continue}}o+="�"}return o})}sn.defaultChars=";/?:@&=+$,#";sn.componentChars="";const Af={};function f3(n){let i=Af[n];if(i)return i;i=Af[n]=[];for(let r=0;r<128;r++){const f=String.fromCharCode(r);/^[0-9a-z]$/i.test(f)?i.push(f):i.push("%"+("0"+r.toString(16).toUpperCase()).slice(-2))}for(let r=0;r<n.length;r++)i[n.charCodeAt(r)]=n[r];return i}function Wn(n,i,r){typeof i!="string"&&(r=i,i=Wn.defaultChars),typeof r=="undefined"&&(r=!0);const f=f3(i);let o="";for(let a=0,l=n.length;a<l;a++){const h=n.charCodeAt(a);if(r&&h===37&&a+2<l&&/^[0-9a-f]{2}$/i.test(n.slice(a+1,a+3))){o+=n.slice(a,a+3),a+=2;continue}if(h<128){o+=f[h];continue}if(h>=55296&&h<=57343){if(h>=55296&&h<=56319&&a+1<l){const b=n.charCodeAt(a+1);if(b>=56320&&b<=57343){o+=encodeURIComponent(n[a]+n[a+1]),a++;continue}}o+="%EF%BF%BD";continue}o+=encodeURIComponent(n[a])}return o}Wn.defaultChars=";/?:@&=+$,-_.!~*'()#";Wn.componentChars="-_.!~*'()";function Ir(n){let i="";return i+=n.protocol||"",i+=n.slashes?"//":"",i+=n.auth?n.auth+"@":"",n.hostname&&n.hostname.indexOf(":")!==-1?i+="["+n.hostname+"]":i+=n.hostname||"",i+=n.port?":"+n.port:"",i+=n.pathname||"",i+=n.search||"",i+=n.hash||"",i}function U0(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}const o3=/^([a-z0-9.+-]+:)/i,a3=/:[0-9]*$/,s3=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,l3=["<",">",'"',"`"," ","\r",`
`,"	"],d3=["{","}","|","\\","^","`"].concat(l3),h3=["'"].concat(d3),kf=["%","/","?",";","#"].concat(h3),Cf=["/","?","#"],p3=255,vf=/^[+a-z0-9A-Z_-]{0,63}$/,b3=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,Ef={javascript:!0,"javascript:":!0},Df={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function Rr(n,i){if(n&&n instanceof U0)return n;const r=new U0;return r.parse(n,i),r}U0.prototype.parse=function(n,i){let r,f,o,a=n;if(a=a.trim(),!i&&n.split("#").length===1){const g=s3.exec(a);if(g)return this.pathname=g[1],g[2]&&(this.search=g[2]),this}let l=o3.exec(a);if(l&&(l=l[0],r=l.toLowerCase(),this.protocol=l,a=a.substr(l.length)),(i||l||a.match(/^\/\/[^@\/]+@[^@\/]+/))&&(o=a.substr(0,2)==="//",o&&!(l&&Ef[l])&&(a=a.substr(2),this.slashes=!0)),!Ef[l]&&(o||l&&!Df[l])){let g=-1;for(let k=0;k<Cf.length;k++)f=a.indexOf(Cf[k]),f!==-1&&(g===-1||f<g)&&(g=f);let E,v;g===-1?v=a.lastIndexOf("@"):v=a.lastIndexOf("@",g),v!==-1&&(E=a.slice(0,v),a=a.slice(v+1),this.auth=E),g=-1;for(let k=0;k<kf.length;k++)f=a.indexOf(kf[k]),f!==-1&&(g===-1||f<g)&&(g=f);g===-1&&(g=a.length),a[g-1]===":"&&g--;const T=a.slice(0,g);a=a.slice(g),this.parseHost(T),this.hostname=this.hostname||"";const S=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!S){const k=this.hostname.split(/\./);for(let W=0,q=k.length;W<q;W++){const J=k[W];if(J&&!J.match(vf)){let O="";for(let B=0,M=J.length;B<M;B++)J.charCodeAt(B)>127?O+="x":O+=J[B];if(!O.match(vf)){const B=k.slice(0,W),M=k.slice(W+1),P=J.match(b3);P&&(B.push(P[1]),M.unshift(P[2])),M.length&&(a=M.join(".")+a),this.hostname=B.join(".");break}}}}this.hostname.length>p3&&(this.hostname=""),S&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}const h=a.indexOf("#");h!==-1&&(this.hash=a.substr(h),a=a.slice(0,h));const b=a.indexOf("?");return b!==-1&&(this.search=a.substr(b),a=a.slice(0,b)),a&&(this.pathname=a),Df[r]&&this.hostname&&!this.pathname&&(this.pathname=""),this};U0.prototype.parseHost=function(n){let i=a3.exec(n);i&&(i=i[0],i!==":"&&(this.port=i.substr(1)),n=n.substr(0,n.length-i.length)),n&&(this.hostname=n)};const _3=Object.freeze(Object.defineProperty({__proto__:null,decode:sn,encode:Wn,format:Ir,parse:Rr},Symbol.toStringTag,{value:"Module"})),Nf=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,Uf=/[\0-\x1F\x7F-\x9F]/,g3=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/,Lr=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/,Wf=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/,$f=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/,x3=Object.freeze(Object.defineProperty({__proto__:null,Any:Nf,Cc:Uf,Cf:g3,P:Lr,S:Wf,Z:$f},Symbol.toStringTag,{value:"Module"})),m3=new Uint16Array('ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map(n=>n.charCodeAt(0))),A3=new Uint16Array("Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map(n=>n.charCodeAt(0)));var Ar;const k3=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),C3=(Ar=String.fromCodePoint)!==null&&Ar!==void 0?Ar:function(n){let i="";return n>65535&&(n-=65536,i+=String.fromCharCode(n>>>10&1023|55296),n=56320|n&1023),i+=String.fromCharCode(n),i};function v3(n){var i;return n>=55296&&n<=57343||n>1114111?65533:(i=k3.get(n))!==null&&i!==void 0?i:n}var _u;(function(n){n[n.NUM=35]="NUM",n[n.SEMI=59]="SEMI",n[n.EQUALS=61]="EQUALS",n[n.ZERO=48]="ZERO",n[n.NINE=57]="NINE",n[n.LOWER_A=97]="LOWER_A",n[n.LOWER_F=102]="LOWER_F",n[n.LOWER_X=120]="LOWER_X",n[n.LOWER_Z=122]="LOWER_Z",n[n.UPPER_A=65]="UPPER_A",n[n.UPPER_F=70]="UPPER_F",n[n.UPPER_Z=90]="UPPER_Z"})(_u||(_u={}));const E3=32;var Re;(function(n){n[n.VALUE_LENGTH=49152]="VALUE_LENGTH",n[n.BRANCH_LENGTH=16256]="BRANCH_LENGTH",n[n.JUMP_TABLE=127]="JUMP_TABLE"})(Re||(Re={}));function Fr(n){return n>=_u.ZERO&&n<=_u.NINE}function D3(n){return n>=_u.UPPER_A&&n<=_u.UPPER_F||n>=_u.LOWER_A&&n<=_u.LOWER_F}function y3(n){return n>=_u.UPPER_A&&n<=_u.UPPER_Z||n>=_u.LOWER_A&&n<=_u.LOWER_Z||Fr(n)}function F3(n){return n===_u.EQUALS||y3(n)}var bu;(function(n){n[n.EntityStart=0]="EntityStart",n[n.NumericStart=1]="NumericStart",n[n.NumericDecimal=2]="NumericDecimal",n[n.NumericHex=3]="NumericHex",n[n.NamedEntity=4]="NamedEntity"})(bu||(bu={}));var Ie;(function(n){n[n.Legacy=0]="Legacy",n[n.Strict=1]="Strict",n[n.Attribute=2]="Attribute"})(Ie||(Ie={}));class w3{constructor(i,r,f){this.decodeTree=i,this.emitCodePoint=r,this.errors=f,this.state=bu.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=Ie.Strict}startEntity(i){this.decodeMode=i,this.state=bu.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(i,r){switch(this.state){case bu.EntityStart:return i.charCodeAt(r)===_u.NUM?(this.state=bu.NumericStart,this.consumed+=1,this.stateNumericStart(i,r+1)):(this.state=bu.NamedEntity,this.stateNamedEntity(i,r));case bu.NumericStart:return this.stateNumericStart(i,r);case bu.NumericDecimal:return this.stateNumericDecimal(i,r);case bu.NumericHex:return this.stateNumericHex(i,r);case bu.NamedEntity:return this.stateNamedEntity(i,r)}}stateNumericStart(i,r){return r>=i.length?-1:(i.charCodeAt(r)|E3)===_u.LOWER_X?(this.state=bu.NumericHex,this.consumed+=1,this.stateNumericHex(i,r+1)):(this.state=bu.NumericDecimal,this.stateNumericDecimal(i,r))}addToNumericResult(i,r,f,o){if(r!==f){const a=f-r;this.result=this.result*Math.pow(o,a)+parseInt(i.substr(r,a),o),this.consumed+=a}}stateNumericHex(i,r){const f=r;for(;r<i.length;){const o=i.charCodeAt(r);if(Fr(o)||D3(o))r+=1;else return this.addToNumericResult(i,f,r,16),this.emitNumericEntity(o,3)}return this.addToNumericResult(i,f,r,16),-1}stateNumericDecimal(i,r){const f=r;for(;r<i.length;){const o=i.charCodeAt(r);if(Fr(o))r+=1;else return this.addToNumericResult(i,f,r,10),this.emitNumericEntity(o,2)}return this.addToNumericResult(i,f,r,10),-1}emitNumericEntity(i,r){var f;if(this.consumed<=r)return(f=this.errors)===null||f===void 0||f.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(i===_u.SEMI)this.consumed+=1;else if(this.decodeMode===Ie.Strict)return 0;return this.emitCodePoint(v3(this.result),this.consumed),this.errors&&(i!==_u.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(i,r){const{decodeTree:f}=this;let o=f[this.treeIndex],a=(o&Re.VALUE_LENGTH)>>14;for(;r<i.length;r++,this.excess++){const l=i.charCodeAt(r);if(this.treeIndex=S3(f,o,this.treeIndex+Math.max(1,a),l),this.treeIndex<0)return this.result===0||this.decodeMode===Ie.Attribute&&(a===0||F3(l))?0:this.emitNotTerminatedNamedEntity();if(o=f[this.treeIndex],a=(o&Re.VALUE_LENGTH)>>14,a!==0){if(l===_u.SEMI)return this.emitNamedEntityData(this.treeIndex,a,this.consumed+this.excess);this.decodeMode!==Ie.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var i;const{result:r,decodeTree:f}=this,o=(f[r]&Re.VALUE_LENGTH)>>14;return this.emitNamedEntityData(r,o,this.consumed),(i=this.errors)===null||i===void 0||i.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(i,r,f){const{decodeTree:o}=this;return this.emitCodePoint(r===1?o[i]&~Re.VALUE_LENGTH:o[i+1],f),r===3&&this.emitCodePoint(o[i+2],f),f}end(){var i;switch(this.state){case bu.NamedEntity:return this.result!==0&&(this.decodeMode!==Ie.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case bu.NumericDecimal:return this.emitNumericEntity(0,2);case bu.NumericHex:return this.emitNumericEntity(0,3);case bu.NumericStart:return(i=this.errors)===null||i===void 0||i.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case bu.EntityStart:return 0}}}function Hf(n){let i="";const r=new w3(n,f=>i+=C3(f));return function(o,a){let l=0,h=0;for(;(h=o.indexOf("&",h))>=0;){i+=o.slice(l,h),r.startEntity(a);const g=r.write(o,h+1);if(g<0){l=h+r.end();break}l=h+g,h=g===0?l+1:l}const b=i+o.slice(l);return i="",b}}function S3(n,i,r,f){const o=(i&Re.BRANCH_LENGTH)>>7,a=i&Re.JUMP_TABLE;if(o===0)return a!==0&&f===a?r:-1;if(a){const b=f-a;return b<0||b>=o?-1:n[r+b]-1}let l=r,h=l+o-1;for(;l<=h;){const b=l+h>>>1,g=n[b];if(g<f)l=b+1;else if(g>f)h=b-1;else return n[b+o]}return-1}const T3=Hf(m3);Hf(A3);function Zf(n,i=Ie.Legacy){return T3(n,i)}function I3(n){return Object.prototype.toString.call(n)}function Br(n){return I3(n)==="[object String]"}const R3=Object.prototype.hasOwnProperty;function L3(n,i){return R3.call(n,i)}function H0(n){return Array.prototype.slice.call(arguments,1).forEach(function(r){if(r){if(typeof r!="object")throw new TypeError(r+"must be object");Object.keys(r).forEach(function(f){n[f]=r[f]})}}),n}function Gf(n,i,r){return[].concat(n.slice(0,i),r,n.slice(i+1))}function Or(n){return!(n>=55296&&n<=57343||n>=64976&&n<=65007||(n&65535)===65535||(n&65535)===65534||n>=0&&n<=8||n===11||n>=14&&n<=31||n>=127&&n<=159||n>1114111)}function W0(n){if(n>65535){n-=65536;const i=55296+(n>>10),r=56320+(n&1023);return String.fromCharCode(i,r)}return String.fromCharCode(n)}const Kf=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,B3=/&([a-z#][a-z0-9]{1,31});/gi,O3=new RegExp(Kf.source+"|"+B3.source,"gi"),M3=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function P3(n,i){if(i.charCodeAt(0)===35&&M3.test(i)){const f=i[1].toLowerCase()==="x"?parseInt(i.slice(2),16):parseInt(i.slice(1),10);return Or(f)?W0(f):n}const r=Zf(n);return r!==n?r:n}function z3(n){return n.indexOf("\\")<0?n:n.replace(Kf,"$1")}function ln(n){return n.indexOf("\\")<0&&n.indexOf("&")<0?n:n.replace(O3,function(i,r,f){return r||P3(i,f)})}const q3=/[&<>"]/,N3=/[&<>"]/g,U3={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function W3(n){return U3[n]}function Le(n){return q3.test(n)?n.replace(N3,W3):n}const $3=/[.?*+^$[\]\\(){}|-]/g;function H3(n){return n.replace($3,"\\$&")}function iu(n){switch(n){case 9:case 32:return!0}return!1}function zn(n){if(n>=8192&&n<=8202)return!0;switch(n){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function qn(n){return Lr.test(n)||Wf.test(n)}function Nn(n){switch(n){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function Z0(n){return n=n.trim().replace(/\s+/g," "),"ẞ".toLowerCase()==="Ṿ"&&(n=n.replace(/ẞ/g,"ß")),n.toLowerCase().toUpperCase()}const Z3={mdurl:_3,ucmicro:x3},G3=Object.freeze(Object.defineProperty({__proto__:null,arrayReplaceAt:Gf,assign:H0,escapeHtml:Le,escapeRE:H3,fromCodePoint:W0,has:L3,isMdAsciiPunct:Nn,isPunctChar:qn,isSpace:iu,isString:Br,isValidEntityCode:Or,isWhiteSpace:zn,lib:Z3,normalizeReference:Z0,unescapeAll:ln,unescapeMd:z3},Symbol.toStringTag,{value:"Module"}));function K3(n,i,r){let f,o,a,l;const h=n.posMax,b=n.pos;for(n.pos=i+1,f=1;n.pos<h;){if(a=n.src.charCodeAt(n.pos),a===93&&(f--,f===0)){o=!0;break}if(l=n.pos,n.md.inline.skipToken(n),a===91){if(l===n.pos-1)f++;else if(r)return n.pos=b,-1}}let g=-1;return o&&(g=n.pos),n.pos=b,g}function Y3(n,i,r){let f,o=i;const a={ok:!1,pos:0,str:""};if(n.charCodeAt(o)===60){for(o++;o<r;){if(f=n.charCodeAt(o),f===10||f===60)return a;if(f===62)return a.pos=o+1,a.str=ln(n.slice(i+1,o)),a.ok=!0,a;if(f===92&&o+1<r){o+=2;continue}o++}return a}let l=0;for(;o<r&&(f=n.charCodeAt(o),!(f===32||f<32||f===127));){if(f===92&&o+1<r){if(n.charCodeAt(o+1)===32)break;o+=2;continue}if(f===40&&(l++,l>32))return a;if(f===41){if(l===0)break;l--}o++}return i===o||l!==0||(a.str=ln(n.slice(i,o)),a.pos=o,a.ok=!0),a}function J3(n,i,r,f){let o,a=i;const l={ok:!1,can_continue:!1,pos:0,str:"",marker:0};if(f)l.str=f.str,l.marker=f.marker;else{if(a>=r)return l;let h=n.charCodeAt(a);if(h!==34&&h!==39&&h!==40)return l;i++,a++,h===40&&(h=41),l.marker=h}for(;a<r;){if(o=n.charCodeAt(a),o===l.marker)return l.pos=a+1,l.str+=ln(n.slice(i,a)),l.ok=!0,l;if(o===40&&l.marker===41)return l;o===92&&a+1<r&&a++,a++}return l.can_continue=!0,l.str+=ln(n.slice(i,a)),l}const X3=Object.freeze(Object.defineProperty({__proto__:null,parseLinkDestination:Y3,parseLinkLabel:K3,parseLinkTitle:J3},Symbol.toStringTag,{value:"Module"})),ce={};ce.code_inline=function(n,i,r,f,o){const a=n[i];return"<code"+o.renderAttrs(a)+">"+Le(a.content)+"</code>"};ce.code_block=function(n,i,r,f,o){const a=n[i];return"<pre"+o.renderAttrs(a)+"><code>"+Le(n[i].content)+`</code></pre>
`};ce.fence=function(n,i,r,f,o){const a=n[i],l=a.info?ln(a.info).trim():"";let h="",b="";if(l){const E=l.split(/(\s+)/g);h=E[0],b=E.slice(2).join("")}let g;if(r.highlight?g=r.highlight(a.content,h,b)||Le(a.content):g=Le(a.content),g.indexOf("<pre")===0)return g+`
`;if(l){const E=a.attrIndex("class"),v=a.attrs?a.attrs.slice():[];E<0?v.push(["class",r.langPrefix+h]):(v[E]=v[E].slice(),v[E][1]+=" "+r.langPrefix+h);const T={attrs:v};return`<pre><code${o.renderAttrs(T)}>${g}</code></pre>
`}return`<pre><code${o.renderAttrs(a)}>${g}</code></pre>
`};ce.image=function(n,i,r,f,o){const a=n[i];return a.attrs[a.attrIndex("alt")][1]=o.renderInlineAsText(a.children,r,f),o.renderToken(n,i,r)};ce.hardbreak=function(n,i,r){return r.xhtmlOut?`<br />
`:`<br>
`};ce.softbreak=function(n,i,r){return r.breaks?r.xhtmlOut?`<br />
`:`<br>
`:`
`};ce.text=function(n,i){return Le(n[i].content)};ce.html_block=function(n,i){return n[i].content};ce.html_inline=function(n,i){return n[i].content};function dn(){this.rules=H0({},ce)}dn.prototype.renderAttrs=function(i){let r,f,o;if(!i.attrs)return"";for(o="",r=0,f=i.attrs.length;r<f;r++)o+=" "+Le(i.attrs[r][0])+'="'+Le(i.attrs[r][1])+'"';return o};dn.prototype.renderToken=function(i,r,f){const o=i[r];let a="";if(o.hidden)return"";o.block&&o.nesting!==-1&&r&&i[r-1].hidden&&(a+=`
`),a+=(o.nesting===-1?"</":"<")+o.tag,a+=this.renderAttrs(o),o.nesting===0&&f.xhtmlOut&&(a+=" /");let l=!1;if(o.block&&(l=!0,o.nesting===1&&r+1<i.length)){const h=i[r+1];(h.type==="inline"||h.hidden||h.nesting===-1&&h.tag===o.tag)&&(l=!1)}return a+=l?`>
`:">",a};dn.prototype.renderInline=function(n,i,r){let f="";const o=this.rules;for(let a=0,l=n.length;a<l;a++){const h=n[a].type;typeof o[h]!="undefined"?f+=o[h](n,a,i,r,this):f+=this.renderToken(n,a,i)}return f};dn.prototype.renderInlineAsText=function(n,i,r){let f="";for(let o=0,a=n.length;o<a;o++)switch(n[o].type){case"text":f+=n[o].content;break;case"image":f+=this.renderInlineAsText(n[o].children,i,r);break;case"html_inline":case"html_block":f+=n[o].content;break;case"softbreak":case"hardbreak":f+=`
`;break}return f};dn.prototype.render=function(n,i,r){let f="";const o=this.rules;for(let a=0,l=n.length;a<l;a++){const h=n[a].type;h==="inline"?f+=this.renderInline(n[a].children,i,r):typeof o[h]!="undefined"?f+=o[h](n,a,i,r,this):f+=this.renderToken(n,a,i,r)}return f};function Su(){this.__rules__=[],this.__cache__=null}Su.prototype.__find__=function(n){for(let i=0;i<this.__rules__.length;i++)if(this.__rules__[i].name===n)return i;return-1};Su.prototype.__compile__=function(){const n=this,i=[""];n.__rules__.forEach(function(r){r.enabled&&r.alt.forEach(function(f){i.indexOf(f)<0&&i.push(f)})}),n.__cache__={},i.forEach(function(r){n.__cache__[r]=[],n.__rules__.forEach(function(f){f.enabled&&(r&&f.alt.indexOf(r)<0||n.__cache__[r].push(f.fn))})})};Su.prototype.at=function(n,i,r){const f=this.__find__(n),o=r||{};if(f===-1)throw new Error("Parser rule not found: "+n);this.__rules__[f].fn=i,this.__rules__[f].alt=o.alt||[],this.__cache__=null};Su.prototype.before=function(n,i,r,f){const o=this.__find__(n),a=f||{};if(o===-1)throw new Error("Parser rule not found: "+n);this.__rules__.splice(o,0,{name:i,enabled:!0,fn:r,alt:a.alt||[]}),this.__cache__=null};Su.prototype.after=function(n,i,r,f){const o=this.__find__(n),a=f||{};if(o===-1)throw new Error("Parser rule not found: "+n);this.__rules__.splice(o+1,0,{name:i,enabled:!0,fn:r,alt:a.alt||[]}),this.__cache__=null};Su.prototype.push=function(n,i,r){const f=r||{};this.__rules__.push({name:n,enabled:!0,fn:i,alt:f.alt||[]}),this.__cache__=null};Su.prototype.enable=function(n,i){Array.isArray(n)||(n=[n]);const r=[];return n.forEach(function(f){const o=this.__find__(f);if(o<0){if(i)return;throw new Error("Rules manager: invalid rule name "+f)}this.__rules__[o].enabled=!0,r.push(f)},this),this.__cache__=null,r};Su.prototype.enableOnly=function(n,i){Array.isArray(n)||(n=[n]),this.__rules__.forEach(function(r){r.enabled=!1}),this.enable(n,i)};Su.prototype.disable=function(n,i){Array.isArray(n)||(n=[n]);const r=[];return n.forEach(function(f){const o=this.__find__(f);if(o<0){if(i)return;throw new Error("Rules manager: invalid rule name "+f)}this.__rules__[o].enabled=!1,r.push(f)},this),this.__cache__=null,r};Su.prototype.getRules=function(n){return this.__cache__===null&&this.__compile__(),this.__cache__[n]||[]};function ju(n,i,r){this.type=n,this.tag=i,this.attrs=null,this.map=null,this.nesting=r,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}ju.prototype.attrIndex=function(i){if(!this.attrs)return-1;const r=this.attrs;for(let f=0,o=r.length;f<o;f++)if(r[f][0]===i)return f;return-1};ju.prototype.attrPush=function(i){this.attrs?this.attrs.push(i):this.attrs=[i]};ju.prototype.attrSet=function(i,r){const f=this.attrIndex(i),o=[i,r];f<0?this.attrPush(o):this.attrs[f]=o};ju.prototype.attrGet=function(i){const r=this.attrIndex(i);let f=null;return r>=0&&(f=this.attrs[r][1]),f};ju.prototype.attrJoin=function(i,r){const f=this.attrIndex(i);f<0?this.attrPush([i,r]):this.attrs[f][1]=this.attrs[f][1]+" "+r};function Yf(n,i,r){this.src=n,this.env=r,this.tokens=[],this.inlineMode=!1,this.md=i}Yf.prototype.Token=ju;const V3=/\r\n?|\n/g,Q3=/\0/g;function j3(n){let i;i=n.src.replace(V3,`
`),i=i.replace(Q3,"�"),n.src=i}function u6(n){let i;n.inlineMode?(i=new n.Token("inline","",0),i.content=n.src,i.map=[0,1],i.children=[],n.tokens.push(i)):n.md.block.parse(n.src,n.md,n.env,n.tokens)}function e6(n){const i=n.tokens;for(let r=0,f=i.length;r<f;r++){const o=i[r];o.type==="inline"&&n.md.inline.parse(o.content,n.md,n.env,o.children)}}function n6(n){return/^<a[>\s]/i.test(n)}function t6(n){return/^<\/a\s*>/i.test(n)}function r6(n){const i=n.tokens;if(n.md.options.linkify)for(let r=0,f=i.length;r<f;r++){if(i[r].type!=="inline"||!n.md.linkify.pretest(i[r].content))continue;let o=i[r].children,a=0;for(let l=o.length-1;l>=0;l--){const h=o[l];if(h.type==="link_close"){for(l--;o[l].level!==h.level&&o[l].type!=="link_open";)l--;continue}if(h.type==="html_inline"&&(n6(h.content)&&a>0&&a--,t6(h.content)&&a++),!(a>0)&&h.type==="text"&&n.md.linkify.test(h.content)){const b=h.content;let g=n.md.linkify.match(b);const E=[];let v=h.level,T=0;g.length>0&&g[0].index===0&&l>0&&o[l-1].type==="text_special"&&(g=g.slice(1));for(let S=0;S<g.length;S++){const k=g[S].url,W=n.md.normalizeLink(k);if(!n.md.validateLink(W))continue;let q=g[S].text;g[S].schema?g[S].schema==="mailto:"&&!/^mailto:/i.test(q)?q=n.md.normalizeLinkText("mailto:"+q).replace(/^mailto:/,""):q=n.md.normalizeLinkText(q):q=n.md.normalizeLinkText("http://"+q).replace(/^http:\/\//,"");const J=g[S].index;if(J>T){const P=new n.Token("text","",0);P.content=b.slice(T,J),P.level=v,E.push(P)}const O=new n.Token("link_open","a",1);O.attrs=[["href",W]],O.level=v++,O.markup="linkify",O.info="auto",E.push(O);const B=new n.Token("text","",0);B.content=q,B.level=v,E.push(B);const M=new n.Token("link_close","a",-1);M.level=--v,M.markup="linkify",M.info="auto",E.push(M),T=g[S].lastIndex}if(T<b.length){const S=new n.Token("text","",0);S.content=b.slice(T),S.level=v,E.push(S)}i[r].children=o=Gf(o,l,E)}}}}const Jf=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,i6=/\((c|tm|r)\)/i,c6=/\((c|tm|r)\)/ig,f6={c:"©",r:"®",tm:"™"};function o6(n,i){return f6[i.toLowerCase()]}function a6(n){let i=0;for(let r=n.length-1;r>=0;r--){const f=n[r];f.type==="text"&&!i&&(f.content=f.content.replace(c6,o6)),f.type==="link_open"&&f.info==="auto"&&i--,f.type==="link_close"&&f.info==="auto"&&i++}}function s6(n){let i=0;for(let r=n.length-1;r>=0;r--){const f=n[r];f.type==="text"&&!i&&Jf.test(f.content)&&(f.content=f.content.replace(/\+-/g,"±").replace(/\.{2,}/g,"…").replace(/([?!])…/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---(?=[^-]|$)/mg,"$1—").replace(/(^|\s)--(?=\s|$)/mg,"$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg,"$1–")),f.type==="link_open"&&f.info==="auto"&&i--,f.type==="link_close"&&f.info==="auto"&&i++}}function l6(n){let i;if(n.md.options.typographer)for(i=n.tokens.length-1;i>=0;i--)n.tokens[i].type==="inline"&&(i6.test(n.tokens[i].content)&&a6(n.tokens[i].children),Jf.test(n.tokens[i].content)&&s6(n.tokens[i].children))}const d6=/['"]/,yf=/['"]/g,Ff="’";function z0(n,i,r){return n.slice(0,i)+r+n.slice(i+1)}function h6(n,i){let r;const f=[];for(let o=0;o<n.length;o++){const a=n[o],l=n[o].level;for(r=f.length-1;r>=0&&!(f[r].level<=l);r--);if(f.length=r+1,a.type!=="text")continue;let h=a.content,b=0,g=h.length;u:for(;b<g;){yf.lastIndex=b;const E=yf.exec(h);if(!E)break;let v=!0,T=!0;b=E.index+1;const S=E[0]==="'";let k=32;if(E.index-1>=0)k=h.charCodeAt(E.index-1);else for(r=o-1;r>=0&&!(n[r].type==="softbreak"||n[r].type==="hardbreak");r--)if(n[r].content){k=n[r].content.charCodeAt(n[r].content.length-1);break}let W=32;if(b<g)W=h.charCodeAt(b);else for(r=o+1;r<n.length&&!(n[r].type==="softbreak"||n[r].type==="hardbreak");r++)if(n[r].content){W=n[r].content.charCodeAt(0);break}const q=Nn(k)||qn(String.fromCharCode(k)),J=Nn(W)||qn(String.fromCharCode(W)),O=zn(k),B=zn(W);if(B?v=!1:J&&(O||q||(v=!1)),O?T=!1:q&&(B||J||(T=!1)),W===34&&E[0]==='"'&&k>=48&&k<=57&&(T=v=!1),v&&T&&(v=q,T=J),!v&&!T){S&&(a.content=z0(a.content,E.index,Ff));continue}if(T)for(r=f.length-1;r>=0;r--){let M=f[r];if(f[r].level<l)break;if(M.single===S&&f[r].level===l){M=f[r];let P,K;S?(P=i.md.options.quotes[2],K=i.md.options.quotes[3]):(P=i.md.options.quotes[0],K=i.md.options.quotes[1]),a.content=z0(a.content,E.index,K),n[M.token].content=z0(n[M.token].content,M.pos,P),b+=K.length-1,M.token===o&&(b+=P.length-1),h=a.content,g=h.length,f.length=r;continue u}}v?f.push({token:o,pos:E.index,single:S,level:l}):T&&S&&(a.content=z0(a.content,E.index,Ff))}}}function p6(n){if(n.md.options.typographer)for(let i=n.tokens.length-1;i>=0;i--)n.tokens[i].type!=="inline"||!d6.test(n.tokens[i].content)||h6(n.tokens[i].children,n)}function b6(n){let i,r;const f=n.tokens,o=f.length;for(let a=0;a<o;a++){if(f[a].type!=="inline")continue;const l=f[a].children,h=l.length;for(i=0;i<h;i++)l[i].type==="text_special"&&(l[i].type="text");for(i=r=0;i<h;i++)l[i].type==="text"&&i+1<h&&l[i+1].type==="text"?l[i+1].content=l[i].content+l[i+1].content:(i!==r&&(l[r]=l[i]),r++);i!==r&&(l.length=r)}}const kr=[["normalize",j3],["block",u6],["inline",e6],["linkify",r6],["replacements",l6],["smartquotes",p6],["text_join",b6]];function Mr(){this.ruler=new Su;for(let n=0;n<kr.length;n++)this.ruler.push(kr[n][0],kr[n][1])}Mr.prototype.process=function(n){const i=this.ruler.getRules("");for(let r=0,f=i.length;r<f;r++)i[r](n)};Mr.prototype.State=Yf;function fe(n,i,r,f){this.src=n,this.md=i,this.env=r,this.tokens=f,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0;const o=this.src;for(let a=0,l=0,h=0,b=0,g=o.length,E=!1;l<g;l++){const v=o.charCodeAt(l);if(!E)if(iu(v)){h++,v===9?b+=4-b%4:b++;continue}else E=!0;(v===10||l===g-1)&&(v!==10&&l++,this.bMarks.push(a),this.eMarks.push(l),this.tShift.push(h),this.sCount.push(b),this.bsCount.push(0),E=!1,h=0,b=0,a=l+1)}this.bMarks.push(o.length),this.eMarks.push(o.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}fe.prototype.push=function(n,i,r){const f=new ju(n,i,r);return f.block=!0,r<0&&this.level--,f.level=this.level,r>0&&this.level++,this.tokens.push(f),f};fe.prototype.isEmpty=function(i){return this.bMarks[i]+this.tShift[i]>=this.eMarks[i]};fe.prototype.skipEmptyLines=function(i){for(let r=this.lineMax;i<r&&!(this.bMarks[i]+this.tShift[i]<this.eMarks[i]);i++);return i};fe.prototype.skipSpaces=function(i){for(let r=this.src.length;i<r;i++){const f=this.src.charCodeAt(i);if(!iu(f))break}return i};fe.prototype.skipSpacesBack=function(i,r){if(i<=r)return i;for(;i>r;)if(!iu(this.src.charCodeAt(--i)))return i+1;return i};fe.prototype.skipChars=function(i,r){for(let f=this.src.length;i<f&&this.src.charCodeAt(i)===r;i++);return i};fe.prototype.skipCharsBack=function(i,r,f){if(i<=f)return i;for(;i>f;)if(r!==this.src.charCodeAt(--i))return i+1;return i};fe.prototype.getLines=function(i,r,f,o){if(i>=r)return"";const a=new Array(r-i);for(let l=0,h=i;h<r;h++,l++){let b=0;const g=this.bMarks[h];let E=g,v;for(h+1<r||o?v=this.eMarks[h]+1:v=this.eMarks[h];E<v&&b<f;){const T=this.src.charCodeAt(E);if(iu(T))T===9?b+=4-(b+this.bsCount[h])%4:b++;else if(E-g<this.tShift[h])b++;else break;E++}b>f?a[l]=new Array(b-f+1).join(" ")+this.src.slice(E,v):a[l]=this.src.slice(E,v)}return a.join("")};fe.prototype.Token=ju;const _6=65536;function Cr(n,i){const r=n.bMarks[i]+n.tShift[i],f=n.eMarks[i];return n.src.slice(r,f)}function wf(n){const i=[],r=n.length;let f=0,o=n.charCodeAt(f),a=!1,l=0,h="";for(;f<r;)o===124&&(a?(h+=n.substring(l,f-1),l=f):(i.push(h+n.substring(l,f)),h="",l=f+1)),a=o===92,f++,o=n.charCodeAt(f);return i.push(h+n.substring(l)),i}function g6(n,i,r,f){if(i+2>r)return!1;let o=i+1;if(n.sCount[o]<n.blkIndent||n.sCount[o]-n.blkIndent>=4)return!1;let a=n.bMarks[o]+n.tShift[o];if(a>=n.eMarks[o])return!1;const l=n.src.charCodeAt(a++);if(l!==124&&l!==45&&l!==58||a>=n.eMarks[o])return!1;const h=n.src.charCodeAt(a++);if(h!==124&&h!==45&&h!==58&&!iu(h)||l===45&&iu(h))return!1;for(;a<n.eMarks[o];){const M=n.src.charCodeAt(a);if(M!==124&&M!==45&&M!==58&&!iu(M))return!1;a++}let b=Cr(n,i+1),g=b.split("|");const E=[];for(let M=0;M<g.length;M++){const P=g[M].trim();if(!P){if(M===0||M===g.length-1)continue;return!1}if(!/^:?-+:?$/.test(P))return!1;P.charCodeAt(P.length-1)===58?E.push(P.charCodeAt(0)===58?"center":"right"):P.charCodeAt(0)===58?E.push("left"):E.push("")}if(b=Cr(n,i).trim(),b.indexOf("|")===-1||n.sCount[i]-n.blkIndent>=4)return!1;g=wf(b),g.length&&g[0]===""&&g.shift(),g.length&&g[g.length-1]===""&&g.pop();const v=g.length;if(v===0||v!==E.length)return!1;if(f)return!0;const T=n.parentType;n.parentType="table";const S=n.md.block.ruler.getRules("blockquote"),k=n.push("table_open","table",1),W=[i,0];k.map=W;const q=n.push("thead_open","thead",1);q.map=[i,i+1];const J=n.push("tr_open","tr",1);J.map=[i,i+1];for(let M=0;M<g.length;M++){const P=n.push("th_open","th",1);E[M]&&(P.attrs=[["style","text-align:"+E[M]]]);const K=n.push("inline","",0);K.content=g[M].trim(),K.children=[],n.push("th_close","th",-1)}n.push("tr_close","tr",-1),n.push("thead_close","thead",-1);let O,B=0;for(o=i+2;o<r&&!(n.sCount[o]<n.blkIndent);o++){let M=!1;for(let K=0,nu=S.length;K<nu;K++)if(S[K](n,o,r,!0)){M=!0;break}if(M||(b=Cr(n,o).trim(),!b)||n.sCount[o]-n.blkIndent>=4||(g=wf(b),g.length&&g[0]===""&&g.shift(),g.length&&g[g.length-1]===""&&g.pop(),B+=v-g.length,B>_6))break;if(o===i+2){const K=n.push("tbody_open","tbody",1);K.map=O=[i+2,0]}const P=n.push("tr_open","tr",1);P.map=[o,o+1];for(let K=0;K<v;K++){const nu=n.push("td_open","td",1);E[K]&&(nu.attrs=[["style","text-align:"+E[K]]]);const gu=n.push("inline","",0);gu.content=g[K]?g[K].trim():"",gu.children=[],n.push("td_close","td",-1)}n.push("tr_close","tr",-1)}return O&&(n.push("tbody_close","tbody",-1),O[1]=o),n.push("table_close","table",-1),W[1]=o,n.parentType=T,n.line=o,!0}function x6(n,i,r){if(n.sCount[i]-n.blkIndent<4)return!1;let f=i+1,o=f;for(;f<r;){if(n.isEmpty(f)){f++;continue}if(n.sCount[f]-n.blkIndent>=4){f++,o=f;continue}break}n.line=o;const a=n.push("code_block","code",0);return a.content=n.getLines(i,o,4+n.blkIndent,!1)+`
`,a.map=[i,n.line],!0}function m6(n,i,r,f){let o=n.bMarks[i]+n.tShift[i],a=n.eMarks[i];if(n.sCount[i]-n.blkIndent>=4||o+3>a)return!1;const l=n.src.charCodeAt(o);if(l!==126&&l!==96)return!1;let h=o;o=n.skipChars(o,l);let b=o-h;if(b<3)return!1;const g=n.src.slice(h,o),E=n.src.slice(o,a);if(l===96&&E.indexOf(String.fromCharCode(l))>=0)return!1;if(f)return!0;let v=i,T=!1;for(;v++,!(v>=r||(o=h=n.bMarks[v]+n.tShift[v],a=n.eMarks[v],o<a&&n.sCount[v]<n.blkIndent));)if(n.src.charCodeAt(o)===l&&!(n.sCount[v]-n.blkIndent>=4)&&(o=n.skipChars(o,l),!(o-h<b)&&(o=n.skipSpaces(o),!(o<a)))){T=!0;break}b=n.sCount[i],n.line=v+(T?1:0);const S=n.push("fence","code",0);return S.info=E,S.content=n.getLines(i+1,v,b,!0),S.markup=g,S.map=[i,n.line],!0}function A6(n,i,r,f){let o=n.bMarks[i]+n.tShift[i],a=n.eMarks[i];const l=n.lineMax;if(n.sCount[i]-n.blkIndent>=4||n.src.charCodeAt(o)!==62)return!1;if(f)return!0;const h=[],b=[],g=[],E=[],v=n.md.block.ruler.getRules("blockquote"),T=n.parentType;n.parentType="blockquote";let S=!1,k;for(k=i;k<r;k++){const B=n.sCount[k]<n.blkIndent;if(o=n.bMarks[k]+n.tShift[k],a=n.eMarks[k],o>=a)break;if(n.src.charCodeAt(o++)===62&&!B){let P=n.sCount[k]+1,K,nu;n.src.charCodeAt(o)===32?(o++,P++,nu=!1,K=!0):n.src.charCodeAt(o)===9?(K=!0,(n.bsCount[k]+P)%4===3?(o++,P++,nu=!1):nu=!0):K=!1;let gu=P;for(h.push(n.bMarks[k]),n.bMarks[k]=o;o<a;){const Pu=n.src.charCodeAt(o);if(iu(Pu))Pu===9?gu+=4-(gu+n.bsCount[k]+(nu?1:0))%4:gu++;else break;o++}S=o>=a,b.push(n.bsCount[k]),n.bsCount[k]=n.sCount[k]+1+(K?1:0),g.push(n.sCount[k]),n.sCount[k]=gu-P,E.push(n.tShift[k]),n.tShift[k]=o-n.bMarks[k];continue}if(S)break;let M=!1;for(let P=0,K=v.length;P<K;P++)if(v[P](n,k,r,!0)){M=!0;break}if(M){n.lineMax=k,n.blkIndent!==0&&(h.push(n.bMarks[k]),b.push(n.bsCount[k]),E.push(n.tShift[k]),g.push(n.sCount[k]),n.sCount[k]-=n.blkIndent);break}h.push(n.bMarks[k]),b.push(n.bsCount[k]),E.push(n.tShift[k]),g.push(n.sCount[k]),n.sCount[k]=-1}const W=n.blkIndent;n.blkIndent=0;const q=n.push("blockquote_open","blockquote",1);q.markup=">";const J=[i,0];q.map=J,n.md.block.tokenize(n,i,k);const O=n.push("blockquote_close","blockquote",-1);O.markup=">",n.lineMax=l,n.parentType=T,J[1]=n.line;for(let B=0;B<E.length;B++)n.bMarks[B+i]=h[B],n.tShift[B+i]=E[B],n.sCount[B+i]=g[B],n.bsCount[B+i]=b[B];return n.blkIndent=W,!0}function k6(n,i,r,f){const o=n.eMarks[i];if(n.sCount[i]-n.blkIndent>=4)return!1;let a=n.bMarks[i]+n.tShift[i];const l=n.src.charCodeAt(a++);if(l!==42&&l!==45&&l!==95)return!1;let h=1;for(;a<o;){const g=n.src.charCodeAt(a++);if(g!==l&&!iu(g))return!1;g===l&&h++}if(h<3)return!1;if(f)return!0;n.line=i+1;const b=n.push("hr","hr",0);return b.map=[i,n.line],b.markup=Array(h+1).join(String.fromCharCode(l)),!0}function Sf(n,i){const r=n.eMarks[i];let f=n.bMarks[i]+n.tShift[i];const o=n.src.charCodeAt(f++);if(o!==42&&o!==45&&o!==43)return-1;if(f<r){const a=n.src.charCodeAt(f);if(!iu(a))return-1}return f}function Tf(n,i){const r=n.bMarks[i]+n.tShift[i],f=n.eMarks[i];let o=r;if(o+1>=f)return-1;let a=n.src.charCodeAt(o++);if(a<48||a>57)return-1;for(;;){if(o>=f)return-1;if(a=n.src.charCodeAt(o++),a>=48&&a<=57){if(o-r>=10)return-1;continue}if(a===41||a===46)break;return-1}return o<f&&(a=n.src.charCodeAt(o),!iu(a))?-1:o}function C6(n,i){const r=n.level+2;for(let f=i+2,o=n.tokens.length-2;f<o;f++)n.tokens[f].level===r&&n.tokens[f].type==="paragraph_open"&&(n.tokens[f+2].hidden=!0,n.tokens[f].hidden=!0,f+=2)}function v6(n,i,r,f){let o,a,l,h,b=i,g=!0;if(n.sCount[b]-n.blkIndent>=4||n.listIndent>=0&&n.sCount[b]-n.listIndent>=4&&n.sCount[b]<n.blkIndent)return!1;let E=!1;f&&n.parentType==="paragraph"&&n.sCount[b]>=n.blkIndent&&(E=!0);let v,T,S;if((S=Tf(n,b))>=0){if(v=!0,l=n.bMarks[b]+n.tShift[b],T=Number(n.src.slice(l,S-1)),E&&T!==1)return!1}else if((S=Sf(n,b))>=0)v=!1;else return!1;if(E&&n.skipSpaces(S)>=n.eMarks[b])return!1;if(f)return!0;const k=n.src.charCodeAt(S-1),W=n.tokens.length;v?(h=n.push("ordered_list_open","ol",1),T!==1&&(h.attrs=[["start",T]])):h=n.push("bullet_list_open","ul",1);const q=[b,0];h.map=q,h.markup=String.fromCharCode(k);let J=!1;const O=n.md.block.ruler.getRules("list"),B=n.parentType;for(n.parentType="list";b<r;){a=S,o=n.eMarks[b];const M=n.sCount[b]+S-(n.bMarks[b]+n.tShift[b]);let P=M;for(;a<o;){const me=n.src.charCodeAt(a);if(me===9)P+=4-(P+n.bsCount[b])%4;else if(me===32)P++;else break;a++}const K=a;let nu;K>=o?nu=1:nu=P-M,nu>4&&(nu=1);const gu=M+nu;h=n.push("list_item_open","li",1),h.markup=String.fromCharCode(k);const Pu=[b,0];h.map=Pu,v&&(h.info=n.src.slice(l,S-1));const Be=n.tight,hn=n.tShift[b],Y0=n.sCount[b],J0=n.listIndent;if(n.listIndent=n.blkIndent,n.blkIndent=gu,n.tight=!0,n.tShift[b]=K-n.bMarks[b],n.sCount[b]=P,K>=o&&n.isEmpty(b+1)?n.line=Math.min(n.line+2,r):n.md.block.tokenize(n,b,r,!0),(!n.tight||J)&&(g=!1),J=n.line-b>1&&n.isEmpty(n.line-1),n.blkIndent=n.listIndent,n.listIndent=J0,n.tShift[b]=hn,n.sCount[b]=Y0,n.tight=Be,h=n.push("list_item_close","li",-1),h.markup=String.fromCharCode(k),b=n.line,Pu[1]=b,b>=r||n.sCount[b]<n.blkIndent||n.sCount[b]-n.blkIndent>=4)break;let pn=!1;for(let me=0,X0=O.length;me<X0;me++)if(O[me](n,b,r,!0)){pn=!0;break}if(pn)break;if(v){if(S=Tf(n,b),S<0)break;l=n.bMarks[b]+n.tShift[b]}else if(S=Sf(n,b),S<0)break;if(k!==n.src.charCodeAt(S-1))break}return v?h=n.push("ordered_list_close","ol",-1):h=n.push("bullet_list_close","ul",-1),h.markup=String.fromCharCode(k),q[1]=b,n.line=b,n.parentType=B,g&&C6(n,W),!0}function E6(n,i,r,f){let o=n.bMarks[i]+n.tShift[i],a=n.eMarks[i],l=i+1;if(n.sCount[i]-n.blkIndent>=4||n.src.charCodeAt(o)!==91)return!1;function h(O){const B=n.lineMax;if(O>=B||n.isEmpty(O))return null;let M=!1;if(n.sCount[O]-n.blkIndent>3&&(M=!0),n.sCount[O]<0&&(M=!0),!M){const nu=n.md.block.ruler.getRules("reference"),gu=n.parentType;n.parentType="reference";let Pu=!1;for(let Be=0,hn=nu.length;Be<hn;Be++)if(nu[Be](n,O,B,!0)){Pu=!0;break}if(n.parentType=gu,Pu)return null}const P=n.bMarks[O]+n.tShift[O],K=n.eMarks[O];return n.src.slice(P,K+1)}let b=n.src.slice(o,a+1);a=b.length;let g=-1;for(o=1;o<a;o++){const O=b.charCodeAt(o);if(O===91)return!1;if(O===93){g=o;break}else if(O===10){const B=h(l);B!==null&&(b+=B,a=b.length,l++)}else if(O===92&&(o++,o<a&&b.charCodeAt(o)===10)){const B=h(l);B!==null&&(b+=B,a=b.length,l++)}}if(g<0||b.charCodeAt(g+1)!==58)return!1;for(o=g+2;o<a;o++){const O=b.charCodeAt(o);if(O===10){const B=h(l);B!==null&&(b+=B,a=b.length,l++)}else if(!iu(O))break}const E=n.md.helpers.parseLinkDestination(b,o,a);if(!E.ok)return!1;const v=n.md.normalizeLink(E.str);if(!n.md.validateLink(v))return!1;o=E.pos;const T=o,S=l,k=o;for(;o<a;o++){const O=b.charCodeAt(o);if(O===10){const B=h(l);B!==null&&(b+=B,a=b.length,l++)}else if(!iu(O))break}let W=n.md.helpers.parseLinkTitle(b,o,a);for(;W.can_continue;){const O=h(l);if(O===null)break;b+=O,o=a,a=b.length,l++,W=n.md.helpers.parseLinkTitle(b,o,a,W)}let q;for(o<a&&k!==o&&W.ok?(q=W.str,o=W.pos):(q="",o=T,l=S);o<a;){const O=b.charCodeAt(o);if(!iu(O))break;o++}if(o<a&&b.charCodeAt(o)!==10&&q)for(q="",o=T,l=S;o<a;){const O=b.charCodeAt(o);if(!iu(O))break;o++}if(o<a&&b.charCodeAt(o)!==10)return!1;const J=Z0(b.slice(1,g));return J?(f||(typeof n.env.references=="undefined"&&(n.env.references={}),typeof n.env.references[J]=="undefined"&&(n.env.references[J]={title:q,href:v}),n.line=l),!0):!1}const D6=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"],y6="[a-zA-Z_:][a-zA-Z0-9:._-]*",F6="[^\"'=<>`\\x00-\\x20]+",w6="'[^']*'",S6='"[^"]*"',T6="(?:"+F6+"|"+w6+"|"+S6+")",I6="(?:\\s+"+y6+"(?:\\s*=\\s*"+T6+")?)",Xf="<[A-Za-z][A-Za-z0-9\\-]*"+I6+"*\\s*\\/?>",Vf="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",R6="<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->",L6="<[?][\\s\\S]*?[?]>",B6="<![A-Za-z][^>]*>",O6="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",M6=new RegExp("^(?:"+Xf+"|"+Vf+"|"+R6+"|"+L6+"|"+B6+"|"+O6+")"),P6=new RegExp("^(?:"+Xf+"|"+Vf+")"),on=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+D6.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(P6.source+"\\s*$"),/^$/,!1]];function z6(n,i,r,f){let o=n.bMarks[i]+n.tShift[i],a=n.eMarks[i];if(n.sCount[i]-n.blkIndent>=4||!n.md.options.html||n.src.charCodeAt(o)!==60)return!1;let l=n.src.slice(o,a),h=0;for(;h<on.length&&!on[h][0].test(l);h++);if(h===on.length)return!1;if(f)return on[h][2];let b=i+1;if(!on[h][1].test(l)){for(;b<r&&!(n.sCount[b]<n.blkIndent);b++)if(o=n.bMarks[b]+n.tShift[b],a=n.eMarks[b],l=n.src.slice(o,a),on[h][1].test(l)){l.length!==0&&b++;break}}n.line=b;const g=n.push("html_block","",0);return g.map=[i,b],g.content=n.getLines(i,b,n.blkIndent,!0),!0}function q6(n,i,r,f){let o=n.bMarks[i]+n.tShift[i],a=n.eMarks[i];if(n.sCount[i]-n.blkIndent>=4)return!1;let l=n.src.charCodeAt(o);if(l!==35||o>=a)return!1;let h=1;for(l=n.src.charCodeAt(++o);l===35&&o<a&&h<=6;)h++,l=n.src.charCodeAt(++o);if(h>6||o<a&&!iu(l))return!1;if(f)return!0;a=n.skipSpacesBack(a,o);const b=n.skipCharsBack(a,35,o);b>o&&iu(n.src.charCodeAt(b-1))&&(a=b),n.line=i+1;const g=n.push("heading_open","h"+String(h),1);g.markup="########".slice(0,h),g.map=[i,n.line];const E=n.push("inline","",0);E.content=n.src.slice(o,a).trim(),E.map=[i,n.line],E.children=[];const v=n.push("heading_close","h"+String(h),-1);return v.markup="########".slice(0,h),!0}function N6(n,i,r){const f=n.md.block.ruler.getRules("paragraph");if(n.sCount[i]-n.blkIndent>=4)return!1;const o=n.parentType;n.parentType="paragraph";let a=0,l,h=i+1;for(;h<r&&!n.isEmpty(h);h++){if(n.sCount[h]-n.blkIndent>3)continue;if(n.sCount[h]>=n.blkIndent){let S=n.bMarks[h]+n.tShift[h];const k=n.eMarks[h];if(S<k&&(l=n.src.charCodeAt(S),(l===45||l===61)&&(S=n.skipChars(S,l),S=n.skipSpaces(S),S>=k))){a=l===61?1:2;break}}if(n.sCount[h]<0)continue;let T=!1;for(let S=0,k=f.length;S<k;S++)if(f[S](n,h,r,!0)){T=!0;break}if(T)break}if(!a)return!1;const b=n.getLines(i,h,n.blkIndent,!1).trim();n.line=h+1;const g=n.push("heading_open","h"+String(a),1);g.markup=String.fromCharCode(l),g.map=[i,n.line];const E=n.push("inline","",0);E.content=b,E.map=[i,n.line-1],E.children=[];const v=n.push("heading_close","h"+String(a),-1);return v.markup=String.fromCharCode(l),n.parentType=o,!0}function U6(n,i,r){const f=n.md.block.ruler.getRules("paragraph"),o=n.parentType;let a=i+1;for(n.parentType="paragraph";a<r&&!n.isEmpty(a);a++){if(n.sCount[a]-n.blkIndent>3||n.sCount[a]<0)continue;let g=!1;for(let E=0,v=f.length;E<v;E++)if(f[E](n,a,r,!0)){g=!0;break}if(g)break}const l=n.getLines(i,a,n.blkIndent,!1).trim();n.line=a;const h=n.push("paragraph_open","p",1);h.map=[i,n.line];const b=n.push("inline","",0);return b.content=l,b.map=[i,n.line],b.children=[],n.push("paragraph_close","p",-1),n.parentType=o,!0}const q0=[["table",g6,["paragraph","reference"]],["code",x6],["fence",m6,["paragraph","reference","blockquote","list"]],["blockquote",A6,["paragraph","reference","blockquote","list"]],["hr",k6,["paragraph","reference","blockquote","list"]],["list",v6,["paragraph","reference","blockquote"]],["reference",E6],["html_block",z6,["paragraph","reference","blockquote"]],["heading",q6,["paragraph","reference","blockquote"]],["lheading",N6],["paragraph",U6]];function G0(){this.ruler=new Su;for(let n=0;n<q0.length;n++)this.ruler.push(q0[n][0],q0[n][1],{alt:(q0[n][2]||[]).slice()})}G0.prototype.tokenize=function(n,i,r){const f=this.ruler.getRules(""),o=f.length,a=n.md.options.maxNesting;let l=i,h=!1;for(;l<r&&(n.line=l=n.skipEmptyLines(l),!(l>=r||n.sCount[l]<n.blkIndent));){if(n.level>=a){n.line=r;break}const b=n.line;let g=!1;for(let E=0;E<o;E++)if(g=f[E](n,l,r,!1),g){if(b>=n.line)throw new Error("block rule didn't increment state.line");break}if(!g)throw new Error("none of the block rules matched");n.tight=!h,n.isEmpty(n.line-1)&&(h=!0),l=n.line,l<r&&n.isEmpty(l)&&(h=!0,l++,n.line=l)}};G0.prototype.parse=function(n,i,r,f){if(!n)return;const o=new this.State(n,i,r,f);this.tokenize(o,o.line,o.lineMax)};G0.prototype.State=fe;function $n(n,i,r,f){this.src=n,this.env=r,this.md=i,this.tokens=f,this.tokens_meta=Array(f.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}$n.prototype.pushPending=function(){const n=new ju("text","",0);return n.content=this.pending,n.level=this.pendingLevel,this.tokens.push(n),this.pending="",n};$n.prototype.push=function(n,i,r){this.pending&&this.pushPending();const f=new ju(n,i,r);let o=null;return r<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),f.level=this.level,r>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],o={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(f),this.tokens_meta.push(o),f};$n.prototype.scanDelims=function(n,i){const r=this.posMax,f=this.src.charCodeAt(n),o=n>0?this.src.charCodeAt(n-1):32;let a=n;for(;a<r&&this.src.charCodeAt(a)===f;)a++;const l=a-n,h=a<r?this.src.charCodeAt(a):32,b=Nn(o)||qn(String.fromCharCode(o)),g=Nn(h)||qn(String.fromCharCode(h)),E=zn(o),v=zn(h),T=!v&&(!g||E||b),S=!E&&(!b||v||g);return{can_open:T&&(i||!S||b),can_close:S&&(i||!T||g),length:l}};$n.prototype.Token=ju;function W6(n){switch(n){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function $6(n,i){let r=n.pos;for(;r<n.posMax&&!W6(n.src.charCodeAt(r));)r++;return r===n.pos?!1:(i||(n.pending+=n.src.slice(n.pos,r)),n.pos=r,!0)}const H6=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function Z6(n,i){if(!n.md.options.linkify||n.linkLevel>0)return!1;const r=n.pos,f=n.posMax;if(r+3>f||n.src.charCodeAt(r)!==58||n.src.charCodeAt(r+1)!==47||n.src.charCodeAt(r+2)!==47)return!1;const o=n.pending.match(H6);if(!o)return!1;const a=o[1],l=n.md.linkify.matchAtStart(n.src.slice(r-a.length));if(!l)return!1;let h=l.url;if(h.length<=a.length)return!1;h=h.replace(/\*+$/,"");const b=n.md.normalizeLink(h);if(!n.md.validateLink(b))return!1;if(!i){n.pending=n.pending.slice(0,-a.length);const g=n.push("link_open","a",1);g.attrs=[["href",b]],g.markup="linkify",g.info="auto";const E=n.push("text","",0);E.content=n.md.normalizeLinkText(h);const v=n.push("link_close","a",-1);v.markup="linkify",v.info="auto"}return n.pos+=h.length-a.length,!0}function G6(n,i){let r=n.pos;if(n.src.charCodeAt(r)!==10)return!1;const f=n.pending.length-1,o=n.posMax;if(!i)if(f>=0&&n.pending.charCodeAt(f)===32)if(f>=1&&n.pending.charCodeAt(f-1)===32){let a=f-1;for(;a>=1&&n.pending.charCodeAt(a-1)===32;)a--;n.pending=n.pending.slice(0,a),n.push("hardbreak","br",0)}else n.pending=n.pending.slice(0,-1),n.push("softbreak","br",0);else n.push("softbreak","br",0);for(r++;r<o&&iu(n.src.charCodeAt(r));)r++;return n.pos=r,!0}const Pr=[];for(let n=0;n<256;n++)Pr.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(n){Pr[n.charCodeAt(0)]=1});function K6(n,i){let r=n.pos;const f=n.posMax;if(n.src.charCodeAt(r)!==92||(r++,r>=f))return!1;let o=n.src.charCodeAt(r);if(o===10){for(i||n.push("hardbreak","br",0),r++;r<f&&(o=n.src.charCodeAt(r),!!iu(o));)r++;return n.pos=r,!0}let a=n.src[r];if(o>=55296&&o<=56319&&r+1<f){const h=n.src.charCodeAt(r+1);h>=56320&&h<=57343&&(a+=n.src[r+1],r++)}const l="\\"+a;if(!i){const h=n.push("text_special","",0);o<256&&Pr[o]!==0?h.content=a:h.content=l,h.markup=l,h.info="escape"}return n.pos=r+1,!0}function Y6(n,i){let r=n.pos;if(n.src.charCodeAt(r)!==96)return!1;const o=r;r++;const a=n.posMax;for(;r<a&&n.src.charCodeAt(r)===96;)r++;const l=n.src.slice(o,r),h=l.length;if(n.backticksScanned&&(n.backticks[h]||0)<=o)return i||(n.pending+=l),n.pos+=h,!0;let b=r,g;for(;(g=n.src.indexOf("`",b))!==-1;){for(b=g+1;b<a&&n.src.charCodeAt(b)===96;)b++;const E=b-g;if(E===h){if(!i){const v=n.push("code_inline","code",0);v.markup=l,v.content=n.src.slice(r,g).replace(/\n/g," ").replace(/^ (.+) $/,"$1")}return n.pos=b,!0}n.backticks[E]=g}return n.backticksScanned=!0,i||(n.pending+=l),n.pos+=h,!0}function J6(n,i){const r=n.pos,f=n.src.charCodeAt(r);if(i||f!==126)return!1;const o=n.scanDelims(n.pos,!0);let a=o.length;const l=String.fromCharCode(f);if(a<2)return!1;let h;a%2&&(h=n.push("text","",0),h.content=l,a--);for(let b=0;b<a;b+=2)h=n.push("text","",0),h.content=l+l,n.delimiters.push({marker:f,length:0,token:n.tokens.length-1,end:-1,open:o.can_open,close:o.can_close});return n.pos+=o.length,!0}function If(n,i){let r;const f=[],o=i.length;for(let a=0;a<o;a++){const l=i[a];if(l.marker!==126||l.end===-1)continue;const h=i[l.end];r=n.tokens[l.token],r.type="s_open",r.tag="s",r.nesting=1,r.markup="~~",r.content="",r=n.tokens[h.token],r.type="s_close",r.tag="s",r.nesting=-1,r.markup="~~",r.content="",n.tokens[h.token-1].type==="text"&&n.tokens[h.token-1].content==="~"&&f.push(h.token-1)}for(;f.length;){const a=f.pop();let l=a+1;for(;l<n.tokens.length&&n.tokens[l].type==="s_close";)l++;l--,a!==l&&(r=n.tokens[l],n.tokens[l]=n.tokens[a],n.tokens[a]=r)}}function X6(n){const i=n.tokens_meta,r=n.tokens_meta.length;If(n,n.delimiters);for(let f=0;f<r;f++)i[f]&&i[f].delimiters&&If(n,i[f].delimiters)}const Qf={tokenize:J6,postProcess:X6};function V6(n,i){const r=n.pos,f=n.src.charCodeAt(r);if(i||f!==95&&f!==42)return!1;const o=n.scanDelims(n.pos,f===42);for(let a=0;a<o.length;a++){const l=n.push("text","",0);l.content=String.fromCharCode(f),n.delimiters.push({marker:f,length:o.length,token:n.tokens.length-1,end:-1,open:o.can_open,close:o.can_close})}return n.pos+=o.length,!0}function Rf(n,i){const r=i.length;for(let f=r-1;f>=0;f--){const o=i[f];if(o.marker!==95&&o.marker!==42||o.end===-1)continue;const a=i[o.end],l=f>0&&i[f-1].end===o.end+1&&i[f-1].marker===o.marker&&i[f-1].token===o.token-1&&i[o.end+1].token===a.token+1,h=String.fromCharCode(o.marker),b=n.tokens[o.token];b.type=l?"strong_open":"em_open",b.tag=l?"strong":"em",b.nesting=1,b.markup=l?h+h:h,b.content="";const g=n.tokens[a.token];g.type=l?"strong_close":"em_close",g.tag=l?"strong":"em",g.nesting=-1,g.markup=l?h+h:h,g.content="",l&&(n.tokens[i[f-1].token].content="",n.tokens[i[o.end+1].token].content="",f--)}}function Q6(n){const i=n.tokens_meta,r=n.tokens_meta.length;Rf(n,n.delimiters);for(let f=0;f<r;f++)i[f]&&i[f].delimiters&&Rf(n,i[f].delimiters)}const jf={tokenize:V6,postProcess:Q6};function j6(n,i){let r,f,o,a,l="",h="",b=n.pos,g=!0;if(n.src.charCodeAt(n.pos)!==91)return!1;const E=n.pos,v=n.posMax,T=n.pos+1,S=n.md.helpers.parseLinkLabel(n,n.pos,!0);if(S<0)return!1;let k=S+1;if(k<v&&n.src.charCodeAt(k)===40){for(g=!1,k++;k<v&&(r=n.src.charCodeAt(k),!(!iu(r)&&r!==10));k++);if(k>=v)return!1;if(b=k,o=n.md.helpers.parseLinkDestination(n.src,k,n.posMax),o.ok){for(l=n.md.normalizeLink(o.str),n.md.validateLink(l)?k=o.pos:l="",b=k;k<v&&(r=n.src.charCodeAt(k),!(!iu(r)&&r!==10));k++);if(o=n.md.helpers.parseLinkTitle(n.src,k,n.posMax),k<v&&b!==k&&o.ok)for(h=o.str,k=o.pos;k<v&&(r=n.src.charCodeAt(k),!(!iu(r)&&r!==10));k++);}(k>=v||n.src.charCodeAt(k)!==41)&&(g=!0),k++}if(g){if(typeof n.env.references=="undefined")return!1;if(k<v&&n.src.charCodeAt(k)===91?(b=k+1,k=n.md.helpers.parseLinkLabel(n,k),k>=0?f=n.src.slice(b,k++):k=S+1):k=S+1,f||(f=n.src.slice(T,S)),a=n.env.references[Z0(f)],!a)return n.pos=E,!1;l=a.href,h=a.title}if(!i){n.pos=T,n.posMax=S;const W=n.push("link_open","a",1),q=[["href",l]];W.attrs=q,h&&q.push(["title",h]),n.linkLevel++,n.md.inline.tokenize(n),n.linkLevel--,n.push("link_close","a",-1)}return n.pos=k,n.posMax=v,!0}function up(n,i){let r,f,o,a,l,h,b,g,E="";const v=n.pos,T=n.posMax;if(n.src.charCodeAt(n.pos)!==33||n.src.charCodeAt(n.pos+1)!==91)return!1;const S=n.pos+2,k=n.md.helpers.parseLinkLabel(n,n.pos+1,!1);if(k<0)return!1;if(a=k+1,a<T&&n.src.charCodeAt(a)===40){for(a++;a<T&&(r=n.src.charCodeAt(a),!(!iu(r)&&r!==10));a++);if(a>=T)return!1;for(g=a,h=n.md.helpers.parseLinkDestination(n.src,a,n.posMax),h.ok&&(E=n.md.normalizeLink(h.str),n.md.validateLink(E)?a=h.pos:E=""),g=a;a<T&&(r=n.src.charCodeAt(a),!(!iu(r)&&r!==10));a++);if(h=n.md.helpers.parseLinkTitle(n.src,a,n.posMax),a<T&&g!==a&&h.ok)for(b=h.str,a=h.pos;a<T&&(r=n.src.charCodeAt(a),!(!iu(r)&&r!==10));a++);else b="";if(a>=T||n.src.charCodeAt(a)!==41)return n.pos=v,!1;a++}else{if(typeof n.env.references=="undefined")return!1;if(a<T&&n.src.charCodeAt(a)===91?(g=a+1,a=n.md.helpers.parseLinkLabel(n,a),a>=0?o=n.src.slice(g,a++):a=k+1):a=k+1,o||(o=n.src.slice(S,k)),l=n.env.references[Z0(o)],!l)return n.pos=v,!1;E=l.href,b=l.title}if(!i){f=n.src.slice(S,k);const W=[];n.md.inline.parse(f,n.md,n.env,W);const q=n.push("image","img",0),J=[["src",E],["alt",""]];q.attrs=J,q.children=W,q.content=f,b&&J.push(["title",b])}return n.pos=a,n.posMax=T,!0}const ep=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,np=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function tp(n,i){let r=n.pos;if(n.src.charCodeAt(r)!==60)return!1;const f=n.pos,o=n.posMax;for(;;){if(++r>=o)return!1;const l=n.src.charCodeAt(r);if(l===60)return!1;if(l===62)break}const a=n.src.slice(f+1,r);if(np.test(a)){const l=n.md.normalizeLink(a);if(!n.md.validateLink(l))return!1;if(!i){const h=n.push("link_open","a",1);h.attrs=[["href",l]],h.markup="autolink",h.info="auto";const b=n.push("text","",0);b.content=n.md.normalizeLinkText(a);const g=n.push("link_close","a",-1);g.markup="autolink",g.info="auto"}return n.pos+=a.length+2,!0}if(ep.test(a)){const l=n.md.normalizeLink("mailto:"+a);if(!n.md.validateLink(l))return!1;if(!i){const h=n.push("link_open","a",1);h.attrs=[["href",l]],h.markup="autolink",h.info="auto";const b=n.push("text","",0);b.content=n.md.normalizeLinkText(a);const g=n.push("link_close","a",-1);g.markup="autolink",g.info="auto"}return n.pos+=a.length+2,!0}return!1}function rp(n){return/^<a[>\s]/i.test(n)}function ip(n){return/^<\/a\s*>/i.test(n)}function cp(n){const i=n|32;return i>=97&&i<=122}function fp(n,i){if(!n.md.options.html)return!1;const r=n.posMax,f=n.pos;if(n.src.charCodeAt(f)!==60||f+2>=r)return!1;const o=n.src.charCodeAt(f+1);if(o!==33&&o!==63&&o!==47&&!cp(o))return!1;const a=n.src.slice(f).match(M6);if(!a)return!1;if(!i){const l=n.push("html_inline","",0);l.content=a[0],rp(l.content)&&n.linkLevel++,ip(l.content)&&n.linkLevel--}return n.pos+=a[0].length,!0}const op=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,ap=/^&([a-z][a-z0-9]{1,31});/i;function sp(n,i){const r=n.pos,f=n.posMax;if(n.src.charCodeAt(r)!==38||r+1>=f)return!1;if(n.src.charCodeAt(r+1)===35){const a=n.src.slice(r).match(op);if(a){if(!i){const l=a[1][0].toLowerCase()==="x"?parseInt(a[1].slice(1),16):parseInt(a[1],10),h=n.push("text_special","",0);h.content=Or(l)?W0(l):W0(65533),h.markup=a[0],h.info="entity"}return n.pos+=a[0].length,!0}}else{const a=n.src.slice(r).match(ap);if(a){const l=Zf(a[0]);if(l!==a[0]){if(!i){const h=n.push("text_special","",0);h.content=l,h.markup=a[0],h.info="entity"}return n.pos+=a[0].length,!0}}}return!1}function Lf(n){const i={},r=n.length;if(!r)return;let f=0,o=-2;const a=[];for(let l=0;l<r;l++){const h=n[l];if(a.push(0),(n[f].marker!==h.marker||o!==h.token-1)&&(f=l),o=h.token,h.length=h.length||0,!h.close)continue;i.hasOwnProperty(h.marker)||(i[h.marker]=[-1,-1,-1,-1,-1,-1]);const b=i[h.marker][(h.open?3:0)+h.length%3];let g=f-a[f]-1,E=g;for(;g>b;g-=a[g]+1){const v=n[g];if(v.marker===h.marker&&v.open&&v.end<0){let T=!1;if((v.close||h.open)&&(v.length+h.length)%3===0&&(v.length%3!==0||h.length%3!==0)&&(T=!0),!T){const S=g>0&&!n[g-1].open?a[g-1]+1:0;a[l]=l-g+S,a[g]=S,h.open=!1,v.end=l,v.close=!1,E=-1,o=-2;break}}}E!==-1&&(i[h.marker][(h.open?3:0)+(h.length||0)%3]=E)}}function lp(n){const i=n.tokens_meta,r=n.tokens_meta.length;Lf(n.delimiters);for(let f=0;f<r;f++)i[f]&&i[f].delimiters&&Lf(i[f].delimiters)}function dp(n){let i,r,f=0;const o=n.tokens,a=n.tokens.length;for(i=r=0;i<a;i++)o[i].nesting<0&&f--,o[i].level=f,o[i].nesting>0&&f++,o[i].type==="text"&&i+1<a&&o[i+1].type==="text"?o[i+1].content=o[i].content+o[i+1].content:(i!==r&&(o[r]=o[i]),r++);i!==r&&(o.length=r)}const vr=[["text",$6],["linkify",Z6],["newline",G6],["escape",K6],["backticks",Y6],["strikethrough",Qf.tokenize],["emphasis",jf.tokenize],["link",j6],["image",up],["autolink",tp],["html_inline",fp],["entity",sp]],Er=[["balance_pairs",lp],["strikethrough",Qf.postProcess],["emphasis",jf.postProcess],["fragments_join",dp]];function Hn(){this.ruler=new Su;for(let n=0;n<vr.length;n++)this.ruler.push(vr[n][0],vr[n][1]);this.ruler2=new Su;for(let n=0;n<Er.length;n++)this.ruler2.push(Er[n][0],Er[n][1])}Hn.prototype.skipToken=function(n){const i=n.pos,r=this.ruler.getRules(""),f=r.length,o=n.md.options.maxNesting,a=n.cache;if(typeof a[i]!="undefined"){n.pos=a[i];return}let l=!1;if(n.level<o){for(let h=0;h<f;h++)if(n.level++,l=r[h](n,!0),n.level--,l){if(i>=n.pos)throw new Error("inline rule didn't increment state.pos");break}}else n.pos=n.posMax;l||n.pos++,a[i]=n.pos};Hn.prototype.tokenize=function(n){const i=this.ruler.getRules(""),r=i.length,f=n.posMax,o=n.md.options.maxNesting;for(;n.pos<f;){const a=n.pos;let l=!1;if(n.level<o){for(let h=0;h<r;h++)if(l=i[h](n,!1),l){if(a>=n.pos)throw new Error("inline rule didn't increment state.pos");break}}if(l){if(n.pos>=f)break;continue}n.pending+=n.src[n.pos++]}n.pending&&n.pushPending()};Hn.prototype.parse=function(n,i,r,f){const o=new this.State(n,i,r,f);this.tokenize(o);const a=this.ruler2.getRules(""),l=a.length;for(let h=0;h<l;h++)a[h](o)};Hn.prototype.State=$n;function hp(n){const i={};n=n||{},i.src_Any=Nf.source,i.src_Cc=Uf.source,i.src_Z=$f.source,i.src_P=Lr.source,i.src_ZPCc=[i.src_Z,i.src_P,i.src_Cc].join("|"),i.src_ZCc=[i.src_Z,i.src_Cc].join("|");const r="[><｜]";return i.src_pseudo_letter="(?:(?!"+r+"|"+i.src_ZPCc+")"+i.src_Any+")",i.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",i.src_auth="(?:(?:(?!"+i.src_ZCc+"|[@/\\[\\]()]).)+@)?",i.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",i.src_host_terminator="(?=$|"+r+"|"+i.src_ZPCc+")(?!"+(n["---"]?"-(?!--)|":"-|")+"_|:\\d|\\.-|\\.(?!$|"+i.src_ZPCc+"))",i.src_path="(?:[/?#](?:(?!"+i.src_ZCc+"|"+r+`|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!`+i.src_ZCc+"|\\]).)*\\]|\\((?:(?!"+i.src_ZCc+"|[)]).)*\\)|\\{(?:(?!"+i.src_ZCc+'|[}]).)*\\}|\\"(?:(?!'+i.src_ZCc+`|["]).)+\\"|\\'(?:(?!`+i.src_ZCc+"|[']).)+\\'|\\'(?="+i.src_pseudo_letter+"|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!"+i.src_ZCc+"|[.]|$)|"+(n["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+",(?!"+i.src_ZCc+"|$)|;(?!"+i.src_ZCc+"|$)|\\!+(?!"+i.src_ZCc+"|[!]|$)|\\?(?!"+i.src_ZCc+"|[?]|$))+|\\/)?",i.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*',i.src_xn="xn--[a-z0-9\\-]{1,59}",i.src_domain_root="(?:"+i.src_xn+"|"+i.src_pseudo_letter+"{1,63})",i.src_domain="(?:"+i.src_xn+"|(?:"+i.src_pseudo_letter+")|(?:"+i.src_pseudo_letter+"(?:-|"+i.src_pseudo_letter+"){0,61}"+i.src_pseudo_letter+"))",i.src_host="(?:(?:(?:(?:"+i.src_domain+")\\.)*"+i.src_domain+"))",i.tpl_host_fuzzy="(?:"+i.src_ip4+"|(?:(?:(?:"+i.src_domain+")\\.)+(?:%TLDS%)))",i.tpl_host_no_ip_fuzzy="(?:(?:(?:"+i.src_domain+")\\.)+(?:%TLDS%))",i.src_host_strict=i.src_host+i.src_host_terminator,i.tpl_host_fuzzy_strict=i.tpl_host_fuzzy+i.src_host_terminator,i.src_host_port_strict=i.src_host+i.src_port+i.src_host_terminator,i.tpl_host_port_fuzzy_strict=i.tpl_host_fuzzy+i.src_port+i.src_host_terminator,i.tpl_host_port_no_ip_fuzzy_strict=i.tpl_host_no_ip_fuzzy+i.src_port+i.src_host_terminator,i.tpl_host_fuzzy_test="localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:"+i.src_ZPCc+"|>|$))",i.tpl_email_fuzzy="(^|"+r+'|"|\\(|'+i.src_ZCc+")("+i.src_email_name+"@"+i.tpl_host_fuzzy_strict+")",i.tpl_link_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+i.src_ZPCc+"))((?![$+<=>^`|｜])"+i.tpl_host_port_fuzzy_strict+i.src_path+")",i.tpl_link_no_ip_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+i.src_ZPCc+"))((?![$+<=>^`|｜])"+i.tpl_host_port_no_ip_fuzzy_strict+i.src_path+")",i}function wr(n){return Array.prototype.slice.call(arguments,1).forEach(function(r){r&&Object.keys(r).forEach(function(f){n[f]=r[f]})}),n}function K0(n){return Object.prototype.toString.call(n)}function pp(n){return K0(n)==="[object String]"}function bp(n){return K0(n)==="[object Object]"}function _p(n){return K0(n)==="[object RegExp]"}function Bf(n){return K0(n)==="[object Function]"}function gp(n){return n.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}const uo={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function xp(n){return Object.keys(n||{}).reduce(function(i,r){return i||uo.hasOwnProperty(r)},!1)}const mp={"http:":{validate:function(n,i,r){const f=n.slice(i);return r.re.http||(r.re.http=new RegExp("^\\/\\/"+r.re.src_auth+r.re.src_host_port_strict+r.re.src_path,"i")),r.re.http.test(f)?f.match(r.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(n,i,r){const f=n.slice(i);return r.re.no_http||(r.re.no_http=new RegExp("^"+r.re.src_auth+"(?:localhost|(?:(?:"+r.re.src_domain+")\\.)+"+r.re.src_domain_root+")"+r.re.src_port+r.re.src_host_terminator+r.re.src_path,"i")),r.re.no_http.test(f)?i>=3&&n[i-3]===":"||i>=3&&n[i-3]==="/"?0:f.match(r.re.no_http)[0].length:0}},"mailto:":{validate:function(n,i,r){const f=n.slice(i);return r.re.mailto||(r.re.mailto=new RegExp("^"+r.re.src_email_name+"@"+r.re.src_host_strict,"i")),r.re.mailto.test(f)?f.match(r.re.mailto)[0].length:0}}},Ap="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",kp="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");function Cp(n){n.__index__=-1,n.__text_cache__=""}function vp(n){return function(i,r){const f=i.slice(r);return n.test(f)?f.match(n)[0].length:0}}function Of(){return function(n,i){i.normalize(n)}}function $0(n){const i=n.re=hp(n.__opts__),r=n.__tlds__.slice();n.onCompile(),n.__tlds_replaced__||r.push(Ap),r.push(i.src_xn),i.src_tlds=r.join("|");function f(h){return h.replace("%TLDS%",i.src_tlds)}i.email_fuzzy=RegExp(f(i.tpl_email_fuzzy),"i"),i.link_fuzzy=RegExp(f(i.tpl_link_fuzzy),"i"),i.link_no_ip_fuzzy=RegExp(f(i.tpl_link_no_ip_fuzzy),"i"),i.host_fuzzy_test=RegExp(f(i.tpl_host_fuzzy_test),"i");const o=[];n.__compiled__={};function a(h,b){throw new Error('(LinkifyIt) Invalid schema "'+h+'": '+b)}Object.keys(n.__schemas__).forEach(function(h){const b=n.__schemas__[h];if(b===null)return;const g={validate:null,link:null};if(n.__compiled__[h]=g,bp(b)){_p(b.validate)?g.validate=vp(b.validate):Bf(b.validate)?g.validate=b.validate:a(h,b),Bf(b.normalize)?g.normalize=b.normalize:b.normalize?a(h,b):g.normalize=Of();return}if(pp(b)){o.push(h);return}a(h,b)}),o.forEach(function(h){n.__compiled__[n.__schemas__[h]]&&(n.__compiled__[h].validate=n.__compiled__[n.__schemas__[h]].validate,n.__compiled__[h].normalize=n.__compiled__[n.__schemas__[h]].normalize)}),n.__compiled__[""]={validate:null,normalize:Of()};const l=Object.keys(n.__compiled__).filter(function(h){return h.length>0&&n.__compiled__[h]}).map(gp).join("|");n.re.schema_test=RegExp("(^|(?!_)(?:[><｜]|"+i.src_ZPCc+"))("+l+")","i"),n.re.schema_search=RegExp("(^|(?!_)(?:[><｜]|"+i.src_ZPCc+"))("+l+")","ig"),n.re.schema_at_start=RegExp("^"+n.re.schema_search.source,"i"),n.re.pretest=RegExp("("+n.re.schema_test.source+")|("+n.re.host_fuzzy_test.source+")|@","i"),Cp(n)}function Ep(n,i){const r=n.__index__,f=n.__last_index__,o=n.__text_cache__.slice(r,f);this.schema=n.__schema__.toLowerCase(),this.index=r+i,this.lastIndex=f+i,this.raw=o,this.text=o,this.url=o}function Sr(n,i){const r=new Ep(n,i);return n.__compiled__[r.schema].normalize(r,n),r}function Mu(n,i){if(!(this instanceof Mu))return new Mu(n,i);i||xp(n)&&(i=n,n={}),this.__opts__=wr({},uo,i),this.__index__=-1,this.__last_index__=-1,this.__schema__="",this.__text_cache__="",this.__schemas__=wr({},mp,n),this.__compiled__={},this.__tlds__=kp,this.__tlds_replaced__=!1,this.re={},$0(this)}Mu.prototype.add=function(i,r){return this.__schemas__[i]=r,$0(this),this};Mu.prototype.set=function(i){return this.__opts__=wr(this.__opts__,i),this};Mu.prototype.test=function(i){if(this.__text_cache__=i,this.__index__=-1,!i.length)return!1;let r,f,o,a,l,h,b,g,E;if(this.re.schema_test.test(i)){for(b=this.re.schema_search,b.lastIndex=0;(r=b.exec(i))!==null;)if(a=this.testSchemaAt(i,r[2],b.lastIndex),a){this.__schema__=r[2],this.__index__=r.index+r[1].length,this.__last_index__=r.index+r[0].length+a;break}}return this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&(g=i.search(this.re.host_fuzzy_test),g>=0&&(this.__index__<0||g<this.__index__)&&(f=i.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy))!==null&&(l=f.index+f[1].length,(this.__index__<0||l<this.__index__)&&(this.__schema__="",this.__index__=l,this.__last_index__=f.index+f[0].length))),this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&(E=i.indexOf("@"),E>=0&&(o=i.match(this.re.email_fuzzy))!==null&&(l=o.index+o[1].length,h=o.index+o[0].length,(this.__index__<0||l<this.__index__||l===this.__index__&&h>this.__last_index__)&&(this.__schema__="mailto:",this.__index__=l,this.__last_index__=h))),this.__index__>=0};Mu.prototype.pretest=function(i){return this.re.pretest.test(i)};Mu.prototype.testSchemaAt=function(i,r,f){return this.__compiled__[r.toLowerCase()]?this.__compiled__[r.toLowerCase()].validate(i,f,this):0};Mu.prototype.match=function(i){const r=[];let f=0;this.__index__>=0&&this.__text_cache__===i&&(r.push(Sr(this,f)),f=this.__last_index__);let o=f?i.slice(f):i;for(;this.test(o);)r.push(Sr(this,f)),o=o.slice(this.__last_index__),f+=this.__last_index__;return r.length?r:null};Mu.prototype.matchAtStart=function(i){if(this.__text_cache__=i,this.__index__=-1,!i.length)return null;const r=this.re.schema_at_start.exec(i);if(!r)return null;const f=this.testSchemaAt(i,r[2],r[0].length);return f?(this.__schema__=r[2],this.__index__=r.index+r[1].length,this.__last_index__=r.index+r[0].length+f,Sr(this,0)):null};Mu.prototype.tlds=function(i,r){return i=Array.isArray(i)?i:[i],r?(this.__tlds__=this.__tlds__.concat(i).sort().filter(function(f,o,a){return f!==a[o-1]}).reverse(),$0(this),this):(this.__tlds__=i.slice(),this.__tlds_replaced__=!0,$0(this),this)};Mu.prototype.normalize=function(i){i.schema||(i.url="http://"+i.url),i.schema==="mailto:"&&!/^mailto:/i.test(i.url)&&(i.url="mailto:"+i.url)};Mu.prototype.onCompile=function(){};const an=2147483647,re=36,zr=1,Un=26,Dp=38,yp=700,eo=72,no=128,to="-",Fp=/^xn--/,wp=/[^\0-\x7F]/,Sp=/[\x2E\u3002\uFF0E\uFF61]/g,Tp={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},Dr=re-zr,ie=Math.floor,yr=String.fromCharCode;function Te(n){throw new RangeError(Tp[n])}function Ip(n,i){const r=[];let f=n.length;for(;f--;)r[f]=i(n[f]);return r}function ro(n,i){const r=n.split("@");let f="";r.length>1&&(f=r[0]+"@",n=r[1]),n=n.replace(Sp,".");const o=n.split("."),a=Ip(o,i).join(".");return f+a}function io(n){const i=[];let r=0;const f=n.length;for(;r<f;){const o=n.charCodeAt(r++);if(o>=55296&&o<=56319&&r<f){const a=n.charCodeAt(r++);(a&64512)==56320?i.push(((o&1023)<<10)+(a&1023)+65536):(i.push(o),r--)}else i.push(o)}return i}const Rp=n=>String.fromCodePoint(...n),Lp=function(n){return n>=48&&n<58?26+(n-48):n>=65&&n<91?n-65:n>=97&&n<123?n-97:re},Mf=function(n,i){return n+22+75*(n<26)-((i!=0)<<5)},co=function(n,i,r){let f=0;for(n=r?ie(n/yp):n>>1,n+=ie(n/i);n>Dr*Un>>1;f+=re)n=ie(n/Dr);return ie(f+(Dr+1)*n/(n+Dp))},fo=function(n){const i=[],r=n.length;let f=0,o=no,a=eo,l=n.lastIndexOf(to);l<0&&(l=0);for(let h=0;h<l;++h)n.charCodeAt(h)>=128&&Te("not-basic"),i.push(n.charCodeAt(h));for(let h=l>0?l+1:0;h<r;){const b=f;for(let E=1,v=re;;v+=re){h>=r&&Te("invalid-input");const T=Lp(n.charCodeAt(h++));T>=re&&Te("invalid-input"),T>ie((an-f)/E)&&Te("overflow"),f+=T*E;const S=v<=a?zr:v>=a+Un?Un:v-a;if(T<S)break;const k=re-S;E>ie(an/k)&&Te("overflow"),E*=k}const g=i.length+1;a=co(f-b,g,b==0),ie(f/g)>an-o&&Te("overflow"),o+=ie(f/g),f%=g,i.splice(f++,0,o)}return String.fromCodePoint(...i)},oo=function(n){const i=[];n=io(n);const r=n.length;let f=no,o=0,a=eo;for(const b of n)b<128&&i.push(yr(b));const l=i.length;let h=l;for(l&&i.push(to);h<r;){let b=an;for(const E of n)E>=f&&E<b&&(b=E);const g=h+1;b-f>ie((an-o)/g)&&Te("overflow"),o+=(b-f)*g,f=b;for(const E of n)if(E<f&&++o>an&&Te("overflow"),E===f){let v=o;for(let T=re;;T+=re){const S=T<=a?zr:T>=a+Un?Un:T-a;if(v<S)break;const k=v-S,W=re-S;i.push(yr(Mf(S+k%W,0))),v=ie(k/W)}i.push(yr(Mf(v,0))),a=co(o,g,h===l),o=0,++h}++o,++f}return i.join("")},Bp=function(n){return ro(n,function(i){return Fp.test(i)?fo(i.slice(4).toLowerCase()):i})},Op=function(n){return ro(n,function(i){return wp.test(i)?"xn--"+oo(i):i})},ao={version:"2.3.1",ucs2:{decode:io,encode:Rp},decode:fo,encode:oo,toASCII:Op,toUnicode:Bp},Mp={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}},Pp={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","fragments_join"]}}},zp={options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","fragments_join"]}}},qp={default:Mp,zero:Pp,commonmark:zp},Np=/^(vbscript|javascript|file|data):/,Up=/^data:image\/(gif|png|jpeg|webp);/;function Wp(n){const i=n.trim().toLowerCase();return Np.test(i)?Up.test(i):!0}const so=["http:","https:","mailto:"];function $p(n){const i=Rr(n,!0);if(i.hostname&&(!i.protocol||so.indexOf(i.protocol)>=0))try{i.hostname=ao.toASCII(i.hostname)}catch(r){}return Wn(Ir(i))}function Hp(n){const i=Rr(n,!0);if(i.hostname&&(!i.protocol||so.indexOf(i.protocol)>=0))try{i.hostname=ao.toUnicode(i.hostname)}catch(r){}return sn(Ir(i),sn.defaultChars+"%")}function Gu(n,i){if(!(this instanceof Gu))return new Gu(n,i);i||Br(n)||(i=n||{},n="default"),this.inline=new Hn,this.block=new G0,this.core=new Mr,this.renderer=new dn,this.linkify=new Mu,this.validateLink=Wp,this.normalizeLink=$p,this.normalizeLinkText=Hp,this.utils=G3,this.helpers=H0({},X3),this.options={},this.configure(n),i&&this.set(i)}Gu.prototype.set=function(n){return H0(this.options,n),this};Gu.prototype.configure=function(n){const i=this;if(Br(n)){const r=n;if(n=qp[r],!n)throw new Error('Wrong `markdown-it` preset "'+r+'", check name')}if(!n)throw new Error("Wrong `markdown-it` preset, can't be empty");return n.options&&i.set(n.options),n.components&&Object.keys(n.components).forEach(function(r){n.components[r].rules&&i[r].ruler.enableOnly(n.components[r].rules),n.components[r].rules2&&i[r].ruler2.enableOnly(n.components[r].rules2)}),this};Gu.prototype.enable=function(n,i){let r=[];Array.isArray(n)||(n=[n]),["core","block","inline"].forEach(function(o){r=r.concat(this[o].ruler.enable(n,!0))},this),r=r.concat(this.inline.ruler2.enable(n,!0));const f=n.filter(function(o){return r.indexOf(o)<0});if(f.length&&!i)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+f);return this};Gu.prototype.disable=function(n,i){let r=[];Array.isArray(n)||(n=[n]),["core","block","inline"].forEach(function(o){r=r.concat(this[o].ruler.disable(n,!0))},this),r=r.concat(this.inline.ruler2.disable(n,!0));const f=n.filter(function(o){return r.indexOf(o)<0});if(f.length&&!i)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+f);return this};Gu.prototype.use=function(n){const i=[this].concat(Array.prototype.slice.call(arguments,1));return n.apply(n,i),this};Gu.prototype.parse=function(n,i){if(typeof n!="string")throw new Error("Input data should be a String");const r=new this.core.State(n,this,i);return this.core.process(r),r.tokens};Gu.prototype.render=function(n,i){return i=i||{},this.renderer.render(this.parse(n,i),this.options,i)};Gu.prototype.parseInline=function(n,i){const r=new this.core.State(n,this,i);return r.inlineMode=!0,this.core.process(r),r.tokens};Gu.prototype.renderInline=function(n,i){return i=i||{},this.renderer.render(this.parseInline(n,i),this.options,i)};var N0=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},Pn={exports:{}};var Zp=Pn.exports,Pf;function Gp(){return Pf||(Pf=1,(function(n,i){(function(){var r,f="4.17.21",o=200,a="Unsupported core-js use. Try https://npms.io/search?q=ponyfill.",l="Expected a function",h="Invalid `variable` option passed into `_.template`",b="__lodash_hash_undefined__",g=500,E="__lodash_placeholder__",v=1,T=2,S=4,k=1,W=2,q=1,J=2,O=4,B=8,M=16,P=32,K=64,nu=128,gu=256,Pu=512,Be=30,hn="...",Y0=800,J0=16,pn=1,me=2,X0=3,Oe=1/0,Ae=9007199254740991,lo=17976931348623157e292,Zn=NaN,ue=4294967295,ho=ue-1,po=ue>>>1,bo=[["ary",nu],["bind",q],["bindKey",J],["curry",B],["curryRight",M],["flip",Pu],["partial",P],["partialRight",K],["rearg",gu]],Ze="[object Arguments]",Gn="[object Array]",_o="[object AsyncFunction]",bn="[object Boolean]",_n="[object Date]",go="[object DOMException]",Kn="[object Error]",Yn="[object Function]",qr="[object GeneratorFunction]",Ku="[object Map]",gn="[object Number]",xo="[object Null]",oe="[object Object]",Nr="[object Promise]",mo="[object Proxy]",xn="[object RegExp]",Yu="[object Set]",mn="[object String]",Jn="[object Symbol]",Ao="[object Undefined]",An="[object WeakMap]",ko="[object WeakSet]",kn="[object ArrayBuffer]",Ge="[object DataView]",V0="[object Float32Array]",Q0="[object Float64Array]",j0="[object Int8Array]",ut="[object Int16Array]",et="[object Int32Array]",nt="[object Uint8Array]",tt="[object Uint8ClampedArray]",rt="[object Uint16Array]",it="[object Uint32Array]",Co=/\b__p \+= '';/g,vo=/\b(__p \+=) '' \+/g,Eo=/(__e\(.*?\)|\b__t\)) \+\n'';/g,Ur=/&(?:amp|lt|gt|quot|#39);/g,Wr=/[&<>"']/g,Do=RegExp(Ur.source),yo=RegExp(Wr.source),Fo=/<%-([\s\S]+?)%>/g,wo=/<%([\s\S]+?)%>/g,$r=/<%=([\s\S]+?)%>/g,So=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,To=/^\w*$/,Io=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,ct=/[\\^$.*+?()[\]{}|]/g,Ro=RegExp(ct.source),ft=/^\s+/,Lo=/\s/,Bo=/\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,Oo=/\{\n\/\* \[wrapped with (.+)\] \*/,Mo=/,? & /,Po=/[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g,zo=/[()=,{}\[\]\/\s]/,qo=/\\(\\)?/g,No=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,Hr=/\w*$/,Uo=/^[-+]0x[0-9a-f]+$/i,Wo=/^0b[01]+$/i,$o=/^\[object .+?Constructor\]$/,Ho=/^0o[0-7]+$/i,Zo=/^(?:0|[1-9]\d*)$/,Go=/[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,Xn=/($^)/,Ko=/['\n\r\u2028\u2029\\]/g,Vn="\\ud800-\\udfff",Yo="\\u0300-\\u036f",Jo="\\ufe20-\\ufe2f",Xo="\\u20d0-\\u20ff",Zr=Yo+Jo+Xo,Gr="\\u2700-\\u27bf",Kr="a-z\\xdf-\\xf6\\xf8-\\xff",Vo="\\xac\\xb1\\xd7\\xf7",Qo="\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf",jo="\\u2000-\\u206f",u1=" \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000",Yr="A-Z\\xc0-\\xd6\\xd8-\\xde",Jr="\\ufe0e\\ufe0f",Xr=Vo+Qo+jo+u1,ot="['’]",e1="["+Vn+"]",Vr="["+Xr+"]",Qn="["+Zr+"]",Qr="\\d+",n1="["+Gr+"]",jr="["+Kr+"]",ui="[^"+Vn+Xr+Qr+Gr+Kr+Yr+"]",at="\\ud83c[\\udffb-\\udfff]",t1="(?:"+Qn+"|"+at+")",ei="[^"+Vn+"]",st="(?:\\ud83c[\\udde6-\\uddff]){2}",lt="[\\ud800-\\udbff][\\udc00-\\udfff]",Ke="["+Yr+"]",ni="\\u200d",ti="(?:"+jr+"|"+ui+")",r1="(?:"+Ke+"|"+ui+")",ri="(?:"+ot+"(?:d|ll|m|re|s|t|ve))?",ii="(?:"+ot+"(?:D|LL|M|RE|S|T|VE))?",ci=t1+"?",fi="["+Jr+"]?",i1="(?:"+ni+"(?:"+[ei,st,lt].join("|")+")"+fi+ci+")*",c1="\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])",f1="\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])",oi=fi+ci+i1,o1="(?:"+[n1,st,lt].join("|")+")"+oi,a1="(?:"+[ei+Qn+"?",Qn,st,lt,e1].join("|")+")",s1=RegExp(ot,"g"),l1=RegExp(Qn,"g"),dt=RegExp(at+"(?="+at+")|"+a1+oi,"g"),d1=RegExp([Ke+"?"+jr+"+"+ri+"(?="+[Vr,Ke,"$"].join("|")+")",r1+"+"+ii+"(?="+[Vr,Ke+ti,"$"].join("|")+")",Ke+"?"+ti+"+"+ri,Ke+"+"+ii,f1,c1,Qr,o1].join("|"),"g"),h1=RegExp("["+ni+Vn+Zr+Jr+"]"),p1=/[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/,b1=["Array","Buffer","DataView","Date","Error","Float32Array","Float64Array","Function","Int8Array","Int16Array","Int32Array","Map","Math","Object","Promise","RegExp","Set","String","Symbol","TypeError","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array","WeakMap","_","clearTimeout","isFinite","parseInt","setTimeout"],_1=-1,cu={};cu[V0]=cu[Q0]=cu[j0]=cu[ut]=cu[et]=cu[nt]=cu[tt]=cu[rt]=cu[it]=!0,cu[Ze]=cu[Gn]=cu[kn]=cu[bn]=cu[Ge]=cu[_n]=cu[Kn]=cu[Yn]=cu[Ku]=cu[gn]=cu[oe]=cu[xn]=cu[Yu]=cu[mn]=cu[An]=!1;var ru={};ru[Ze]=ru[Gn]=ru[kn]=ru[Ge]=ru[bn]=ru[_n]=ru[V0]=ru[Q0]=ru[j0]=ru[ut]=ru[et]=ru[Ku]=ru[gn]=ru[oe]=ru[xn]=ru[Yu]=ru[mn]=ru[Jn]=ru[nt]=ru[tt]=ru[rt]=ru[it]=!0,ru[Kn]=ru[Yn]=ru[An]=!1;var g1={À:"A",Á:"A",Â:"A",Ã:"A",Ä:"A",Å:"A",à:"a",á:"a",â:"a",ã:"a",ä:"a",å:"a",Ç:"C",ç:"c",Ð:"D",ð:"d",È:"E",É:"E",Ê:"E",Ë:"E",è:"e",é:"e",ê:"e",ë:"e",Ì:"I",Í:"I",Î:"I",Ï:"I",ì:"i",í:"i",î:"i",ï:"i",Ñ:"N",ñ:"n",Ò:"O",Ó:"O",Ô:"O",Õ:"O",Ö:"O",Ø:"O",ò:"o",ó:"o",ô:"o",õ:"o",ö:"o",ø:"o",Ù:"U",Ú:"U",Û:"U",Ü:"U",ù:"u",ú:"u",û:"u",ü:"u",Ý:"Y",ý:"y",ÿ:"y",Æ:"Ae",æ:"ae",Þ:"Th",þ:"th",ß:"ss",Ā:"A",Ă:"A",Ą:"A",ā:"a",ă:"a",ą:"a",Ć:"C",Ĉ:"C",Ċ:"C",Č:"C",ć:"c",ĉ:"c",ċ:"c",č:"c",Ď:"D",Đ:"D",ď:"d",đ:"d",Ē:"E",Ĕ:"E",Ė:"E",Ę:"E",Ě:"E",ē:"e",ĕ:"e",ė:"e",ę:"e",ě:"e",Ĝ:"G",Ğ:"G",Ġ:"G",Ģ:"G",ĝ:"g",ğ:"g",ġ:"g",ģ:"g",Ĥ:"H",Ħ:"H",ĥ:"h",ħ:"h",Ĩ:"I",Ī:"I",Ĭ:"I",Į:"I",İ:"I",ĩ:"i",ī:"i",ĭ:"i",į:"i",ı:"i",Ĵ:"J",ĵ:"j",Ķ:"K",ķ:"k",ĸ:"k",Ĺ:"L",Ļ:"L",Ľ:"L",Ŀ:"L",Ł:"L",ĺ:"l",ļ:"l",ľ:"l",ŀ:"l",ł:"l",Ń:"N",Ņ:"N",Ň:"N",Ŋ:"N",ń:"n",ņ:"n",ň:"n",ŋ:"n",Ō:"O",Ŏ:"O",Ő:"O",ō:"o",ŏ:"o",ő:"o",Ŕ:"R",Ŗ:"R",Ř:"R",ŕ:"r",ŗ:"r",ř:"r",Ś:"S",Ŝ:"S",Ş:"S",Š:"S",ś:"s",ŝ:"s",ş:"s",š:"s",Ţ:"T",Ť:"T",Ŧ:"T",ţ:"t",ť:"t",ŧ:"t",Ũ:"U",Ū:"U",Ŭ:"U",Ů:"U",Ű:"U",Ų:"U",ũ:"u",ū:"u",ŭ:"u",ů:"u",ű:"u",ų:"u",Ŵ:"W",ŵ:"w",Ŷ:"Y",ŷ:"y",Ÿ:"Y",Ź:"Z",Ż:"Z",Ž:"Z",ź:"z",ż:"z",ž:"z",Ĳ:"IJ",ĳ:"ij",Œ:"Oe",œ:"oe",ŉ:"'n",ſ:"s"},x1={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},m1={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"},A1={"\\":"\\","'":"'","\n":"n","\r":"r","\u2028":"u2028","\u2029":"u2029"},k1=parseFloat,C1=parseInt,ai=typeof N0=="object"&&N0&&N0.Object===Object&&N0,v1=typeof self=="object"&&self&&self.Object===Object&&self,xu=ai||v1||Function("return this")(),ht=i&&!i.nodeType&&i,Me=ht&&!0&&n&&!n.nodeType&&n,si=Me&&Me.exports===ht,pt=si&&ai.process,zu=(function(){try{var m=Me&&Me.require&&Me.require("util").types;return m||pt&&pt.binding&&pt.binding("util")}catch(D){}})(),li=zu&&zu.isArrayBuffer,di=zu&&zu.isDate,hi=zu&&zu.isMap,pi=zu&&zu.isRegExp,bi=zu&&zu.isSet,_i=zu&&zu.isTypedArray;function Tu(m,D,C){switch(C.length){case 0:return m.call(D);case 1:return m.call(D,C[0]);case 2:return m.call(D,C[0],C[1]);case 3:return m.call(D,C[0],C[1],C[2])}return m.apply(D,C)}function E1(m,D,C,R){for(var $=-1,j=m==null?0:m.length;++$<j;){var du=m[$];D(R,du,C(du),m)}return R}function qu(m,D){for(var C=-1,R=m==null?0:m.length;++C<R&&D(m[C],C,m)!==!1;);return m}function D1(m,D){for(var C=m==null?0:m.length;C--&&D(m[C],C,m)!==!1;);return m}function gi(m,D){for(var C=-1,R=m==null?0:m.length;++C<R;)if(!D(m[C],C,m))return!1;return!0}function ke(m,D){for(var C=-1,R=m==null?0:m.length,$=0,j=[];++C<R;){var du=m[C];D(du,C,m)&&(j[$++]=du)}return j}function jn(m,D){var C=m==null?0:m.length;return!!C&&Ye(m,D,0)>-1}function bt(m,D,C){for(var R=-1,$=m==null?0:m.length;++R<$;)if(C(D,m[R]))return!0;return!1}function fu(m,D){for(var C=-1,R=m==null?0:m.length,$=Array(R);++C<R;)$[C]=D(m[C],C,m);return $}function Ce(m,D){for(var C=-1,R=D.length,$=m.length;++C<R;)m[$+C]=D[C];return m}function _t(m,D,C,R){var $=-1,j=m==null?0:m.length;for(R&&j&&(C=m[++$]);++$<j;)C=D(C,m[$],$,m);return C}function y1(m,D,C,R){var $=m==null?0:m.length;for(R&&$&&(C=m[--$]);$--;)C=D(C,m[$],$,m);return C}function gt(m,D){for(var C=-1,R=m==null?0:m.length;++C<R;)if(D(m[C],C,m))return!0;return!1}var F1=xt("length");function w1(m){return m.split("")}function S1(m){return m.match(Po)||[]}function xi(m,D,C){var R;return C(m,function($,j,du){if(D($,j,du))return R=j,!1}),R}function u0(m,D,C,R){for(var $=m.length,j=C+(R?1:-1);R?j--:++j<$;)if(D(m[j],j,m))return j;return-1}function Ye(m,D,C){return D===D?U1(m,D,C):u0(m,mi,C)}function T1(m,D,C,R){for(var $=C-1,j=m.length;++$<j;)if(R(m[$],D))return $;return-1}function mi(m){return m!==m}function Ai(m,D){var C=m==null?0:m.length;return C?At(m,D)/C:Zn}function xt(m){return function(D){return D==null?r:D[m]}}function mt(m){return function(D){return m==null?r:m[D]}}function ki(m,D,C,R,$){return $(m,function(j,du,tu){C=R?(R=!1,j):D(C,j,du,tu)}),C}function I1(m,D){var C=m.length;for(m.sort(D);C--;)m[C]=m[C].value;return m}function At(m,D){for(var C,R=-1,$=m.length;++R<$;){var j=D(m[R]);j!==r&&(C=C===r?j:C+j)}return C}function kt(m,D){for(var C=-1,R=Array(m);++C<m;)R[C]=D(C);return R}function R1(m,D){return fu(D,function(C){return[C,m[C]]})}function Ci(m){return m&&m.slice(0,yi(m)+1).replace(ft,"")}function Iu(m){return function(D){return m(D)}}function Ct(m,D){return fu(D,function(C){return m[C]})}function Cn(m,D){return m.has(D)}function vi(m,D){for(var C=-1,R=m.length;++C<R&&Ye(D,m[C],0)>-1;);return C}function Ei(m,D){for(var C=m.length;C--&&Ye(D,m[C],0)>-1;);return C}function L1(m,D){for(var C=m.length,R=0;C--;)m[C]===D&&++R;return R}var B1=mt(g1),O1=mt(x1);function M1(m){return"\\"+A1[m]}function P1(m,D){return m==null?r:m[D]}function Je(m){return h1.test(m)}function z1(m){return p1.test(m)}function q1(m){for(var D,C=[];!(D=m.next()).done;)C.push(D.value);return C}function vt(m){var D=-1,C=Array(m.size);return m.forEach(function(R,$){C[++D]=[$,R]}),C}function Di(m,D){return function(C){return m(D(C))}}function ve(m,D){for(var C=-1,R=m.length,$=0,j=[];++C<R;){var du=m[C];(du===D||du===E)&&(m[C]=E,j[$++]=C)}return j}function e0(m){var D=-1,C=Array(m.size);return m.forEach(function(R){C[++D]=R}),C}function N1(m){var D=-1,C=Array(m.size);return m.forEach(function(R){C[++D]=[R,R]}),C}function U1(m,D,C){for(var R=C-1,$=m.length;++R<$;)if(m[R]===D)return R;return-1}function W1(m,D,C){for(var R=C+1;R--;)if(m[R]===D)return R;return R}function Xe(m){return Je(m)?H1(m):F1(m)}function Ju(m){return Je(m)?Z1(m):w1(m)}function yi(m){for(var D=m.length;D--&&Lo.test(m.charAt(D)););return D}var $1=mt(m1);function H1(m){for(var D=dt.lastIndex=0;dt.test(m);)++D;return D}function Z1(m){return m.match(dt)||[]}function G1(m){return m.match(d1)||[]}var K1=(function m(D){D=D==null?xu:Ve.defaults(xu.Object(),D,Ve.pick(xu,b1));var C=D.Array,R=D.Date,$=D.Error,j=D.Function,du=D.Math,tu=D.Object,Et=D.RegExp,Y1=D.String,Nu=D.TypeError,n0=C.prototype,J1=j.prototype,Qe=tu.prototype,t0=D["__core-js_shared__"],r0=J1.toString,eu=Qe.hasOwnProperty,X1=0,Fi=(function(){var u=/[^.]+$/.exec(t0&&t0.keys&&t0.keys.IE_PROTO||"");return u?"Symbol(src)_1."+u:""})(),i0=Qe.toString,V1=r0.call(tu),Q1=xu._,j1=Et("^"+r0.call(eu).replace(ct,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),c0=si?D.Buffer:r,Ee=D.Symbol,f0=D.Uint8Array,wi=c0?c0.allocUnsafe:r,o0=Di(tu.getPrototypeOf,tu),Si=tu.create,Ti=Qe.propertyIsEnumerable,a0=n0.splice,Ii=Ee?Ee.isConcatSpreadable:r,vn=Ee?Ee.iterator:r,Pe=Ee?Ee.toStringTag:r,s0=(function(){try{var u=We(tu,"defineProperty");return u({},"",{}),u}catch(e){}})(),ua=D.clearTimeout!==xu.clearTimeout&&D.clearTimeout,ea=R&&R.now!==xu.Date.now&&R.now,na=D.setTimeout!==xu.setTimeout&&D.setTimeout,l0=du.ceil,d0=du.floor,Dt=tu.getOwnPropertySymbols,ta=c0?c0.isBuffer:r,Ri=D.isFinite,ra=n0.join,ia=Di(tu.keys,tu),hu=du.max,Au=du.min,ca=R.now,fa=D.parseInt,Li=du.random,oa=n0.reverse,yt=We(D,"DataView"),En=We(D,"Map"),Ft=We(D,"Promise"),je=We(D,"Set"),Dn=We(D,"WeakMap"),yn=We(tu,"create"),h0=Dn&&new Dn,un={},aa=$e(yt),sa=$e(En),la=$e(Ft),da=$e(je),ha=$e(Dn),p0=Ee?Ee.prototype:r,Fn=p0?p0.valueOf:r,Bi=p0?p0.toString:r;function d(u){if(au(u)&&!H(u)&&!(u instanceof V)){if(u instanceof Uu)return u;if(eu.call(u,"__wrapped__"))return Oc(u)}return new Uu(u)}var en=(function(){function u(){}return function(e){if(!ou(e))return{};if(Si)return Si(e);u.prototype=e;var t=new u;return u.prototype=r,t}})();function b0(){}function Uu(u,e){this.__wrapped__=u,this.__actions__=[],this.__chain__=!!e,this.__index__=0,this.__values__=r}d.templateSettings={escape:Fo,evaluate:wo,interpolate:$r,variable:"",imports:{_:d}},d.prototype=b0.prototype,d.prototype.constructor=d,Uu.prototype=en(b0.prototype),Uu.prototype.constructor=Uu;function V(u){this.__wrapped__=u,this.__actions__=[],this.__dir__=1,this.__filtered__=!1,this.__iteratees__=[],this.__takeCount__=ue,this.__views__=[]}function pa(){var u=new V(this.__wrapped__);return u.__actions__=Du(this.__actions__),u.__dir__=this.__dir__,u.__filtered__=this.__filtered__,u.__iteratees__=Du(this.__iteratees__),u.__takeCount__=this.__takeCount__,u.__views__=Du(this.__views__),u}function ba(){if(this.__filtered__){var u=new V(this);u.__dir__=-1,u.__filtered__=!0}else u=this.clone(),u.__dir__*=-1;return u}function _a(){var u=this.__wrapped__.value(),e=this.__dir__,t=H(u),c=e<0,s=t?u.length:0,p=ws(0,s,this.__views__),_=p.start,x=p.end,A=x-_,y=c?x:_-1,F=this.__iteratees__,w=F.length,I=0,L=Au(A,this.__takeCount__);if(!t||!c&&s==A&&L==A)return rc(u,this.__actions__);var N=[];u:for(;A--&&I<L;){y+=e;for(var G=-1,U=u[y];++G<w;){var X=F[G],Q=X.iteratee,Bu=X.type,Eu=Q(U);if(Bu==me)U=Eu;else if(!Eu){if(Bu==pn)continue u;break u}}N[I++]=U}return N}V.prototype=en(b0.prototype),V.prototype.constructor=V;function ze(u){var e=-1,t=u==null?0:u.length;for(this.clear();++e<t;){var c=u[e];this.set(c[0],c[1])}}function ga(){this.__data__=yn?yn(null):{},this.size=0}function xa(u){var e=this.has(u)&&delete this.__data__[u];return this.size-=e?1:0,e}function ma(u){var e=this.__data__;if(yn){var t=e[u];return t===b?r:t}return eu.call(e,u)?e[u]:r}function Aa(u){var e=this.__data__;return yn?e[u]!==r:eu.call(e,u)}function ka(u,e){var t=this.__data__;return this.size+=this.has(u)?0:1,t[u]=yn&&e===r?b:e,this}ze.prototype.clear=ga,ze.prototype.delete=xa,ze.prototype.get=ma,ze.prototype.has=Aa,ze.prototype.set=ka;function ae(u){var e=-1,t=u==null?0:u.length;for(this.clear();++e<t;){var c=u[e];this.set(c[0],c[1])}}function Ca(){this.__data__=[],this.size=0}function va(u){var e=this.__data__,t=_0(e,u);if(t<0)return!1;var c=e.length-1;return t==c?e.pop():a0.call(e,t,1),--this.size,!0}function Ea(u){var e=this.__data__,t=_0(e,u);return t<0?r:e[t][1]}function Da(u){return _0(this.__data__,u)>-1}function ya(u,e){var t=this.__data__,c=_0(t,u);return c<0?(++this.size,t.push([u,e])):t[c][1]=e,this}ae.prototype.clear=Ca,ae.prototype.delete=va,ae.prototype.get=Ea,ae.prototype.has=Da,ae.prototype.set=ya;function se(u){var e=-1,t=u==null?0:u.length;for(this.clear();++e<t;){var c=u[e];this.set(c[0],c[1])}}function Fa(){this.size=0,this.__data__={hash:new ze,map:new(En||ae),string:new ze}}function wa(u){var e=w0(this,u).delete(u);return this.size-=e?1:0,e}function Sa(u){return w0(this,u).get(u)}function Ta(u){return w0(this,u).has(u)}function Ia(u,e){var t=w0(this,u),c=t.size;return t.set(u,e),this.size+=t.size==c?0:1,this}se.prototype.clear=Fa,se.prototype.delete=wa,se.prototype.get=Sa,se.prototype.has=Ta,se.prototype.set=Ia;function qe(u){var e=-1,t=u==null?0:u.length;for(this.__data__=new se;++e<t;)this.add(u[e])}function Ra(u){return this.__data__.set(u,b),this}function La(u){return this.__data__.has(u)}qe.prototype.add=qe.prototype.push=Ra,qe.prototype.has=La;function Xu(u){var e=this.__data__=new ae(u);this.size=e.size}function Ba(){this.__data__=new ae,this.size=0}function Oa(u){var e=this.__data__,t=e.delete(u);return this.size=e.size,t}function Ma(u){return this.__data__.get(u)}function Pa(u){return this.__data__.has(u)}function za(u,e){var t=this.__data__;if(t instanceof ae){var c=t.__data__;if(!En||c.length<o-1)return c.push([u,e]),this.size=++t.size,this;t=this.__data__=new se(c)}return t.set(u,e),this.size=t.size,this}Xu.prototype.clear=Ba,Xu.prototype.delete=Oa,Xu.prototype.get=Ma,Xu.prototype.has=Pa,Xu.prototype.set=za;function Oi(u,e){var t=H(u),c=!t&&He(u),s=!t&&!c&&Se(u),p=!t&&!c&&!s&&cn(u),_=t||c||s||p,x=_?kt(u.length,Y1):[],A=x.length;for(var y in u)(e||eu.call(u,y))&&!(_&&(y=="length"||s&&(y=="offset"||y=="parent")||p&&(y=="buffer"||y=="byteLength"||y=="byteOffset")||pe(y,A)))&&x.push(y);return x}function Mi(u){var e=u.length;return e?u[zt(0,e-1)]:r}function qa(u,e){return S0(Du(u),Ne(e,0,u.length))}function Na(u){return S0(Du(u))}function wt(u,e,t){(t!==r&&!Vu(u[e],t)||t===r&&!(e in u))&&le(u,e,t)}function wn(u,e,t){var c=u[e];(!(eu.call(u,e)&&Vu(c,t))||t===r&&!(e in u))&&le(u,e,t)}function _0(u,e){for(var t=u.length;t--;)if(Vu(u[t][0],e))return t;return-1}function Ua(u,e,t,c){return De(u,function(s,p,_){e(c,s,t(s),_)}),c}function Pi(u,e){return u&&ne(e,pu(e),u)}function Wa(u,e){return u&&ne(e,Fu(e),u)}function le(u,e,t){e=="__proto__"&&s0?s0(u,e,{configurable:!0,enumerable:!0,value:t,writable:!0}):u[e]=t}function St(u,e){for(var t=-1,c=e.length,s=C(c),p=u==null;++t<c;)s[t]=p?r:ar(u,e[t]);return s}function Ne(u,e,t){return u===u&&(t!==r&&(u=u<=t?u:t),e!==r&&(u=u>=e?u:e)),u}function Wu(u,e,t,c,s,p){var _,x=e&v,A=e&T,y=e&S;if(t&&(_=s?t(u,c,s,p):t(u)),_!==r)return _;if(!ou(u))return u;var F=H(u);if(F){if(_=Ts(u),!x)return Du(u,_)}else{var w=ku(u),I=w==Yn||w==qr;if(Se(u))return fc(u,x);if(w==oe||w==Ze||I&&!s){if(_=A||I?{}:yc(u),!x)return A?ms(u,Wa(_,u)):xs(u,Pi(_,u))}else{if(!ru[w])return s?u:{};_=Is(u,w,x)}}p||(p=new Xu);var L=p.get(u);if(L)return L;p.set(u,_),ef(u)?u.forEach(function(U){_.add(Wu(U,e,t,U,u,p))}):jc(u)&&u.forEach(function(U,X){_.set(X,Wu(U,e,t,X,u,p))});var N=y?A?Jt:Yt:A?Fu:pu,G=F?r:N(u);return qu(G||u,function(U,X){G&&(X=U,U=u[X]),wn(_,X,Wu(U,e,t,X,u,p))}),_}function $a(u){var e=pu(u);return function(t){return zi(t,u,e)}}function zi(u,e,t){var c=t.length;if(u==null)return!c;for(u=tu(u);c--;){var s=t[c],p=e[s],_=u[s];if(_===r&&!(s in u)||!p(_))return!1}return!0}function qi(u,e,t){if(typeof u!="function")throw new Nu(l);return On(function(){u.apply(r,t)},e)}function Sn(u,e,t,c){var s=-1,p=jn,_=!0,x=u.length,A=[],y=e.length;if(!x)return A;t&&(e=fu(e,Iu(t))),c?(p=bt,_=!1):e.length>=o&&(p=Cn,_=!1,e=new qe(e));u:for(;++s<x;){var F=u[s],w=t==null?F:t(F);if(F=c||F!==0?F:0,_&&w===w){for(var I=y;I--;)if(e[I]===w)continue u;A.push(F)}else p(e,w,c)||A.push(F)}return A}var De=dc(ee),Ni=dc(It,!0);function Ha(u,e){var t=!0;return De(u,function(c,s,p){return t=!!e(c,s,p),t}),t}function g0(u,e,t){for(var c=-1,s=u.length;++c<s;){var p=u[c],_=e(p);if(_!=null&&(x===r?_===_&&!Lu(_):t(_,x)))var x=_,A=p}return A}function Za(u,e,t,c){var s=u.length;for(t=Z(t),t<0&&(t=-t>s?0:s+t),c=c===r||c>s?s:Z(c),c<0&&(c+=s),c=t>c?0:tf(c);t<c;)u[t++]=e;return u}function Ui(u,e){var t=[];return De(u,function(c,s,p){e(c,s,p)&&t.push(c)}),t}function mu(u,e,t,c,s){var p=-1,_=u.length;for(t||(t=Ls),s||(s=[]);++p<_;){var x=u[p];e>0&&t(x)?e>1?mu(x,e-1,t,c,s):Ce(s,x):c||(s[s.length]=x)}return s}var Tt=hc(),Wi=hc(!0);function ee(u,e){return u&&Tt(u,e,pu)}function It(u,e){return u&&Wi(u,e,pu)}function x0(u,e){return ke(e,function(t){return be(u[t])})}function Ue(u,e){e=Fe(e,u);for(var t=0,c=e.length;u!=null&&t<c;)u=u[te(e[t++])];return t&&t==c?u:r}function $i(u,e,t){var c=e(u);return H(u)?c:Ce(c,t(u))}function Cu(u){return u==null?u===r?Ao:xo:Pe&&Pe in tu(u)?Fs(u):Ns(u)}function Rt(u,e){return u>e}function Ga(u,e){return u!=null&&eu.call(u,e)}function Ka(u,e){return u!=null&&e in tu(u)}function Ya(u,e,t){return u>=Au(e,t)&&u<hu(e,t)}function Lt(u,e,t){for(var c=t?bt:jn,s=u[0].length,p=u.length,_=p,x=C(p),A=1/0,y=[];_--;){var F=u[_];_&&e&&(F=fu(F,Iu(e))),A=Au(F.length,A),x[_]=!t&&(e||s>=120&&F.length>=120)?new qe(_&&F):r}F=u[0];var w=-1,I=x[0];u:for(;++w<s&&y.length<A;){var L=F[w],N=e?e(L):L;if(L=t||L!==0?L:0,!(I?Cn(I,N):c(y,N,t))){for(_=p;--_;){var G=x[_];if(!(G?Cn(G,N):c(u[_],N,t)))continue u}I&&I.push(N),y.push(L)}}return y}function Ja(u,e,t,c){return ee(u,function(s,p,_){e(c,t(s),p,_)}),c}function Tn(u,e,t){e=Fe(e,u),u=Tc(u,e);var c=u==null?u:u[te(Hu(e))];return c==null?r:Tu(c,u,t)}function Hi(u){return au(u)&&Cu(u)==Ze}function Xa(u){return au(u)&&Cu(u)==kn}function Va(u){return au(u)&&Cu(u)==_n}function In(u,e,t,c,s){return u===e?!0:u==null||e==null||!au(u)&&!au(e)?u!==u&&e!==e:Qa(u,e,t,c,In,s)}function Qa(u,e,t,c,s,p){var _=H(u),x=H(e),A=_?Gn:ku(u),y=x?Gn:ku(e);A=A==Ze?oe:A,y=y==Ze?oe:y;var F=A==oe,w=y==oe,I=A==y;if(I&&Se(u)){if(!Se(e))return!1;_=!0,F=!1}if(I&&!F)return p||(p=new Xu),_||cn(u)?vc(u,e,t,c,s,p):Ds(u,e,A,t,c,s,p);if(!(t&k)){var L=F&&eu.call(u,"__wrapped__"),N=w&&eu.call(e,"__wrapped__");if(L||N){var G=L?u.value():u,U=N?e.value():e;return p||(p=new Xu),s(G,U,t,c,p)}}return I?(p||(p=new Xu),ys(u,e,t,c,s,p)):!1}function ja(u){return au(u)&&ku(u)==Ku}function Bt(u,e,t,c){var s=t.length,p=s,_=!c;if(u==null)return!p;for(u=tu(u);s--;){var x=t[s];if(_&&x[2]?x[1]!==u[x[0]]:!(x[0]in u))return!1}for(;++s<p;){x=t[s];var A=x[0],y=u[A],F=x[1];if(_&&x[2]){if(y===r&&!(A in u))return!1}else{var w=new Xu;if(c)var I=c(y,F,A,u,e,w);if(!(I===r?In(F,y,k|W,c,w):I))return!1}}return!0}function Zi(u){if(!ou(u)||Os(u))return!1;var e=be(u)?j1:$o;return e.test($e(u))}function us(u){return au(u)&&Cu(u)==xn}function es(u){return au(u)&&ku(u)==Yu}function ns(u){return au(u)&&O0(u.length)&&!!cu[Cu(u)]}function Gi(u){return typeof u=="function"?u:u==null?wu:typeof u=="object"?H(u)?Ji(u[0],u[1]):Yi(u):bf(u)}function Ot(u){if(!Bn(u))return ia(u);var e=[];for(var t in tu(u))eu.call(u,t)&&t!="constructor"&&e.push(t);return e}function ts(u){if(!ou(u))return qs(u);var e=Bn(u),t=[];for(var c in u)c=="constructor"&&(e||!eu.call(u,c))||t.push(c);return t}function Mt(u,e){return u<e}function Ki(u,e){var t=-1,c=yu(u)?C(u.length):[];return De(u,function(s,p,_){c[++t]=e(s,p,_)}),c}function Yi(u){var e=Vt(u);return e.length==1&&e[0][2]?wc(e[0][0],e[0][1]):function(t){return t===u||Bt(t,u,e)}}function Ji(u,e){return jt(u)&&Fc(e)?wc(te(u),e):function(t){var c=ar(t,u);return c===r&&c===e?sr(t,u):In(e,c,k|W)}}function m0(u,e,t,c,s){u!==e&&Tt(e,function(p,_){if(s||(s=new Xu),ou(p))rs(u,e,_,t,m0,c,s);else{var x=c?c(er(u,_),p,_+"",u,e,s):r;x===r&&(x=p),wt(u,_,x)}},Fu)}function rs(u,e,t,c,s,p,_){var x=er(u,t),A=er(e,t),y=_.get(A);if(y){wt(u,t,y);return}var F=p?p(x,A,t+"",u,e,_):r,w=F===r;if(w){var I=H(A),L=!I&&Se(A),N=!I&&!L&&cn(A);F=A,I||L||N?H(x)?F=x:su(x)?F=Du(x):L?(w=!1,F=fc(A,!0)):N?(w=!1,F=oc(A,!0)):F=[]:Mn(A)||He(A)?(F=x,He(x)?F=rf(x):(!ou(x)||be(x))&&(F=yc(A))):w=!1}w&&(_.set(A,F),s(F,A,c,p,_),_.delete(A)),wt(u,t,F)}function Xi(u,e){var t=u.length;if(t)return e+=e<0?t:0,pe(e,t)?u[e]:r}function Vi(u,e,t){e.length?e=fu(e,function(p){return H(p)?function(_){return Ue(_,p.length===1?p[0]:p)}:p}):e=[wu];var c=-1;e=fu(e,Iu(z()));var s=Ki(u,function(p,_,x){var A=fu(e,function(y){return y(p)});return{criteria:A,index:++c,value:p}});return I1(s,function(p,_){return gs(p,_,t)})}function is(u,e){return Qi(u,e,function(t,c){return sr(u,c)})}function Qi(u,e,t){for(var c=-1,s=e.length,p={};++c<s;){var _=e[c],x=Ue(u,_);t(x,_)&&Rn(p,Fe(_,u),x)}return p}function cs(u){return function(e){return Ue(e,u)}}function Pt(u,e,t,c){var s=c?T1:Ye,p=-1,_=e.length,x=u;for(u===e&&(e=Du(e)),t&&(x=fu(u,Iu(t)));++p<_;)for(var A=0,y=e[p],F=t?t(y):y;(A=s(x,F,A,c))>-1;)x!==u&&a0.call(x,A,1),a0.call(u,A,1);return u}function ji(u,e){for(var t=u?e.length:0,c=t-1;t--;){var s=e[t];if(t==c||s!==p){var p=s;pe(s)?a0.call(u,s,1):Ut(u,s)}}return u}function zt(u,e){return u+d0(Li()*(e-u+1))}function fs(u,e,t,c){for(var s=-1,p=hu(l0((e-u)/(t||1)),0),_=C(p);p--;)_[c?p:++s]=u,u+=t;return _}function qt(u,e){var t="";if(!u||e<1||e>Ae)return t;do e%2&&(t+=u),e=d0(e/2),e&&(u+=u);while(e);return t}function Y(u,e){return nr(Sc(u,e,wu),u+"")}function os(u){return Mi(fn(u))}function as(u,e){var t=fn(u);return S0(t,Ne(e,0,t.length))}function Rn(u,e,t,c){if(!ou(u))return u;e=Fe(e,u);for(var s=-1,p=e.length,_=p-1,x=u;x!=null&&++s<p;){var A=te(e[s]),y=t;if(A==="__proto__"||A==="constructor"||A==="prototype")return u;if(s!=_){var F=x[A];y=c?c(F,A,x):r,y===r&&(y=ou(F)?F:pe(e[s+1])?[]:{})}wn(x,A,y),x=x[A]}return u}var uc=h0?function(u,e){return h0.set(u,e),u}:wu,ss=s0?function(u,e){return s0(u,"toString",{configurable:!0,enumerable:!1,value:dr(e),writable:!0})}:wu;function ls(u){return S0(fn(u))}function $u(u,e,t){var c=-1,s=u.length;e<0&&(e=-e>s?0:s+e),t=t>s?s:t,t<0&&(t+=s),s=e>t?0:t-e>>>0,e>>>=0;for(var p=C(s);++c<s;)p[c]=u[c+e];return p}function ds(u,e){var t;return De(u,function(c,s,p){return t=e(c,s,p),!t}),!!t}function A0(u,e,t){var c=0,s=u==null?c:u.length;if(typeof e=="number"&&e===e&&s<=po){for(;c<s;){var p=c+s>>>1,_=u[p];_!==null&&!Lu(_)&&(t?_<=e:_<e)?c=p+1:s=p}return s}return Nt(u,e,wu,t)}function Nt(u,e,t,c){var s=0,p=u==null?0:u.length;if(p===0)return 0;e=t(e);for(var _=e!==e,x=e===null,A=Lu(e),y=e===r;s<p;){var F=d0((s+p)/2),w=t(u[F]),I=w!==r,L=w===null,N=w===w,G=Lu(w);if(_)var U=c||N;else y?U=N&&(c||I):x?U=N&&I&&(c||!L):A?U=N&&I&&!L&&(c||!G):L||G?U=!1:U=c?w<=e:w<e;U?s=F+1:p=F}return Au(p,ho)}function ec(u,e){for(var t=-1,c=u.length,s=0,p=[];++t<c;){var _=u[t],x=e?e(_):_;if(!t||!Vu(x,A)){var A=x;p[s++]=_===0?0:_}}return p}function nc(u){return typeof u=="number"?u:Lu(u)?Zn:+u}function Ru(u){if(typeof u=="string")return u;if(H(u))return fu(u,Ru)+"";if(Lu(u))return Bi?Bi.call(u):"";var e=u+"";return e=="0"&&1/u==-Oe?"-0":e}function ye(u,e,t){var c=-1,s=jn,p=u.length,_=!0,x=[],A=x;if(t)_=!1,s=bt;else if(p>=o){var y=e?null:vs(u);if(y)return e0(y);_=!1,s=Cn,A=new qe}else A=e?[]:x;u:for(;++c<p;){var F=u[c],w=e?e(F):F;if(F=t||F!==0?F:0,_&&w===w){for(var I=A.length;I--;)if(A[I]===w)continue u;e&&A.push(w),x.push(F)}else s(A,w,t)||(A!==x&&A.push(w),x.push(F))}return x}function Ut(u,e){return e=Fe(e,u),u=Tc(u,e),u==null||delete u[te(Hu(e))]}function tc(u,e,t,c){return Rn(u,e,t(Ue(u,e)),c)}function k0(u,e,t,c){for(var s=u.length,p=c?s:-1;(c?p--:++p<s)&&e(u[p],p,u););return t?$u(u,c?0:p,c?p+1:s):$u(u,c?p+1:0,c?s:p)}function rc(u,e){var t=u;return t instanceof V&&(t=t.value()),_t(e,function(c,s){return s.func.apply(s.thisArg,Ce([c],s.args))},t)}function Wt(u,e,t){var c=u.length;if(c<2)return c?ye(u[0]):[];for(var s=-1,p=C(c);++s<c;)for(var _=u[s],x=-1;++x<c;)x!=s&&(p[s]=Sn(p[s]||_,u[x],e,t));return ye(mu(p,1),e,t)}function ic(u,e,t){for(var c=-1,s=u.length,p=e.length,_={};++c<s;){var x=c<p?e[c]:r;t(_,u[c],x)}return _}function $t(u){return su(u)?u:[]}function Ht(u){return typeof u=="function"?u:wu}function Fe(u,e){return H(u)?u:jt(u,e)?[u]:Bc(uu(u))}var hs=Y;function we(u,e,t){var c=u.length;return t=t===r?c:t,!e&&t>=c?u:$u(u,e,t)}var cc=ua||function(u){return xu.clearTimeout(u)};function fc(u,e){if(e)return u.slice();var t=u.length,c=wi?wi(t):new u.constructor(t);return u.copy(c),c}function Zt(u){var e=new u.constructor(u.byteLength);return new f0(e).set(new f0(u)),e}function ps(u,e){var t=e?Zt(u.buffer):u.buffer;return new u.constructor(t,u.byteOffset,u.byteLength)}function bs(u){var e=new u.constructor(u.source,Hr.exec(u));return e.lastIndex=u.lastIndex,e}function _s(u){return Fn?tu(Fn.call(u)):{}}function oc(u,e){var t=e?Zt(u.buffer):u.buffer;return new u.constructor(t,u.byteOffset,u.length)}function ac(u,e){if(u!==e){var t=u!==r,c=u===null,s=u===u,p=Lu(u),_=e!==r,x=e===null,A=e===e,y=Lu(e);if(!x&&!y&&!p&&u>e||p&&_&&A&&!x&&!y||c&&_&&A||!t&&A||!s)return 1;if(!c&&!p&&!y&&u<e||y&&t&&s&&!c&&!p||x&&t&&s||!_&&s||!A)return-1}return 0}function gs(u,e,t){for(var c=-1,s=u.criteria,p=e.criteria,_=s.length,x=t.length;++c<_;){var A=ac(s[c],p[c]);if(A){if(c>=x)return A;var y=t[c];return A*(y=="desc"?-1:1)}}return u.index-e.index}function sc(u,e,t,c){for(var s=-1,p=u.length,_=t.length,x=-1,A=e.length,y=hu(p-_,0),F=C(A+y),w=!c;++x<A;)F[x]=e[x];for(;++s<_;)(w||s<p)&&(F[t[s]]=u[s]);for(;y--;)F[x++]=u[s++];return F}function lc(u,e,t,c){for(var s=-1,p=u.length,_=-1,x=t.length,A=-1,y=e.length,F=hu(p-x,0),w=C(F+y),I=!c;++s<F;)w[s]=u[s];for(var L=s;++A<y;)w[L+A]=e[A];for(;++_<x;)(I||s<p)&&(w[L+t[_]]=u[s++]);return w}function Du(u,e){var t=-1,c=u.length;for(e||(e=C(c));++t<c;)e[t]=u[t];return e}function ne(u,e,t,c){var s=!t;t||(t={});for(var p=-1,_=e.length;++p<_;){var x=e[p],A=c?c(t[x],u[x],x,t,u):r;A===r&&(A=u[x]),s?le(t,x,A):wn(t,x,A)}return t}function xs(u,e){return ne(u,Qt(u),e)}function ms(u,e){return ne(u,Ec(u),e)}function C0(u,e){return function(t,c){var s=H(t)?E1:Ua,p=e?e():{};return s(t,u,z(c,2),p)}}function nn(u){return Y(function(e,t){var c=-1,s=t.length,p=s>1?t[s-1]:r,_=s>2?t[2]:r;for(p=u.length>3&&typeof p=="function"?(s--,p):r,_&&vu(t[0],t[1],_)&&(p=s<3?r:p,s=1),e=tu(e);++c<s;){var x=t[c];x&&u(e,x,c,p)}return e})}function dc(u,e){return function(t,c){if(t==null)return t;if(!yu(t))return u(t,c);for(var s=t.length,p=e?s:-1,_=tu(t);(e?p--:++p<s)&&c(_[p],p,_)!==!1;);return t}}function hc(u){return function(e,t,c){for(var s=-1,p=tu(e),_=c(e),x=_.length;x--;){var A=_[u?x:++s];if(t(p[A],A,p)===!1)break}return e}}function As(u,e,t){var c=e&q,s=Ln(u);function p(){var _=this&&this!==xu&&this instanceof p?s:u;return _.apply(c?t:this,arguments)}return p}function pc(u){return function(e){e=uu(e);var t=Je(e)?Ju(e):r,c=t?t[0]:e.charAt(0),s=t?we(t,1).join(""):e.slice(1);return c[u]()+s}}function tn(u){return function(e){return _t(hf(df(e).replace(s1,"")),u,"")}}function Ln(u){return function(){var e=arguments;switch(e.length){case 0:return new u;case 1:return new u(e[0]);case 2:return new u(e[0],e[1]);case 3:return new u(e[0],e[1],e[2]);case 4:return new u(e[0],e[1],e[2],e[3]);case 5:return new u(e[0],e[1],e[2],e[3],e[4]);case 6:return new u(e[0],e[1],e[2],e[3],e[4],e[5]);case 7:return new u(e[0],e[1],e[2],e[3],e[4],e[5],e[6])}var t=en(u.prototype),c=u.apply(t,e);return ou(c)?c:t}}function ks(u,e,t){var c=Ln(u);function s(){for(var p=arguments.length,_=C(p),x=p,A=rn(s);x--;)_[x]=arguments[x];var y=p<3&&_[0]!==A&&_[p-1]!==A?[]:ve(_,A);if(p-=y.length,p<t)return mc(u,e,v0,s.placeholder,r,_,y,r,r,t-p);var F=this&&this!==xu&&this instanceof s?c:u;return Tu(F,this,_)}return s}function bc(u){return function(e,t,c){var s=tu(e);if(!yu(e)){var p=z(t,3);e=pu(e),t=function(x){return p(s[x],x,s)}}var _=u(e,t,c);return _>-1?s[p?e[_]:_]:r}}function _c(u){return he(function(e){var t=e.length,c=t,s=Uu.prototype.thru;for(u&&e.reverse();c--;){var p=e[c];if(typeof p!="function")throw new Nu(l);if(s&&!_&&F0(p)=="wrapper")var _=new Uu([],!0)}for(c=_?c:t;++c<t;){p=e[c];var x=F0(p),A=x=="wrapper"?Xt(p):r;A&&ur(A[0])&&A[1]==(nu|B|P|gu)&&!A[4].length&&A[9]==1?_=_[F0(A[0])].apply(_,A[3]):_=p.length==1&&ur(p)?_[x]():_.thru(p)}return function(){var y=arguments,F=y[0];if(_&&y.length==1&&H(F))return _.plant(F).value();for(var w=0,I=t?e[w].apply(this,y):F;++w<t;)I=e[w].call(this,I);return I}})}function v0(u,e,t,c,s,p,_,x,A,y){var F=e&nu,w=e&q,I=e&J,L=e&(B|M),N=e&Pu,G=I?r:Ln(u);function U(){for(var X=arguments.length,Q=C(X),Bu=X;Bu--;)Q[Bu]=arguments[Bu];if(L)var Eu=rn(U),Ou=L1(Q,Eu);if(c&&(Q=sc(Q,c,s,L)),p&&(Q=lc(Q,p,_,L)),X-=Ou,L&&X<y){var lu=ve(Q,Eu);return mc(u,e,v0,U.placeholder,t,Q,lu,x,A,y-X)}var Qu=w?t:this,ge=I?Qu[u]:u;return X=Q.length,x?Q=Us(Q,x):N&&X>1&&Q.reverse(),F&&A<X&&(Q.length=A),this&&this!==xu&&this instanceof U&&(ge=G||Ln(ge)),ge.apply(Qu,Q)}return U}function gc(u,e){return function(t,c){return Ja(t,u,e(c),{})}}function E0(u,e){return function(t,c){var s;if(t===r&&c===r)return e;if(t!==r&&(s=t),c!==r){if(s===r)return c;typeof t=="string"||typeof c=="string"?(t=Ru(t),c=Ru(c)):(t=nc(t),c=nc(c)),s=u(t,c)}return s}}function Gt(u){return he(function(e){return e=fu(e,Iu(z())),Y(function(t){var c=this;return u(e,function(s){return Tu(s,c,t)})})})}function D0(u,e){e=e===r?" ":Ru(e);var t=e.length;if(t<2)return t?qt(e,u):e;var c=qt(e,l0(u/Xe(e)));return Je(e)?we(Ju(c),0,u).join(""):c.slice(0,u)}function Cs(u,e,t,c){var s=e&q,p=Ln(u);function _(){for(var x=-1,A=arguments.length,y=-1,F=c.length,w=C(F+A),I=this&&this!==xu&&this instanceof _?p:u;++y<F;)w[y]=c[y];for(;A--;)w[y++]=arguments[++x];return Tu(I,s?t:this,w)}return _}function xc(u){return function(e,t,c){return c&&typeof c!="number"&&vu(e,t,c)&&(t=c=r),e=_e(e),t===r?(t=e,e=0):t=_e(t),c=c===r?e<t?1:-1:_e(c),fs(e,t,c,u)}}function y0(u){return function(e,t){return typeof e=="string"&&typeof t=="string"||(e=Zu(e),t=Zu(t)),u(e,t)}}function mc(u,e,t,c,s,p,_,x,A,y){var F=e&B,w=F?_:r,I=F?r:_,L=F?p:r,N=F?r:p;e|=F?P:K,e&=~(F?K:P),e&O||(e&=-4);var G=[u,e,s,L,w,N,I,x,A,y],U=t.apply(r,G);return ur(u)&&Ic(U,G),U.placeholder=c,Rc(U,u,e)}function Kt(u){var e=du[u];return function(t,c){if(t=Zu(t),c=c==null?0:Au(Z(c),292),c&&Ri(t)){var s=(uu(t)+"e").split("e"),p=e(s[0]+"e"+(+s[1]+c));return s=(uu(p)+"e").split("e"),+(s[0]+"e"+(+s[1]-c))}return e(t)}}var vs=je&&1/e0(new je([,-0]))[1]==Oe?function(u){return new je(u)}:br;function Ac(u){return function(e){var t=ku(e);return t==Ku?vt(e):t==Yu?N1(e):R1(e,u(e))}}function de(u,e,t,c,s,p,_,x){var A=e&J;if(!A&&typeof u!="function")throw new Nu(l);var y=c?c.length:0;if(y||(e&=-97,c=s=r),_=_===r?_:hu(Z(_),0),x=x===r?x:Z(x),y-=s?s.length:0,e&K){var F=c,w=s;c=s=r}var I=A?r:Xt(u),L=[u,e,t,c,s,F,w,p,_,x];if(I&&zs(L,I),u=L[0],e=L[1],t=L[2],c=L[3],s=L[4],x=L[9]=L[9]===r?A?0:u.length:hu(L[9]-y,0),!x&&e&(B|M)&&(e&=-25),!e||e==q)var N=As(u,e,t);else e==B||e==M?N=ks(u,e,x):(e==P||e==(q|P))&&!s.length?N=Cs(u,e,t,c):N=v0.apply(r,L);var G=I?uc:Ic;return Rc(G(N,L),u,e)}function kc(u,e,t,c){return u===r||Vu(u,Qe[t])&&!eu.call(c,t)?e:u}function Cc(u,e,t,c,s,p){return ou(u)&&ou(e)&&(p.set(e,u),m0(u,e,r,Cc,p),p.delete(e)),u}function Es(u){return Mn(u)?r:u}function vc(u,e,t,c,s,p){var _=t&k,x=u.length,A=e.length;if(x!=A&&!(_&&A>x))return!1;var y=p.get(u),F=p.get(e);if(y&&F)return y==e&&F==u;var w=-1,I=!0,L=t&W?new qe:r;for(p.set(u,e),p.set(e,u);++w<x;){var N=u[w],G=e[w];if(c)var U=_?c(G,N,w,e,u,p):c(N,G,w,u,e,p);if(U!==r){if(U)continue;I=!1;break}if(L){if(!gt(e,function(X,Q){if(!Cn(L,Q)&&(N===X||s(N,X,t,c,p)))return L.push(Q)})){I=!1;break}}else if(!(N===G||s(N,G,t,c,p))){I=!1;break}}return p.delete(u),p.delete(e),I}function Ds(u,e,t,c,s,p,_){switch(t){case Ge:if(u.byteLength!=e.byteLength||u.byteOffset!=e.byteOffset)return!1;u=u.buffer,e=e.buffer;case kn:return!(u.byteLength!=e.byteLength||!p(new f0(u),new f0(e)));case bn:case _n:case gn:return Vu(+u,+e);case Kn:return u.name==e.name&&u.message==e.message;case xn:case mn:return u==e+"";case Ku:var x=vt;case Yu:var A=c&k;if(x||(x=e0),u.size!=e.size&&!A)return!1;var y=_.get(u);if(y)return y==e;c|=W,_.set(u,e);var F=vc(x(u),x(e),c,s,p,_);return _.delete(u),F;case Jn:if(Fn)return Fn.call(u)==Fn.call(e)}return!1}function ys(u,e,t,c,s,p){var _=t&k,x=Yt(u),A=x.length,y=Yt(e),F=y.length;if(A!=F&&!_)return!1;for(var w=A;w--;){var I=x[w];if(!(_?I in e:eu.call(e,I)))return!1}var L=p.get(u),N=p.get(e);if(L&&N)return L==e&&N==u;var G=!0;p.set(u,e),p.set(e,u);for(var U=_;++w<A;){I=x[w];var X=u[I],Q=e[I];if(c)var Bu=_?c(Q,X,I,e,u,p):c(X,Q,I,u,e,p);if(!(Bu===r?X===Q||s(X,Q,t,c,p):Bu)){G=!1;break}U||(U=I=="constructor")}if(G&&!U){var Eu=u.constructor,Ou=e.constructor;Eu!=Ou&&"constructor"in u&&"constructor"in e&&!(typeof Eu=="function"&&Eu instanceof Eu&&typeof Ou=="function"&&Ou instanceof Ou)&&(G=!1)}return p.delete(u),p.delete(e),G}function he(u){return nr(Sc(u,r,zc),u+"")}function Yt(u){return $i(u,pu,Qt)}function Jt(u){return $i(u,Fu,Ec)}var Xt=h0?function(u){return h0.get(u)}:br;function F0(u){for(var e=u.name+"",t=un[e],c=eu.call(un,e)?t.length:0;c--;){var s=t[c],p=s.func;if(p==null||p==u)return s.name}return e}function rn(u){var e=eu.call(d,"placeholder")?d:u;return e.placeholder}function z(){var u=d.iteratee||hr;return u=u===hr?Gi:u,arguments.length?u(arguments[0],arguments[1]):u}function w0(u,e){var t=u.__data__;return Bs(e)?t[typeof e=="string"?"string":"hash"]:t.map}function Vt(u){for(var e=pu(u),t=e.length;t--;){var c=e[t],s=u[c];e[t]=[c,s,Fc(s)]}return e}function We(u,e){var t=P1(u,e);return Zi(t)?t:r}function Fs(u){var e=eu.call(u,Pe),t=u[Pe];try{u[Pe]=r;var c=!0}catch(p){}var s=i0.call(u);return c&&(e?u[Pe]=t:delete u[Pe]),s}var Qt=Dt?function(u){return u==null?[]:(u=tu(u),ke(Dt(u),function(e){return Ti.call(u,e)}))}:_r,Ec=Dt?function(u){for(var e=[];u;)Ce(e,Qt(u)),u=o0(u);return e}:_r,ku=Cu;(yt&&ku(new yt(new ArrayBuffer(1)))!=Ge||En&&ku(new En)!=Ku||Ft&&ku(Ft.resolve())!=Nr||je&&ku(new je)!=Yu||Dn&&ku(new Dn)!=An)&&(ku=function(u){var e=Cu(u),t=e==oe?u.constructor:r,c=t?$e(t):"";if(c)switch(c){case aa:return Ge;case sa:return Ku;case la:return Nr;case da:return Yu;case ha:return An}return e});function ws(u,e,t){for(var c=-1,s=t.length;++c<s;){var p=t[c],_=p.size;switch(p.type){case"drop":u+=_;break;case"dropRight":e-=_;break;case"take":e=Au(e,u+_);break;case"takeRight":u=hu(u,e-_);break}}return{start:u,end:e}}function Ss(u){var e=u.match(Oo);return e?e[1].split(Mo):[]}function Dc(u,e,t){e=Fe(e,u);for(var c=-1,s=e.length,p=!1;++c<s;){var _=te(e[c]);if(!(p=u!=null&&t(u,_)))break;u=u[_]}return p||++c!=s?p:(s=u==null?0:u.length,!!s&&O0(s)&&pe(_,s)&&(H(u)||He(u)))}function Ts(u){var e=u.length,t=new u.constructor(e);return e&&typeof u[0]=="string"&&eu.call(u,"index")&&(t.index=u.index,t.input=u.input),t}function yc(u){return typeof u.constructor=="function"&&!Bn(u)?en(o0(u)):{}}function Is(u,e,t){var c=u.constructor;switch(e){case kn:return Zt(u);case bn:case _n:return new c(+u);case Ge:return ps(u,t);case V0:case Q0:case j0:case ut:case et:case nt:case tt:case rt:case it:return oc(u,t);case Ku:return new c;case gn:case mn:return new c(u);case xn:return bs(u);case Yu:return new c;case Jn:return _s(u)}}function Rs(u,e){var t=e.length;if(!t)return u;var c=t-1;return e[c]=(t>1?"& ":"")+e[c],e=e.join(t>2?", ":" "),u.replace(Bo,`{
/* [wrapped with `+e+`] */
`)}function Ls(u){return H(u)||He(u)||!!(Ii&&u&&u[Ii])}function pe(u,e){var t=typeof u;return e=e==null?Ae:e,!!e&&(t=="number"||t!="symbol"&&Zo.test(u))&&u>-1&&u%1==0&&u<e}function vu(u,e,t){if(!ou(t))return!1;var c=typeof e;return(c=="number"?yu(t)&&pe(e,t.length):c=="string"&&e in t)?Vu(t[e],u):!1}function jt(u,e){if(H(u))return!1;var t=typeof u;return t=="number"||t=="symbol"||t=="boolean"||u==null||Lu(u)?!0:To.test(u)||!So.test(u)||e!=null&&u in tu(e)}function Bs(u){var e=typeof u;return e=="string"||e=="number"||e=="symbol"||e=="boolean"?u!=="__proto__":u===null}function ur(u){var e=F0(u),t=d[e];if(typeof t!="function"||!(e in V.prototype))return!1;if(u===t)return!0;var c=Xt(t);return!!c&&u===c[0]}function Os(u){return!!Fi&&Fi in u}var Ms=t0?be:gr;function Bn(u){var e=u&&u.constructor,t=typeof e=="function"&&e.prototype||Qe;return u===t}function Fc(u){return u===u&&!ou(u)}function wc(u,e){return function(t){return t==null?!1:t[u]===e&&(e!==r||u in tu(t))}}function Ps(u){var e=L0(u,function(c){return t.size===g&&t.clear(),c}),t=e.cache;return e}function zs(u,e){var t=u[1],c=e[1],s=t|c,p=s<(q|J|nu),_=c==nu&&t==B||c==nu&&t==gu&&u[7].length<=e[8]||c==(nu|gu)&&e[7].length<=e[8]&&t==B;if(!(p||_))return u;c&q&&(u[2]=e[2],s|=t&q?0:O);var x=e[3];if(x){var A=u[3];u[3]=A?sc(A,x,e[4]):x,u[4]=A?ve(u[3],E):e[4]}return x=e[5],x&&(A=u[5],u[5]=A?lc(A,x,e[6]):x,u[6]=A?ve(u[5],E):e[6]),x=e[7],x&&(u[7]=x),c&nu&&(u[8]=u[8]==null?e[8]:Au(u[8],e[8])),u[9]==null&&(u[9]=e[9]),u[0]=e[0],u[1]=s,u}function qs(u){var e=[];if(u!=null)for(var t in tu(u))e.push(t);return e}function Ns(u){return i0.call(u)}function Sc(u,e,t){return e=hu(e===r?u.length-1:e,0),function(){for(var c=arguments,s=-1,p=hu(c.length-e,0),_=C(p);++s<p;)_[s]=c[e+s];s=-1;for(var x=C(e+1);++s<e;)x[s]=c[s];return x[e]=t(_),Tu(u,this,x)}}function Tc(u,e){return e.length<2?u:Ue(u,$u(e,0,-1))}function Us(u,e){for(var t=u.length,c=Au(e.length,t),s=Du(u);c--;){var p=e[c];u[c]=pe(p,t)?s[p]:r}return u}function er(u,e){if(!(e==="constructor"&&typeof u[e]=="function")&&e!="__proto__")return u[e]}var Ic=Lc(uc),On=na||function(u,e){return xu.setTimeout(u,e)},nr=Lc(ss);function Rc(u,e,t){var c=e+"";return nr(u,Rs(c,Ws(Ss(c),t)))}function Lc(u){var e=0,t=0;return function(){var c=ca(),s=J0-(c-t);if(t=c,s>0){if(++e>=Y0)return arguments[0]}else e=0;return u.apply(r,arguments)}}function S0(u,e){var t=-1,c=u.length,s=c-1;for(e=e===r?c:e;++t<e;){var p=zt(t,s),_=u[p];u[p]=u[t],u[t]=_}return u.length=e,u}var Bc=Ps(function(u){var e=[];return u.charCodeAt(0)===46&&e.push(""),u.replace(Io,function(t,c,s,p){e.push(s?p.replace(qo,"$1"):c||t)}),e});function te(u){if(typeof u=="string"||Lu(u))return u;var e=u+"";return e=="0"&&1/u==-Oe?"-0":e}function $e(u){if(u!=null){try{return r0.call(u)}catch(e){}try{return u+""}catch(e){}}return""}function Ws(u,e){return qu(bo,function(t){var c="_."+t[0];e&t[1]&&!jn(u,c)&&u.push(c)}),u.sort()}function Oc(u){if(u instanceof V)return u.clone();var e=new Uu(u.__wrapped__,u.__chain__);return e.__actions__=Du(u.__actions__),e.__index__=u.__index__,e.__values__=u.__values__,e}function $s(u,e,t){(t?vu(u,e,t):e===r)?e=1:e=hu(Z(e),0);var c=u==null?0:u.length;if(!c||e<1)return[];for(var s=0,p=0,_=C(l0(c/e));s<c;)_[p++]=$u(u,s,s+=e);return _}function Hs(u){for(var e=-1,t=u==null?0:u.length,c=0,s=[];++e<t;){var p=u[e];p&&(s[c++]=p)}return s}function Zs(){var u=arguments.length;if(!u)return[];for(var e=C(u-1),t=arguments[0],c=u;c--;)e[c-1]=arguments[c];return Ce(H(t)?Du(t):[t],mu(e,1))}var Gs=Y(function(u,e){return su(u)?Sn(u,mu(e,1,su,!0)):[]}),Ks=Y(function(u,e){var t=Hu(e);return su(t)&&(t=r),su(u)?Sn(u,mu(e,1,su,!0),z(t,2)):[]}),Ys=Y(function(u,e){var t=Hu(e);return su(t)&&(t=r),su(u)?Sn(u,mu(e,1,su,!0),r,t):[]});function Js(u,e,t){var c=u==null?0:u.length;return c?(e=t||e===r?1:Z(e),$u(u,e<0?0:e,c)):[]}function Xs(u,e,t){var c=u==null?0:u.length;return c?(e=t||e===r?1:Z(e),e=c-e,$u(u,0,e<0?0:e)):[]}function Vs(u,e){return u&&u.length?k0(u,z(e,3),!0,!0):[]}function Qs(u,e){return u&&u.length?k0(u,z(e,3),!0):[]}function js(u,e,t,c){var s=u==null?0:u.length;return s?(t&&typeof t!="number"&&vu(u,e,t)&&(t=0,c=s),Za(u,e,t,c)):[]}function Mc(u,e,t){var c=u==null?0:u.length;if(!c)return-1;var s=t==null?0:Z(t);return s<0&&(s=hu(c+s,0)),u0(u,z(e,3),s)}function Pc(u,e,t){var c=u==null?0:u.length;if(!c)return-1;var s=c-1;return t!==r&&(s=Z(t),s=t<0?hu(c+s,0):Au(s,c-1)),u0(u,z(e,3),s,!0)}function zc(u){var e=u==null?0:u.length;return e?mu(u,1):[]}function ul(u){var e=u==null?0:u.length;return e?mu(u,Oe):[]}function el(u,e){var t=u==null?0:u.length;return t?(e=e===r?1:Z(e),mu(u,e)):[]}function nl(u){for(var e=-1,t=u==null?0:u.length,c={};++e<t;){var s=u[e];c[s[0]]=s[1]}return c}function qc(u){return u&&u.length?u[0]:r}function tl(u,e,t){var c=u==null?0:u.length;if(!c)return-1;var s=t==null?0:Z(t);return s<0&&(s=hu(c+s,0)),Ye(u,e,s)}function rl(u){var e=u==null?0:u.length;return e?$u(u,0,-1):[]}var il=Y(function(u){var e=fu(u,$t);return e.length&&e[0]===u[0]?Lt(e):[]}),cl=Y(function(u){var e=Hu(u),t=fu(u,$t);return e===Hu(t)?e=r:t.pop(),t.length&&t[0]===u[0]?Lt(t,z(e,2)):[]}),fl=Y(function(u){var e=Hu(u),t=fu(u,$t);return e=typeof e=="function"?e:r,e&&t.pop(),t.length&&t[0]===u[0]?Lt(t,r,e):[]});function ol(u,e){return u==null?"":ra.call(u,e)}function Hu(u){var e=u==null?0:u.length;return e?u[e-1]:r}function al(u,e,t){var c=u==null?0:u.length;if(!c)return-1;var s=c;return t!==r&&(s=Z(t),s=s<0?hu(c+s,0):Au(s,c-1)),e===e?W1(u,e,s):u0(u,mi,s,!0)}function sl(u,e){return u&&u.length?Xi(u,Z(e)):r}var ll=Y(Nc);function Nc(u,e){return u&&u.length&&e&&e.length?Pt(u,e):u}function dl(u,e,t){return u&&u.length&&e&&e.length?Pt(u,e,z(t,2)):u}function hl(u,e,t){return u&&u.length&&e&&e.length?Pt(u,e,r,t):u}var pl=he(function(u,e){var t=u==null?0:u.length,c=St(u,e);return ji(u,fu(e,function(s){return pe(s,t)?+s:s}).sort(ac)),c});function bl(u,e){var t=[];if(!(u&&u.length))return t;var c=-1,s=[],p=u.length;for(e=z(e,3);++c<p;){var _=u[c];e(_,c,u)&&(t.push(_),s.push(c))}return ji(u,s),t}function tr(u){return u==null?u:oa.call(u)}function _l(u,e,t){var c=u==null?0:u.length;return c?(t&&typeof t!="number"&&vu(u,e,t)?(e=0,t=c):(e=e==null?0:Z(e),t=t===r?c:Z(t)),$u(u,e,t)):[]}function gl(u,e){return A0(u,e)}function xl(u,e,t){return Nt(u,e,z(t,2))}function ml(u,e){var t=u==null?0:u.length;if(t){var c=A0(u,e);if(c<t&&Vu(u[c],e))return c}return-1}function Al(u,e){return A0(u,e,!0)}function kl(u,e,t){return Nt(u,e,z(t,2),!0)}function Cl(u,e){var t=u==null?0:u.length;if(t){var c=A0(u,e,!0)-1;if(Vu(u[c],e))return c}return-1}function vl(u){return u&&u.length?ec(u):[]}function El(u,e){return u&&u.length?ec(u,z(e,2)):[]}function Dl(u){var e=u==null?0:u.length;return e?$u(u,1,e):[]}function yl(u,e,t){return u&&u.length?(e=t||e===r?1:Z(e),$u(u,0,e<0?0:e)):[]}function Fl(u,e,t){var c=u==null?0:u.length;return c?(e=t||e===r?1:Z(e),e=c-e,$u(u,e<0?0:e,c)):[]}function wl(u,e){return u&&u.length?k0(u,z(e,3),!1,!0):[]}function Sl(u,e){return u&&u.length?k0(u,z(e,3)):[]}var Tl=Y(function(u){return ye(mu(u,1,su,!0))}),Il=Y(function(u){var e=Hu(u);return su(e)&&(e=r),ye(mu(u,1,su,!0),z(e,2))}),Rl=Y(function(u){var e=Hu(u);return e=typeof e=="function"?e:r,ye(mu(u,1,su,!0),r,e)});function Ll(u){return u&&u.length?ye(u):[]}function Bl(u,e){return u&&u.length?ye(u,z(e,2)):[]}function Ol(u,e){return e=typeof e=="function"?e:r,u&&u.length?ye(u,r,e):[]}function rr(u){if(!(u&&u.length))return[];var e=0;return u=ke(u,function(t){if(su(t))return e=hu(t.length,e),!0}),kt(e,function(t){return fu(u,xt(t))})}function Uc(u,e){if(!(u&&u.length))return[];var t=rr(u);return e==null?t:fu(t,function(c){return Tu(e,r,c)})}var Ml=Y(function(u,e){return su(u)?Sn(u,e):[]}),Pl=Y(function(u){return Wt(ke(u,su))}),zl=Y(function(u){var e=Hu(u);return su(e)&&(e=r),Wt(ke(u,su),z(e,2))}),ql=Y(function(u){var e=Hu(u);return e=typeof e=="function"?e:r,Wt(ke(u,su),r,e)}),Nl=Y(rr);function Ul(u,e){return ic(u||[],e||[],wn)}function Wl(u,e){return ic(u||[],e||[],Rn)}var $l=Y(function(u){var e=u.length,t=e>1?u[e-1]:r;return t=typeof t=="function"?(u.pop(),t):r,Uc(u,t)});function Wc(u){var e=d(u);return e.__chain__=!0,e}function Hl(u,e){return e(u),u}function T0(u,e){return e(u)}var Zl=he(function(u){var e=u.length,t=e?u[0]:0,c=this.__wrapped__,s=function(p){return St(p,u)};return e>1||this.__actions__.length||!(c instanceof V)||!pe(t)?this.thru(s):(c=c.slice(t,+t+(e?1:0)),c.__actions__.push({func:T0,args:[s],thisArg:r}),new Uu(c,this.__chain__).thru(function(p){return e&&!p.length&&p.push(r),p}))});function Gl(){return Wc(this)}function Kl(){return new Uu(this.value(),this.__chain__)}function Yl(){this.__values__===r&&(this.__values__=nf(this.value()));var u=this.__index__>=this.__values__.length,e=u?r:this.__values__[this.__index__++];return{done:u,value:e}}function Jl(){return this}function Xl(u){for(var e,t=this;t instanceof b0;){var c=Oc(t);c.__index__=0,c.__values__=r,e?s.__wrapped__=c:e=c;var s=c;t=t.__wrapped__}return s.__wrapped__=u,e}function Vl(){var u=this.__wrapped__;if(u instanceof V){var e=u;return this.__actions__.length&&(e=new V(this)),e=e.reverse(),e.__actions__.push({func:T0,args:[tr],thisArg:r}),new Uu(e,this.__chain__)}return this.thru(tr)}function Ql(){return rc(this.__wrapped__,this.__actions__)}var jl=C0(function(u,e,t){eu.call(u,t)?++u[t]:le(u,t,1)});function u2(u,e,t){var c=H(u)?gi:Ha;return t&&vu(u,e,t)&&(e=r),c(u,z(e,3))}function e2(u,e){var t=H(u)?ke:Ui;return t(u,z(e,3))}var n2=bc(Mc),t2=bc(Pc);function r2(u,e){return mu(I0(u,e),1)}function i2(u,e){return mu(I0(u,e),Oe)}function c2(u,e,t){return t=t===r?1:Z(t),mu(I0(u,e),t)}function $c(u,e){var t=H(u)?qu:De;return t(u,z(e,3))}function Hc(u,e){var t=H(u)?D1:Ni;return t(u,z(e,3))}var f2=C0(function(u,e,t){eu.call(u,t)?u[t].push(e):le(u,t,[e])});function o2(u,e,t,c){u=yu(u)?u:fn(u),t=t&&!c?Z(t):0;var s=u.length;return t<0&&(t=hu(s+t,0)),M0(u)?t<=s&&u.indexOf(e,t)>-1:!!s&&Ye(u,e,t)>-1}var a2=Y(function(u,e,t){var c=-1,s=typeof e=="function",p=yu(u)?C(u.length):[];return De(u,function(_){p[++c]=s?Tu(e,_,t):Tn(_,e,t)}),p}),s2=C0(function(u,e,t){le(u,t,e)});function I0(u,e){var t=H(u)?fu:Ki;return t(u,z(e,3))}function l2(u,e,t,c){return u==null?[]:(H(e)||(e=e==null?[]:[e]),t=c?r:t,H(t)||(t=t==null?[]:[t]),Vi(u,e,t))}var d2=C0(function(u,e,t){u[t?0:1].push(e)},function(){return[[],[]]});function h2(u,e,t){var c=H(u)?_t:ki,s=arguments.length<3;return c(u,z(e,4),t,s,De)}function p2(u,e,t){var c=H(u)?y1:ki,s=arguments.length<3;return c(u,z(e,4),t,s,Ni)}function b2(u,e){var t=H(u)?ke:Ui;return t(u,B0(z(e,3)))}function _2(u){var e=H(u)?Mi:os;return e(u)}function g2(u,e,t){(t?vu(u,e,t):e===r)?e=1:e=Z(e);var c=H(u)?qa:as;return c(u,e)}function x2(u){var e=H(u)?Na:ls;return e(u)}function m2(u){if(u==null)return 0;if(yu(u))return M0(u)?Xe(u):u.length;var e=ku(u);return e==Ku||e==Yu?u.size:Ot(u).length}function A2(u,e,t){var c=H(u)?gt:ds;return t&&vu(u,e,t)&&(e=r),c(u,z(e,3))}var k2=Y(function(u,e){if(u==null)return[];var t=e.length;return t>1&&vu(u,e[0],e[1])?e=[]:t>2&&vu(e[0],e[1],e[2])&&(e=[e[0]]),Vi(u,mu(e,1),[])}),R0=ea||function(){return xu.Date.now()};function C2(u,e){if(typeof e!="function")throw new Nu(l);return u=Z(u),function(){if(--u<1)return e.apply(this,arguments)}}function Zc(u,e,t){return e=t?r:e,e=u&&e==null?u.length:e,de(u,nu,r,r,r,r,e)}function Gc(u,e){var t;if(typeof e!="function")throw new Nu(l);return u=Z(u),function(){return--u>0&&(t=e.apply(this,arguments)),u<=1&&(e=r),t}}var ir=Y(function(u,e,t){var c=q;if(t.length){var s=ve(t,rn(ir));c|=P}return de(u,c,e,t,s)}),Kc=Y(function(u,e,t){var c=q|J;if(t.length){var s=ve(t,rn(Kc));c|=P}return de(e,c,u,t,s)});function Yc(u,e,t){e=t?r:e;var c=de(u,B,r,r,r,r,r,e);return c.placeholder=Yc.placeholder,c}function Jc(u,e,t){e=t?r:e;var c=de(u,M,r,r,r,r,r,e);return c.placeholder=Jc.placeholder,c}function Xc(u,e,t){var c,s,p,_,x,A,y=0,F=!1,w=!1,I=!0;if(typeof u!="function")throw new Nu(l);e=Zu(e)||0,ou(t)&&(F=!!t.leading,w="maxWait"in t,p=w?hu(Zu(t.maxWait)||0,e):p,I="trailing"in t?!!t.trailing:I);function L(lu){var Qu=c,ge=s;return c=s=r,y=lu,_=u.apply(ge,Qu),_}function N(lu){return y=lu,x=On(X,e),F?L(lu):_}function G(lu){var Qu=lu-A,ge=lu-y,_f=e-Qu;return w?Au(_f,p-ge):_f}function U(lu){var Qu=lu-A,ge=lu-y;return A===r||Qu>=e||Qu<0||w&&ge>=p}function X(){var lu=R0();if(U(lu))return Q(lu);x=On(X,G(lu))}function Q(lu){return x=r,I&&c?L(lu):(c=s=r,_)}function Bu(){x!==r&&cc(x),y=0,c=A=s=x=r}function Eu(){return x===r?_:Q(R0())}function Ou(){var lu=R0(),Qu=U(lu);if(c=arguments,s=this,A=lu,Qu){if(x===r)return N(A);if(w)return cc(x),x=On(X,e),L(A)}return x===r&&(x=On(X,e)),_}return Ou.cancel=Bu,Ou.flush=Eu,Ou}var v2=Y(function(u,e){return qi(u,1,e)}),E2=Y(function(u,e,t){return qi(u,Zu(e)||0,t)});function D2(u){return de(u,Pu)}function L0(u,e){if(typeof u!="function"||e!=null&&typeof e!="function")throw new Nu(l);var t=function(){var c=arguments,s=e?e.apply(this,c):c[0],p=t.cache;if(p.has(s))return p.get(s);var _=u.apply(this,c);return t.cache=p.set(s,_)||p,_};return t.cache=new(L0.Cache||se),t}L0.Cache=se;function B0(u){if(typeof u!="function")throw new Nu(l);return function(){var e=arguments;switch(e.length){case 0:return!u.call(this);case 1:return!u.call(this,e[0]);case 2:return!u.call(this,e[0],e[1]);case 3:return!u.call(this,e[0],e[1],e[2])}return!u.apply(this,e)}}function y2(u){return Gc(2,u)}var F2=hs(function(u,e){e=e.length==1&&H(e[0])?fu(e[0],Iu(z())):fu(mu(e,1),Iu(z()));var t=e.length;return Y(function(c){for(var s=-1,p=Au(c.length,t);++s<p;)c[s]=e[s].call(this,c[s]);return Tu(u,this,c)})}),cr=Y(function(u,e){var t=ve(e,rn(cr));return de(u,P,r,e,t)}),Vc=Y(function(u,e){var t=ve(e,rn(Vc));return de(u,K,r,e,t)}),w2=he(function(u,e){return de(u,gu,r,r,r,e)});function S2(u,e){if(typeof u!="function")throw new Nu(l);return e=e===r?e:Z(e),Y(u,e)}function T2(u,e){if(typeof u!="function")throw new Nu(l);return e=e==null?0:hu(Z(e),0),Y(function(t){var c=t[e],s=we(t,0,e);return c&&Ce(s,c),Tu(u,this,s)})}function I2(u,e,t){var c=!0,s=!0;if(typeof u!="function")throw new Nu(l);return ou(t)&&(c="leading"in t?!!t.leading:c,s="trailing"in t?!!t.trailing:s),Xc(u,e,{leading:c,maxWait:e,trailing:s})}function R2(u){return Zc(u,1)}function L2(u,e){return cr(Ht(e),u)}function B2(){if(!arguments.length)return[];var u=arguments[0];return H(u)?u:[u]}function O2(u){return Wu(u,S)}function M2(u,e){return e=typeof e=="function"?e:r,Wu(u,S,e)}function P2(u){return Wu(u,v|S)}function z2(u,e){return e=typeof e=="function"?e:r,Wu(u,v|S,e)}function q2(u,e){return e==null||zi(u,e,pu(e))}function Vu(u,e){return u===e||u!==u&&e!==e}var N2=y0(Rt),U2=y0(function(u,e){return u>=e}),He=Hi((function(){return arguments})())?Hi:function(u){return au(u)&&eu.call(u,"callee")&&!Ti.call(u,"callee")},H=C.isArray,W2=li?Iu(li):Xa;function yu(u){return u!=null&&O0(u.length)&&!be(u)}function su(u){return au(u)&&yu(u)}function $2(u){return u===!0||u===!1||au(u)&&Cu(u)==bn}var Se=ta||gr,H2=di?Iu(di):Va;function Z2(u){return au(u)&&u.nodeType===1&&!Mn(u)}function G2(u){if(u==null)return!0;if(yu(u)&&(H(u)||typeof u=="string"||typeof u.splice=="function"||Se(u)||cn(u)||He(u)))return!u.length;var e=ku(u);if(e==Ku||e==Yu)return!u.size;if(Bn(u))return!Ot(u).length;for(var t in u)if(eu.call(u,t))return!1;return!0}function K2(u,e){return In(u,e)}function Y2(u,e,t){t=typeof t=="function"?t:r;var c=t?t(u,e):r;return c===r?In(u,e,r,t):!!c}function fr(u){if(!au(u))return!1;var e=Cu(u);return e==Kn||e==go||typeof u.message=="string"&&typeof u.name=="string"&&!Mn(u)}function J2(u){return typeof u=="number"&&Ri(u)}function be(u){if(!ou(u))return!1;var e=Cu(u);return e==Yn||e==qr||e==_o||e==mo}function Qc(u){return typeof u=="number"&&u==Z(u)}function O0(u){return typeof u=="number"&&u>-1&&u%1==0&&u<=Ae}function ou(u){var e=typeof u;return u!=null&&(e=="object"||e=="function")}function au(u){return u!=null&&typeof u=="object"}var jc=hi?Iu(hi):ja;function X2(u,e){return u===e||Bt(u,e,Vt(e))}function V2(u,e,t){return t=typeof t=="function"?t:r,Bt(u,e,Vt(e),t)}function Q2(u){return uf(u)&&u!=+u}function j2(u){if(Ms(u))throw new $(a);return Zi(u)}function ud(u){return u===null}function ed(u){return u==null}function uf(u){return typeof u=="number"||au(u)&&Cu(u)==gn}function Mn(u){if(!au(u)||Cu(u)!=oe)return!1;var e=o0(u);if(e===null)return!0;var t=eu.call(e,"constructor")&&e.constructor;return typeof t=="function"&&t instanceof t&&r0.call(t)==V1}var or=pi?Iu(pi):us;function nd(u){return Qc(u)&&u>=-Ae&&u<=Ae}var ef=bi?Iu(bi):es;function M0(u){return typeof u=="string"||!H(u)&&au(u)&&Cu(u)==mn}function Lu(u){return typeof u=="symbol"||au(u)&&Cu(u)==Jn}var cn=_i?Iu(_i):ns;function td(u){return u===r}function rd(u){return au(u)&&ku(u)==An}function id(u){return au(u)&&Cu(u)==ko}var cd=y0(Mt),fd=y0(function(u,e){return u<=e});function nf(u){if(!u)return[];if(yu(u))return M0(u)?Ju(u):Du(u);if(vn&&u[vn])return q1(u[vn]());var e=ku(u),t=e==Ku?vt:e==Yu?e0:fn;return t(u)}function _e(u){if(!u)return u===0?u:0;if(u=Zu(u),u===Oe||u===-Oe){var e=u<0?-1:1;return e*lo}return u===u?u:0}function Z(u){var e=_e(u),t=e%1;return e===e?t?e-t:e:0}function tf(u){return u?Ne(Z(u),0,ue):0}function Zu(u){if(typeof u=="number")return u;if(Lu(u))return Zn;if(ou(u)){var e=typeof u.valueOf=="function"?u.valueOf():u;u=ou(e)?e+"":e}if(typeof u!="string")return u===0?u:+u;u=Ci(u);var t=Wo.test(u);return t||Ho.test(u)?C1(u.slice(2),t?2:8):Uo.test(u)?Zn:+u}function rf(u){return ne(u,Fu(u))}function od(u){return u?Ne(Z(u),-Ae,Ae):u===0?u:0}function uu(u){return u==null?"":Ru(u)}var ad=nn(function(u,e){if(Bn(e)||yu(e)){ne(e,pu(e),u);return}for(var t in e)eu.call(e,t)&&wn(u,t,e[t])}),cf=nn(function(u,e){ne(e,Fu(e),u)}),P0=nn(function(u,e,t,c){ne(e,Fu(e),u,c)}),sd=nn(function(u,e,t,c){ne(e,pu(e),u,c)}),ld=he(St);function dd(u,e){var t=en(u);return e==null?t:Pi(t,e)}var hd=Y(function(u,e){u=tu(u);var t=-1,c=e.length,s=c>2?e[2]:r;for(s&&vu(e[0],e[1],s)&&(c=1);++t<c;)for(var p=e[t],_=Fu(p),x=-1,A=_.length;++x<A;){var y=_[x],F=u[y];(F===r||Vu(F,Qe[y])&&!eu.call(u,y))&&(u[y]=p[y])}return u}),pd=Y(function(u){return u.push(r,Cc),Tu(ff,r,u)});function bd(u,e){return xi(u,z(e,3),ee)}function _d(u,e){return xi(u,z(e,3),It)}function gd(u,e){return u==null?u:Tt(u,z(e,3),Fu)}function xd(u,e){return u==null?u:Wi(u,z(e,3),Fu)}function md(u,e){return u&&ee(u,z(e,3))}function Ad(u,e){return u&&It(u,z(e,3))}function kd(u){return u==null?[]:x0(u,pu(u))}function Cd(u){return u==null?[]:x0(u,Fu(u))}function ar(u,e,t){var c=u==null?r:Ue(u,e);return c===r?t:c}function vd(u,e){return u!=null&&Dc(u,e,Ga)}function sr(u,e){return u!=null&&Dc(u,e,Ka)}var Ed=gc(function(u,e,t){e!=null&&typeof e.toString!="function"&&(e=i0.call(e)),u[e]=t},dr(wu)),Dd=gc(function(u,e,t){e!=null&&typeof e.toString!="function"&&(e=i0.call(e)),eu.call(u,e)?u[e].push(t):u[e]=[t]},z),yd=Y(Tn);function pu(u){return yu(u)?Oi(u):Ot(u)}function Fu(u){return yu(u)?Oi(u,!0):ts(u)}function Fd(u,e){var t={};return e=z(e,3),ee(u,function(c,s,p){le(t,e(c,s,p),c)}),t}function wd(u,e){var t={};return e=z(e,3),ee(u,function(c,s,p){le(t,s,e(c,s,p))}),t}var Sd=nn(function(u,e,t){m0(u,e,t)}),ff=nn(function(u,e,t,c){m0(u,e,t,c)}),Td=he(function(u,e){var t={};if(u==null)return t;var c=!1;e=fu(e,function(p){return p=Fe(p,u),c||(c=p.length>1),p}),ne(u,Jt(u),t),c&&(t=Wu(t,v|T|S,Es));for(var s=e.length;s--;)Ut(t,e[s]);return t});function Id(u,e){return of(u,B0(z(e)))}var Rd=he(function(u,e){return u==null?{}:is(u,e)});function of(u,e){if(u==null)return{};var t=fu(Jt(u),function(c){return[c]});return e=z(e),Qi(u,t,function(c,s){return e(c,s[0])})}function Ld(u,e,t){e=Fe(e,u);var c=-1,s=e.length;for(s||(s=1,u=r);++c<s;){var p=u==null?r:u[te(e[c])];p===r&&(c=s,p=t),u=be(p)?p.call(u):p}return u}function Bd(u,e,t){return u==null?u:Rn(u,e,t)}function Od(u,e,t,c){return c=typeof c=="function"?c:r,u==null?u:Rn(u,e,t,c)}var af=Ac(pu),sf=Ac(Fu);function Md(u,e,t){var c=H(u),s=c||Se(u)||cn(u);if(e=z(e,4),t==null){var p=u&&u.constructor;s?t=c?new p:[]:ou(u)?t=be(p)?en(o0(u)):{}:t={}}return(s?qu:ee)(u,function(_,x,A){return e(t,_,x,A)}),t}function Pd(u,e){return u==null?!0:Ut(u,e)}function zd(u,e,t){return u==null?u:tc(u,e,Ht(t))}function qd(u,e,t,c){return c=typeof c=="function"?c:r,u==null?u:tc(u,e,Ht(t),c)}function fn(u){return u==null?[]:Ct(u,pu(u))}function Nd(u){return u==null?[]:Ct(u,Fu(u))}function Ud(u,e,t){return t===r&&(t=e,e=r),t!==r&&(t=Zu(t),t=t===t?t:0),e!==r&&(e=Zu(e),e=e===e?e:0),Ne(Zu(u),e,t)}function Wd(u,e,t){return e=_e(e),t===r?(t=e,e=0):t=_e(t),u=Zu(u),Ya(u,e,t)}function $d(u,e,t){if(t&&typeof t!="boolean"&&vu(u,e,t)&&(e=t=r),t===r&&(typeof e=="boolean"?(t=e,e=r):typeof u=="boolean"&&(t=u,u=r)),u===r&&e===r?(u=0,e=1):(u=_e(u),e===r?(e=u,u=0):e=_e(e)),u>e){var c=u;u=e,e=c}if(t||u%1||e%1){var s=Li();return Au(u+s*(e-u+k1("1e-"+((s+"").length-1))),e)}return zt(u,e)}var Hd=tn(function(u,e,t){return e=e.toLowerCase(),u+(t?lf(e):e)});function lf(u){return lr(uu(u).toLowerCase())}function df(u){return u=uu(u),u&&u.replace(Go,B1).replace(l1,"")}function Zd(u,e,t){u=uu(u),e=Ru(e);var c=u.length;t=t===r?c:Ne(Z(t),0,c);var s=t;return t-=e.length,t>=0&&u.slice(t,s)==e}function Gd(u){return u=uu(u),u&&yo.test(u)?u.replace(Wr,O1):u}function Kd(u){return u=uu(u),u&&Ro.test(u)?u.replace(ct,"\\$&"):u}var Yd=tn(function(u,e,t){return u+(t?"-":"")+e.toLowerCase()}),Jd=tn(function(u,e,t){return u+(t?" ":"")+e.toLowerCase()}),Xd=pc("toLowerCase");function Vd(u,e,t){u=uu(u),e=Z(e);var c=e?Xe(u):0;if(!e||c>=e)return u;var s=(e-c)/2;return D0(d0(s),t)+u+D0(l0(s),t)}function Qd(u,e,t){u=uu(u),e=Z(e);var c=e?Xe(u):0;return e&&c<e?u+D0(e-c,t):u}function jd(u,e,t){u=uu(u),e=Z(e);var c=e?Xe(u):0;return e&&c<e?D0(e-c,t)+u:u}function uh(u,e,t){return t||e==null?e=0:e&&(e=+e),fa(uu(u).replace(ft,""),e||0)}function eh(u,e,t){return(t?vu(u,e,t):e===r)?e=1:e=Z(e),qt(uu(u),e)}function nh(){var u=arguments,e=uu(u[0]);return u.length<3?e:e.replace(u[1],u[2])}var th=tn(function(u,e,t){return u+(t?"_":"")+e.toLowerCase()});function rh(u,e,t){return t&&typeof t!="number"&&vu(u,e,t)&&(e=t=r),t=t===r?ue:t>>>0,t?(u=uu(u),u&&(typeof e=="string"||e!=null&&!or(e))&&(e=Ru(e),!e&&Je(u))?we(Ju(u),0,t):u.split(e,t)):[]}var ih=tn(function(u,e,t){return u+(t?" ":"")+lr(e)});function ch(u,e,t){return u=uu(u),t=t==null?0:Ne(Z(t),0,u.length),e=Ru(e),u.slice(t,t+e.length)==e}function fh(u,e,t){var c=d.templateSettings;t&&vu(u,e,t)&&(e=r),u=uu(u),e=P0({},e,c,kc);var s=P0({},e.imports,c.imports,kc),p=pu(s),_=Ct(s,p),x,A,y=0,F=e.interpolate||Xn,w="__p += '",I=Et((e.escape||Xn).source+"|"+F.source+"|"+(F===$r?No:Xn).source+"|"+(e.evaluate||Xn).source+"|$","g"),L="//# sourceURL="+(eu.call(e,"sourceURL")?(e.sourceURL+"").replace(/\s/g," "):"lodash.templateSources["+ ++_1+"]")+`
`;u.replace(I,function(U,X,Q,Bu,Eu,Ou){return Q||(Q=Bu),w+=u.slice(y,Ou).replace(Ko,M1),X&&(x=!0,w+=`' +
__e(`+X+`) +
'`),Eu&&(A=!0,w+=`';
`+Eu+`;
__p += '`),Q&&(w+=`' +
((__t = (`+Q+`)) == null ? '' : __t) +
'`),y=Ou+U.length,U}),w+=`';
`;var N=eu.call(e,"variable")&&e.variable;if(!N)w=`with (obj) {
`+w+`
}
`;else if(zo.test(N))throw new $(h);w=(A?w.replace(Co,""):w).replace(vo,"$1").replace(Eo,"$1;"),w="function("+(N||"obj")+`) {
`+(N?"":`obj || (obj = {});
`)+"var __t, __p = ''"+(x?", __e = _.escape":"")+(A?`, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
`:`;
`)+w+`return __p
}`;var G=pf(function(){return j(p,L+"return "+w).apply(r,_)});if(G.source=w,fr(G))throw G;return G}function oh(u){return uu(u).toLowerCase()}function ah(u){return uu(u).toUpperCase()}function sh(u,e,t){if(u=uu(u),u&&(t||e===r))return Ci(u);if(!u||!(e=Ru(e)))return u;var c=Ju(u),s=Ju(e),p=vi(c,s),_=Ei(c,s)+1;return we(c,p,_).join("")}function lh(u,e,t){if(u=uu(u),u&&(t||e===r))return u.slice(0,yi(u)+1);if(!u||!(e=Ru(e)))return u;var c=Ju(u),s=Ei(c,Ju(e))+1;return we(c,0,s).join("")}function dh(u,e,t){if(u=uu(u),u&&(t||e===r))return u.replace(ft,"");if(!u||!(e=Ru(e)))return u;var c=Ju(u),s=vi(c,Ju(e));return we(c,s).join("")}function hh(u,e){var t=Be,c=hn;if(ou(e)){var s="separator"in e?e.separator:s;t="length"in e?Z(e.length):t,c="omission"in e?Ru(e.omission):c}u=uu(u);var p=u.length;if(Je(u)){var _=Ju(u);p=_.length}if(t>=p)return u;var x=t-Xe(c);if(x<1)return c;var A=_?we(_,0,x).join(""):u.slice(0,x);if(s===r)return A+c;if(_&&(x+=A.length-x),or(s)){if(u.slice(x).search(s)){var y,F=A;for(s.global||(s=Et(s.source,uu(Hr.exec(s))+"g")),s.lastIndex=0;y=s.exec(F);)var w=y.index;A=A.slice(0,w===r?x:w)}}else if(u.indexOf(Ru(s),x)!=x){var I=A.lastIndexOf(s);I>-1&&(A=A.slice(0,I))}return A+c}function ph(u){return u=uu(u),u&&Do.test(u)?u.replace(Ur,$1):u}var bh=tn(function(u,e,t){return u+(t?" ":"")+e.toUpperCase()}),lr=pc("toUpperCase");function hf(u,e,t){return u=uu(u),e=t?r:e,e===r?z1(u)?G1(u):S1(u):u.match(e)||[]}var pf=Y(function(u,e){try{return Tu(u,r,e)}catch(t){return fr(t)?t:new $(t)}}),_h=he(function(u,e){return qu(e,function(t){t=te(t),le(u,t,ir(u[t],u))}),u});function gh(u){var e=u==null?0:u.length,t=z();return u=e?fu(u,function(c){if(typeof c[1]!="function")throw new Nu(l);return[t(c[0]),c[1]]}):[],Y(function(c){for(var s=-1;++s<e;){var p=u[s];if(Tu(p[0],this,c))return Tu(p[1],this,c)}})}function xh(u){return $a(Wu(u,v))}function dr(u){return function(){return u}}function mh(u,e){return u==null||u!==u?e:u}var Ah=_c(),kh=_c(!0);function wu(u){return u}function hr(u){return Gi(typeof u=="function"?u:Wu(u,v))}function Ch(u){return Yi(Wu(u,v))}function vh(u,e){return Ji(u,Wu(e,v))}var Eh=Y(function(u,e){return function(t){return Tn(t,u,e)}}),Dh=Y(function(u,e){return function(t){return Tn(u,t,e)}});function pr(u,e,t){var c=pu(e),s=x0(e,c);t==null&&!(ou(e)&&(s.length||!c.length))&&(t=e,e=u,u=this,s=x0(e,pu(e)));var p=!(ou(t)&&"chain"in t)||!!t.chain,_=be(u);return qu(s,function(x){var A=e[x];u[x]=A,_&&(u.prototype[x]=function(){var y=this.__chain__;if(p||y){var F=u(this.__wrapped__),w=F.__actions__=Du(this.__actions__);return w.push({func:A,args:arguments,thisArg:u}),F.__chain__=y,F}return A.apply(u,Ce([this.value()],arguments))})}),u}function yh(){return xu._===this&&(xu._=Q1),this}function br(){}function Fh(u){return u=Z(u),Y(function(e){return Xi(e,u)})}var wh=Gt(fu),Sh=Gt(gi),Th=Gt(gt);function bf(u){return jt(u)?xt(te(u)):cs(u)}function Ih(u){return function(e){return u==null?r:Ue(u,e)}}var Rh=xc(),Lh=xc(!0);function _r(){return[]}function gr(){return!1}function Bh(){return{}}function Oh(){return""}function Mh(){return!0}function Ph(u,e){if(u=Z(u),u<1||u>Ae)return[];var t=ue,c=Au(u,ue);e=z(e),u-=ue;for(var s=kt(c,e);++t<u;)e(t);return s}function zh(u){return H(u)?fu(u,te):Lu(u)?[u]:Du(Bc(uu(u)))}function qh(u){var e=++X1;return uu(u)+e}var Nh=E0(function(u,e){return u+e},0),Uh=Kt("ceil"),Wh=E0(function(u,e){return u/e},1),$h=Kt("floor");function Hh(u){return u&&u.length?g0(u,wu,Rt):r}function Zh(u,e){return u&&u.length?g0(u,z(e,2),Rt):r}function Gh(u){return Ai(u,wu)}function Kh(u,e){return Ai(u,z(e,2))}function Yh(u){return u&&u.length?g0(u,wu,Mt):r}function Jh(u,e){return u&&u.length?g0(u,z(e,2),Mt):r}var Xh=E0(function(u,e){return u*e},1),Vh=Kt("round"),Qh=E0(function(u,e){return u-e},0);function jh(u){return u&&u.length?At(u,wu):0}function u3(u,e){return u&&u.length?At(u,z(e,2)):0}return d.after=C2,d.ary=Zc,d.assign=ad,d.assignIn=cf,d.assignInWith=P0,d.assignWith=sd,d.at=ld,d.before=Gc,d.bind=ir,d.bindAll=_h,d.bindKey=Kc,d.castArray=B2,d.chain=Wc,d.chunk=$s,d.compact=Hs,d.concat=Zs,d.cond=gh,d.conforms=xh,d.constant=dr,d.countBy=jl,d.create=dd,d.curry=Yc,d.curryRight=Jc,d.debounce=Xc,d.defaults=hd,d.defaultsDeep=pd,d.defer=v2,d.delay=E2,d.difference=Gs,d.differenceBy=Ks,d.differenceWith=Ys,d.drop=Js,d.dropRight=Xs,d.dropRightWhile=Vs,d.dropWhile=Qs,d.fill=js,d.filter=e2,d.flatMap=r2,d.flatMapDeep=i2,d.flatMapDepth=c2,d.flatten=zc,d.flattenDeep=ul,d.flattenDepth=el,d.flip=D2,d.flow=Ah,d.flowRight=kh,d.fromPairs=nl,d.functions=kd,d.functionsIn=Cd,d.groupBy=f2,d.initial=rl,d.intersection=il,d.intersectionBy=cl,d.intersectionWith=fl,d.invert=Ed,d.invertBy=Dd,d.invokeMap=a2,d.iteratee=hr,d.keyBy=s2,d.keys=pu,d.keysIn=Fu,d.map=I0,d.mapKeys=Fd,d.mapValues=wd,d.matches=Ch,d.matchesProperty=vh,d.memoize=L0,d.merge=Sd,d.mergeWith=ff,d.method=Eh,d.methodOf=Dh,d.mixin=pr,d.negate=B0,d.nthArg=Fh,d.omit=Td,d.omitBy=Id,d.once=y2,d.orderBy=l2,d.over=wh,d.overArgs=F2,d.overEvery=Sh,d.overSome=Th,d.partial=cr,d.partialRight=Vc,d.partition=d2,d.pick=Rd,d.pickBy=of,d.property=bf,d.propertyOf=Ih,d.pull=ll,d.pullAll=Nc,d.pullAllBy=dl,d.pullAllWith=hl,d.pullAt=pl,d.range=Rh,d.rangeRight=Lh,d.rearg=w2,d.reject=b2,d.remove=bl,d.rest=S2,d.reverse=tr,d.sampleSize=g2,d.set=Bd,d.setWith=Od,d.shuffle=x2,d.slice=_l,d.sortBy=k2,d.sortedUniq=vl,d.sortedUniqBy=El,d.split=rh,d.spread=T2,d.tail=Dl,d.take=yl,d.takeRight=Fl,d.takeRightWhile=wl,d.takeWhile=Sl,d.tap=Hl,d.throttle=I2,d.thru=T0,d.toArray=nf,d.toPairs=af,d.toPairsIn=sf,d.toPath=zh,d.toPlainObject=rf,d.transform=Md,d.unary=R2,d.union=Tl,d.unionBy=Il,d.unionWith=Rl,d.uniq=Ll,d.uniqBy=Bl,d.uniqWith=Ol,d.unset=Pd,d.unzip=rr,d.unzipWith=Uc,d.update=zd,d.updateWith=qd,d.values=fn,d.valuesIn=Nd,d.without=Ml,d.words=hf,d.wrap=L2,d.xor=Pl,d.xorBy=zl,d.xorWith=ql,d.zip=Nl,d.zipObject=Ul,d.zipObjectDeep=Wl,d.zipWith=$l,d.entries=af,d.entriesIn=sf,d.extend=cf,d.extendWith=P0,pr(d,d),d.add=Nh,d.attempt=pf,d.camelCase=Hd,d.capitalize=lf,d.ceil=Uh,d.clamp=Ud,d.clone=O2,d.cloneDeep=P2,d.cloneDeepWith=z2,d.cloneWith=M2,d.conformsTo=q2,d.deburr=df,d.defaultTo=mh,d.divide=Wh,d.endsWith=Zd,d.eq=Vu,d.escape=Gd,d.escapeRegExp=Kd,d.every=u2,d.find=n2,d.findIndex=Mc,d.findKey=bd,d.findLast=t2,d.findLastIndex=Pc,d.findLastKey=_d,d.floor=$h,d.forEach=$c,d.forEachRight=Hc,d.forIn=gd,d.forInRight=xd,d.forOwn=md,d.forOwnRight=Ad,d.get=ar,d.gt=N2,d.gte=U2,d.has=vd,d.hasIn=sr,d.head=qc,d.identity=wu,d.includes=o2,d.indexOf=tl,d.inRange=Wd,d.invoke=yd,d.isArguments=He,d.isArray=H,d.isArrayBuffer=W2,d.isArrayLike=yu,d.isArrayLikeObject=su,d.isBoolean=$2,d.isBuffer=Se,d.isDate=H2,d.isElement=Z2,d.isEmpty=G2,d.isEqual=K2,d.isEqualWith=Y2,d.isError=fr,d.isFinite=J2,d.isFunction=be,d.isInteger=Qc,d.isLength=O0,d.isMap=jc,d.isMatch=X2,d.isMatchWith=V2,d.isNaN=Q2,d.isNative=j2,d.isNil=ed,d.isNull=ud,d.isNumber=uf,d.isObject=ou,d.isObjectLike=au,d.isPlainObject=Mn,d.isRegExp=or,d.isSafeInteger=nd,d.isSet=ef,d.isString=M0,d.isSymbol=Lu,d.isTypedArray=cn,d.isUndefined=td,d.isWeakMap=rd,d.isWeakSet=id,d.join=ol,d.kebabCase=Yd,d.last=Hu,d.lastIndexOf=al,d.lowerCase=Jd,d.lowerFirst=Xd,d.lt=cd,d.lte=fd,d.max=Hh,d.maxBy=Zh,d.mean=Gh,d.meanBy=Kh,d.min=Yh,d.minBy=Jh,d.stubArray=_r,d.stubFalse=gr,d.stubObject=Bh,d.stubString=Oh,d.stubTrue=Mh,d.multiply=Xh,d.nth=sl,d.noConflict=yh,d.noop=br,d.now=R0,d.pad=Vd,d.padEnd=Qd,d.padStart=jd,d.parseInt=uh,d.random=$d,d.reduce=h2,d.reduceRight=p2,d.repeat=eh,d.replace=nh,d.result=Ld,d.round=Vh,d.runInContext=m,d.sample=_2,d.size=m2,d.snakeCase=th,d.some=A2,d.sortedIndex=gl,d.sortedIndexBy=xl,d.sortedIndexOf=ml,d.sortedLastIndex=Al,d.sortedLastIndexBy=kl,d.sortedLastIndexOf=Cl,d.startCase=ih,d.startsWith=ch,d.subtract=Qh,d.sum=jh,d.sumBy=u3,d.template=fh,d.times=Ph,d.toFinite=_e,d.toInteger=Z,d.toLength=tf,d.toLower=oh,d.toNumber=Zu,d.toSafeInteger=od,d.toString=uu,d.toUpper=ah,d.trim=sh,d.trimEnd=lh,d.trimStart=dh,d.truncate=hh,d.unescape=ph,d.uniqueId=qh,d.upperCase=bh,d.upperFirst=lr,d.each=$c,d.eachRight=Hc,d.first=qc,pr(d,(function(){var u={};return ee(d,function(e,t){eu.call(d.prototype,t)||(u[t]=e)}),u})(),{chain:!1}),d.VERSION=f,qu(["bind","bindKey","curry","curryRight","partial","partialRight"],function(u){d[u].placeholder=d}),qu(["drop","take"],function(u,e){V.prototype[u]=function(t){t=t===r?1:hu(Z(t),0);var c=this.__filtered__&&!e?new V(this):this.clone();return c.__filtered__?c.__takeCount__=Au(t,c.__takeCount__):c.__views__.push({size:Au(t,ue),type:u+(c.__dir__<0?"Right":"")}),c},V.prototype[u+"Right"]=function(t){return this.reverse()[u](t).reverse()}}),qu(["filter","map","takeWhile"],function(u,e){var t=e+1,c=t==pn||t==X0;V.prototype[u]=function(s){var p=this.clone();return p.__iteratees__.push({iteratee:z(s,3),type:t}),p.__filtered__=p.__filtered__||c,p}}),qu(["head","last"],function(u,e){var t="take"+(e?"Right":"");V.prototype[u]=function(){return this[t](1).value()[0]}}),qu(["initial","tail"],function(u,e){var t="drop"+(e?"":"Right");V.prototype[u]=function(){return this.__filtered__?new V(this):this[t](1)}}),V.prototype.compact=function(){return this.filter(wu)},V.prototype.find=function(u){return this.filter(u).head()},V.prototype.findLast=function(u){return this.reverse().find(u)},V.prototype.invokeMap=Y(function(u,e){return typeof u=="function"?new V(this):this.map(function(t){return Tn(t,u,e)})}),V.prototype.reject=function(u){return this.filter(B0(z(u)))},V.prototype.slice=function(u,e){u=Z(u);var t=this;return t.__filtered__&&(u>0||e<0)?new V(t):(u<0?t=t.takeRight(-u):u&&(t=t.drop(u)),e!==r&&(e=Z(e),t=e<0?t.dropRight(-e):t.take(e-u)),t)},V.prototype.takeRightWhile=function(u){return this.reverse().takeWhile(u).reverse()},V.prototype.toArray=function(){return this.take(ue)},ee(V.prototype,function(u,e){var t=/^(?:filter|find|map|reject)|While$/.test(e),c=/^(?:head|last)$/.test(e),s=d[c?"take"+(e=="last"?"Right":""):e],p=c||/^find/.test(e);s&&(d.prototype[e]=function(){var _=this.__wrapped__,x=c?[1]:arguments,A=_ instanceof V,y=x[0],F=A||H(_),w=function(X){var Q=s.apply(d,Ce([X],x));return c&&I?Q[0]:Q};F&&t&&typeof y=="function"&&y.length!=1&&(A=F=!1);var I=this.__chain__,L=!!this.__actions__.length,N=p&&!I,G=A&&!L;if(!p&&F){_=G?_:new V(this);var U=u.apply(_,x);return U.__actions__.push({func:T0,args:[w],thisArg:r}),new Uu(U,I)}return N&&G?u.apply(this,x):(U=this.thru(w),N?c?U.value()[0]:U.value():U)})}),qu(["pop","push","shift","sort","splice","unshift"],function(u){var e=n0[u],t=/^(?:push|sort|unshift)$/.test(u)?"tap":"thru",c=/^(?:pop|shift)$/.test(u);d.prototype[u]=function(){var s=arguments;if(c&&!this.__chain__){var p=this.value();return e.apply(H(p)?p:[],s)}return this[t](function(_){return e.apply(H(_)?_:[],s)})}}),ee(V.prototype,function(u,e){var t=d[e];if(t){var c=t.name+"";eu.call(un,c)||(un[c]=[]),un[c].push({name:e,func:t})}}),un[v0(r,J).name]=[{name:"wrapper",func:r}],V.prototype.clone=pa,V.prototype.reverse=ba,V.prototype.value=_a,d.prototype.at=Zl,d.prototype.chain=Gl,d.prototype.commit=Kl,d.prototype.next=Yl,d.prototype.plant=Xl,d.prototype.reverse=Vl,d.prototype.toJSON=d.prototype.valueOf=d.prototype.value=Ql,d.prototype.first=d.prototype.head,vn&&(d.prototype[vn]=Jl),d}),Ve=K1();Me?((Me.exports=Ve)._=Ve,ht._=Ve):xu._=Ve}).call(Zp)})(Pn,Pn.exports)),Pn.exports}var Kp=Gp();const Tr=(n,i,r,f,o=[],a)=>{Object.prototype.toString.call(n)==="[object Array]"&&n.forEach((l,h,b)=>{Object.prototype.toString.call(i)==="[object Function]"&&i.call(f,l,h,o,b,`${a?`${a}-`:""}${h}`);const g=Object.prototype.toString.call(l)==="[object Object]"?Kp.get(l,"children",[]):[];Tr(g,i,r,f,o.concat(l),`${a?`${a}-`:""}${h}`)})};function Yp(n){const i={level:0,children:[]},r=[i];let f=null;const o={h1:1,h2:2,h3:3,h4:4,h5:5,h6:6};for(let a=0;a<n.length;a++){const l=n[a];if(l.type==="heading_open"){const b=o[l.tag];f=mr(xr({},l),{type:"heading",level:b,content:"",children:[]});continue}if(l.type==="inline"&&f){f.content=l.content;continue}if(l.type==="heading_close"&&f){const b=f.level;for(;r.length&&r[r.length-1].level>=b;)r.pop();r[r.length-1].children.push(f),r.push(f),f=null;continue}r[r.length-1].children.push(l)}return i.children}function zf(n){const r=Gu().parse(n,{}),f=Yp(r),o=[];return Tr(f,(l,h,b,g,E)=>{o.push({title:l.content,value:((v,T="")=>(Tr(v,S=>{T+=`${S.content||""}
`}),T))(l.children||[])})}),o.filter(l=>l.value)}const Jp={"--mdTitle":{message:"解析md大纲",callback(i){return xe(this,arguments,function*({parames:n}){const r=yield qf(n),f=zf(r);console.log(f.map(o=>o.title).join(`
`))})}},"--md":{message:"解析Md",callback(i){return xe(this,arguments,function*({parames:n}){const r=yield qf(n),o=zf(r).find(a=>n[0]===a.title);console.log(o==null?void 0:o.value)})}}},qf=(...i)=>xe(null,[...i],function*(n=[]){return process.stdin.isTTY?n.join(""):new Promise((r,f)=>{process.stdin.setEncoding("utf8");let o="";process.stdin.on("data",a=>{o+=a}),process.stdin.on("end",()=>xe(null,null,function*(){r(o||n.join(""))})),process.stdin.on("err",a=>xe(null,null,function*(){f(a)}))})});(function n(o,a){return xe(this,arguments,function*([i,...r],f){const l={message:"查看帮助",callback({help:v}){v()}};f=mr(xr({},f),{"--help":l,"-h":l});const h=Object.keys(f).map(v=>v.trim()),b=h.find(v=>v===i),g=f[b],E=(v=!1)=>xe(null,null,function*(){if(!(!v&&g)){const T=h.reduce((k,W)=>k>W.length?k:W.length,0),S=[[],[]];h.map(k=>{var J,O;if(["message","callback"].includes(k))return;const W=(O=(J=f[k])==null?void 0:J.message)!=null?O:"",q=`${k.padEnd(T," ")}${"----".padStart(10," ").padEnd(14," ")}${W}`.trim();k.trim().startsWith("-")?S[1].push(q):S[0].push(q)}),console.log(`
        命令帮助
        ${S[0].length>0?"Command:":""}
          ${S[0].map(k=>`\\n${k}`).join(`
`)}
        ${S[1].length>0?"Options:":""}
          ${S[1].map(k=>`\\n${k}`).join(`
`)}
      `.split(`
`).filter(k=>!!k.trim()).map(k=>k.trim().replace(/^\\n(?=\s*)/,"  ")).join(`
`))}});if(g){const v=typeof g=="function"?g:typeof(g==null?void 0:g.callback)=="function"?g==null?void 0:g.callback:null;return v?yield v({parames:r,help:()=>xe(null,null,function*(){yield E(!0)})}):typeof g=="object"?yield n(r,g||{}):yield E()}else return yield E()})})(process.argv.slice(2),Jp);
```

tool.sh

```sh
#!/bin/bash

# 下载 blog.md（如果不存在）
aPath="./a.js"
mdPath="./blog.md"

curl -o $mdPath "$1"

title=$(cat $mdPath | node $aPath --mdTitle | fzf --preview "cat $mdPath | node $aPath --md {}")

echo $title

mdValue=$(cat $mdPath | node $aPath --md "$title")

echo "$mdValue"

success(){
    echo "✅ 内容已复制到剪切板"
}

# 复制到剪贴板（跨平台）
if command -v pbcopy >/dev/null; then
  echo "$mdValue" | pbcopy
  success
elif command -v xclip >/dev/null; then
  echo "$mdValue" | xclip -selection clipboard
  success
elif command -v xsel >/dev/null; then
  echo "$mdValue" | xsel --clipboard
  success
elif command -v clip >/dev/null; then
  echo "$mdValue" | clip
  success
else
  echo "⚠️ 未检测到剪贴板工具"
fi
```

## go 打包部署一条命令

```sh
# 不备份
APP=/opt/app/bin/server/golang/smy/smy && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o smy . && ssh yonglai "rm -f $APP" && scp smy root@yonglai:$APP && ssh yonglai "supervisorctl restart smy"

# 备份
APP=/opt/app/bin/server/golang/smy/smy && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o smy . && scp smy root@yonglai:/tmp/smy && ssh root@yonglai "cp $APP ${APP}.\$(date +%Y%m%d%H%M%S).bak && install -m 755 /tmp/smy $APP && supervisorctl restart smy"
```



### go gin 基础框架实现

```go
// 声明当前包名为svg
package svg

import (
	// 标准库日志包，用于打印日志信息
	"log"
	// 标准库系统操作包，用于操作标准输出等系统资源
	"os"
	// 标准库时间包，用于处理时间相关逻辑
	"time"

	// 标准库数据库/sql包，提供通用数据库操作接口
	"database/sql"

	// Gin Web框架，用于构建HTTP服务
	"github.com/gin-gonic/gin"
	// MySQL数据库驱动，注册后供database/sql包使用（仅初始化不直接调用）
	_ "github.com/go-sql-driver/mysql"
	// GORM的MySQL数据库驱动，用于连接GORM与MySQL
	gormmysql "gorm.io/driver/mysql"
	// GORM核心包，提供ORM操作能力
	"gorm.io/gorm"
	// GORM日志模块，用于配置数据库操作日志
	gormlogger "gorm.io/gorm/logger"
)

// Test 数据模型，对应数据库中的tests表（GORM默认会将结构体名转为复数表名）
type Test struct {
	// ID字段，为主键，自增
	ID   uint   `gorm:"primaryKey"`
	// Name字段，数据库列名为name，默认值为"121"；同时支持JSON序列化、参数绑定、校验、表单和查询参数绑定
	Name string `gorm:"column:name;default:121" json:"name" binding:"required" validate:"required" form:"name" query:"name"`
}

// AllModels 返回所有需要数据库迁移的模型列表，供AutoMigrate使用
func AllModels() []any {
	return []any{
		&Test{},
	}
}

// New 初始化并启动整个服务，包括数据库连接、GORM配置、Gin服务启动
func New() {
	// 数据库连接字符串（DNS），包含用户名、密码、数据库地址、端口、数据库名及连接参数
	dns := "root:rootroot@tcp(127.0.0.1:3306)/smy?charset=utf8mb4&parseTime=True&loc=Local"
	// 使用database/sql包创建MySQL连接池
	dialector, err := sql.Open("mysql", dns)
	if err != nil {
		// 连接失败直接抛出 panic 终止程序
		panic(err)
	}
	// 函数结束前关闭数据库连接（这段代码实际未生效，因为后续gorm会接管连接，此处存在代码冗余）
	defer dialector.Close()
	// 使用GORM的MySQL驱动创建连接实例
	dialector2 := gormmysql.Open(dns)
	// 初始化GORM实例，配置日志参数
	db, err := gorm.Open(dialector2, &gorm.Config{
		// 配置GORM日志记录器
		Logger: gormlogger.New(
			// 创建标准输出日志实例，带时间戳
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			// 日志配置项
			gormlogger.Config{
				SlowThreshold:             time.Second, // 慢查询阈值，超过1秒的查询会被记录为慢查询
				LogLevel:                  gormlogger.Info, // 日志级别为Info，记录所有Info及以上级别的日志
				IgnoreRecordNotFoundError: false, // 不忽略记录未找到的错误，会打印相关日志
				Colorful:                  false, // 日志不输出彩色字符
			},
		),
	})
	if err != nil {
		// GORM初始化失败直接panic
		panic(err)
	}
	// 自动迁移数据库，会自动创建/更新模型对应的数据库表结构
	db.AutoMigrate(AllModels()...)
	// 创建Gin引擎实例
	r := gin.New()
	// 注册Recovery中间件，捕获panic避免程序崩溃
	r.Use(gin.Recovery())
	// 注册Logger中间件，记录HTTP请求日志
	r.Use(gin.Logger())
	// 注册GET路由/test，处理函数
	r.GET("/test", func(c *gin.Context) {
		// 创建一条空的Test记录插入数据库
		db.Create(&Test{})
		// 定义切片用于存储查询结果
		var tests []Test
		// 查询ID为1或2的所有Test记录
		err := db.Model(&Test{}).Where("id IN ?", []uint{1, 2}).Find(&tests).Error
		if err != nil {
			// 查询失败panic
			panic(err)
		}
		// 返回JSON响应，包含消息和查询到的数据
		c.JSON(200, gin.H{
			"message": "sdasd",
			"data":    tests,
		})
	})
	// 启动Gin服务，监听8080端口
	r.Run(":8080")
}


```

### electron 静态资源提取

资源目录：`appRootDir/resources`

```sh
# 提取代码
asar extract app.asar output
# 合成app.asar包
asar pack output app.asar
```

### go debug 热更新

```sh
ls **/*.go | entr -r zsh -c ' noglob rm -f __debug_** && lsof -ti:8888 | xargs -r kill -9 && lsof -ti:2345 | xargs -r kill -9 &&  air'
```

.air.toml

```json
{
  "name": "Go Hot Debug",
  "type": "go",
  "request": "attach",
  "mode": "remote",
  "remotePath": "${workspaceFolder}",
  "port": 2345,
  "host": "127.0.0.1"
}
```

```toml
#:schema https://json.schemastore.org/any.json

env_files = []
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  bin = "./tmp/main"
  cmd = "SERVER_ADDRESS=':8888' dlv debug . --headless --listen=127.0.0.1:2345 --api-version=2 --accept-multiclient"
  
  delay = 1000
  send_interrupt = true
  kill_delay = "500ms"

  exclude_dir = [
    "assets",
    "tmp",
    "vendor",
    "testdata"
  ]

  include_ext = [
    "go",
    "tpl",
    "tmpl",
    "html"
  ]

  stop_on_error = true

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  mode = ""
  runner = "green"
  watcher = "cyan"

[log]
  main_only = false
  silent = false
  time = false

[misc]
  clean_on_exit = false

[proxy]
  app_port = 0
  app_start_timeout = 0
  enabled = false
  proxy_port = 0

[screen]
  clear_on_rebuild = false
  keep_scroll = true

```

## vite库模式混淆打包

```ts
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import obfuscator from "vite-plugin-javascript-obfuscator";

function stripPresetBundledTypes(content: string) {
  const extraDeclarationsStart = content.search(/\nexport\s*\{\s*\}\s*\n/);

  if (extraDeclarationsStart === -1) {
    return content;
  }

  return `${content.slice(0, extraDeclarationsStart).trimEnd()}\n`;
}

export default defineConfig({
  plugins: [
    dts({
      outDirs: "dist/types",
      exclude: ["vite.config.ts"],
      bundleTypes: true,
      insertTypesEntry: true,
      beforeWriteFile: (filePath, content) => {
        if (filePath.includes("preset.d.ts")) {
          return {
            content: stripPresetBundledTypes(content),
            filePath,
          };
        }
      },
    }),
    obfuscator({
      options: {
        controlFlowFlattening: true,
        stringArrayThreshold: 1,
        unicodeEscapeSequence: true,
        stringArrayEncoding: ["none", "base64", "rc4"],
        forceTransformStrings: ["."],
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 1,
        numbersToExpressions: true,
        renameGlobals: true,
        splitStrings: true,
        stringArray: true,
        // disableConsoleOutput: true,
      },
    }),
  ],
  build: {
    watch: {},
    lib: {
      entry: ["src/preset.ts", "src/index.ts"],
      formats: ["es", "cjs"],
      name: "wpRequest",
    },
    // rollupOptions: {
    //   // external: ["wp-utils"],
    // },
    rollupOptions: {
      output: {
        exports: "named",
      },
    },
  },
});

```

## 快速obf混淆

```ts
import obfuscate from "javascript-obfuscator";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";
(async () => {
  const srcRoot = path.resolve("src");
  const distRoot = path.resolve("dist");
  const files = await glob(["src/**/*"], { onlyFiles: true, dot: true });
  for (const file of files) {
    const absFile = path.resolve(file);
    const rel = path.relative(srcRoot, absFile);
    const outFile = path.join(distRoot, rel);
    await mkdir(path.dirname(outFile), { recursive: true });

    if (/\.(js|cjs)$/.test(file)) {
      const code = await readFile(absFile, "utf-8");
      const res = obfuscate.obfuscate(code) as any;
      const obfuscated =
        typeof res === "string"
          ? res
          : (res?.getObfuscatedCode?.() as string | undefined) ?? String(res);
      await writeFile(outFile, obfuscated, "utf-8");
    } else {
      await copyFile(absFile, outFile);
    }
  }
})();

```

## yonglai sm4加密

```ts
import { SM4 } from "gm-crypto";
/**
 * A set of functions called "actions" for `test`
 */

export default {
  exampleAction: async (ctx: any, next: any) => {
    try {
      // 导入SM4加密工具（假设已安装gm-crypto库）
      // 从请求中获取账户信息

      // 配置SM4加密密钥（需与业务实际密钥一致，建议通过环境变量管理）
      const sm4Key = "yonglaitech20265"
        .split("")
        .map((char) =>
          Number(char.charCodeAt(0).toString().padStart(2, "0")).toString(16),
        )
        .join("");
      // 使用SM4 CBC模式加密账户信息，输出base64编码的密文
      const {
        account,
        tenantId,
        clientType,
        deviceId,
        captchaId,
        captchaCode,
        password,
      } = JSON.parse(ctx.request.body);
      const encryptedAccount = SM4.encrypt(
        // `${account}/${password}/${tenantId || ""}/${clientType}/${deviceId || ""}/${captchaId}/${captchaCode}`,
        JSON.stringify({
          account,
          password,
          captchaCode,
          captchaId,
        }),
        sm4Key,
        {
          // mode: SM4.constants.ECB,
          // iv: sm4Key, // 需配置对应初始向量
          inputEncoding: "utf8",
          outputEncoding: "hex",
          // padding: "pkcs#7",
        },
      );
      console.log("SM4加密后的账户信息:", encryptedAccount);
      ctx.body = {
        obj: encryptedAccount,
      };
    } catch (err) {
      console.log(err);
      ctx.body = err;
    }
  },
};

```

## go debuger by vscode launch.json

```json
{
  "configurations": [
    {
      "name": "dock",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/services/dock"
    },
    {
      "name": "salttrader",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/services/salttrader"
    },
    {
      "name": "treasurehold",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/services/treasurehold"
    }
  ],
  "compounds": [
    {
      "name": "lqt launch all",
      "configurations": ["dock", "salttrader", "treasurehold"]
    }
  ]
}

```

## ffmpeg 视频去水印

```ts
import { spawn } from "child_process";
spawn(
  `ffmpeg -y \
-i 昆仑山脉航拍视频生成.mp4 \
-vf "delogo=x=30:y=30:w=260:h=160,delogo=x=1019:y=459:w=260:h=260" \
-c:v h264_videotoolbox \
-b:v 8M \
-c:a copy \
output.mp4
`,
  {
    stdio: "inherit",
    shell: true,
  },
);

```

## puppeteer 抓sse数据包

### 启动浏览器调试

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
--remote-debugging-port=9222 \
--user-data-dir=./chrome-data --start-fullscreen --auto-open-devtools-for-tabs  --headless=new  TargetURL

### puppeteer 抓sse数据包具体代码

```ts
// import puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
let _browser = null as unknown as Awaited<ReturnType<typeof puppeteer.launch>>;
Promise.resolve()
  .then(async () => {
    _browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: {
        width: 0,
        height: 0,
      },
    });
    const pages = await _browser.pages();
    const page = (await pages[0]) || (await _browser.newPage());
    // 页面里可调用 window.sendToNode()
    const isSendToNodeExposed = await page.evaluate(() => {
      return !!window.isSendToNodeExposed;
    });
    await page.exposeFunction("sendToNode", async (data: any) => {
      switch (data.type) {
        case "start":
          if (data.data === "[START]") {
            console.log("start");
          }
          break;
        case "done":
          if (data.data === "[DONE]") {
            console.log("done");
          }
          break;
        case "other":
          // if (data.data === "[DONE]") {
          //   console.log("done");
          // }
          break;
        default:
          if (typeof data.v === "string") {
            console.log(data.v);
          } else if (data.o === "patch" && Array.isArray(data.v)) {
            console.log(
              data.v
                .filter(
                  (e: any, index: number) =>
                    typeof e.v === "string" && e.o === "append",
                )
                .map((item: any) => item.v)
                .join("\n"),
            );
          }
          break;
      }
    });
    if (!isSendToNodeExposed) {
      await page.evaluate(() => {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
          const response = await originalFetch(...args);

          const url = args[0];

          if (typeof url === "string" && url.includes("/conversation")) {
            const cloned = response.clone() as any;

            const reader = cloned.body.getReader();
            const decoder = new TextDecoder();

            (async () => {
              window.sendToNode({
                type: "start",
                data: "[START]",
              });
              while (true) {
                const { done, value } = await reader.read();

                if (done) break;
                const sse = decoder.decode(value);
                const lines = sse.split("\n");

                for (const line of lines) {
                  if (line.startsWith("data:")) {
                    const jsonText = line.slice(5).trim();

                    try {
                      const obj = JSON.parse(jsonText);
                      window.sendToNode(obj);
                    } catch (err) {
                      window.sendToNode({
                        type: "other",
                        data: jsonText,
                      });
                      // console.error("json parse error", err);
                    }
                  }
                }
              }
              window.sendToNode({
                type: "done",
                data: "[DONE]",
              });
            })();
          }

          return response;
        };
      });
      await page.evaluate(() => {
        window.isSendToNodeExposed = true;
      });
    }
    const waitForSelector = async (selector: string, hasContent?: boolean) => {
      return await page.evaluate(
        async function name(selector, hasContent) {
          const el: any = document.querySelector(selector) as HTMLDivElement;
          if (!el || (hasContent && !el.innerText.trim())) {
            return await new Promise((r) => {
              requestAnimationFrame(async () => {
                await name(selector, hasContent);
                r(true);
              });
            });
          }
        },
        selector,
        hasContent,
      );
    };
    await waitForSelector("#prompt-textarea");
    await page.click("#prompt-textarea", {
      clickCount: 3,
    });

    await page.keyboard.press("Backspace");

    await page.type("#prompt-textarea", "js去重复");
    await page.click("#composer-submit-button");
  })
  .catch(console.error)
  .finally(async () => {
    // await _browser.close();
  });

```

## puppeteer 反爬

启动代理浏览器

`/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
--remote-debugging-port=9222 \
--user-data-dir=./chrome-data --auto-open-devtools-for-tabs --start-fullscreen  --headless=new` 

```ts
// import { launch, connect } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
let _browser = null as unknown as Awaited<ReturnType<typeof puppeteer.launch>>;
Promise.resolve()
  .then(async () => {
    _browser = await puppeteer.launch({
      userDataDir: "./chrome-data",
      args: ["--profile-directory=Default"],
      headless: false,
    });
    const pages = await _browser.pages();

    await Promise.all(pages.map((page) => page.close()));
    const page = await _browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });
    await page.setUserAgent({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    await page.goto("https://chatgpt.com");
    const title = await page.title();
    console.log(title);
  })
  .catch(console.error)
  .finally(async () => {
    // await _browser.close();
  });

```

## Cloudflare 部署

wrangler.toml

字段说明
字段	作用
name	项目名称，只能小写英文/数字/中划线
compatibility_date	Cloudflare runtime 版本日期
pages_build_output_dir	Vite 构建输出目录
compatibility_flags	Node.js 兼容模式（很多 npm 包需要）

```txt
name = "blog"

compatibility_date = "2026-05-19"

pages_build_output_dir = "dist"

[build]
command = "npm run build"

[assets]
directory = "./dist"
```
纯页面模式部署配置

```txt
name = "blog"

compatibility_date = "2026-05-19"

pages_build_output_dir = "dist"
```
部署命令：
npm run build
npx wrangler pages deploy dist

## 实现ps内容识别，去图片水印效果，基于opencv.js

[opencv.js](https://docs.opencv.org/4.x/opencv.js)

```vue
<template>
    <div class='App'>
        <canvas ref="canvas" class="abs-content"></canvas>
    </div>
</template>
<script setup lang="ts">
// @ts-ignore
// import "opencv.js";
const cv = (window as any).cv;

const canvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
const loadImage = async (src: any) => {
    const { resolve, reject, promise } = Promise.withResolvers();
    const url = await src.then((res: any) => res.default);
    const img = new Image();
    img.src = url;
    img.onload = () => {
        resolve(img);
    }
    return promise as Promise<HTMLImageElement>;
}
function contentAwareFill(x: number, y: number, w: number, h: number) {
    const ctxCanvas = canvas.value.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.value.width;
    const height = canvas.value.height;
    const imageData = ctxCanvas.getImageData(0, 0, width, height);

    const src = cv.matFromImageData(imageData);
    const srcRgb = new cv.Mat();
    cv.cvtColor(src, srcRgb, cv.COLOR_RGBA2RGB);

    const mask = cv.Mat.zeros(height, width, cv.CV_8UC1);
    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            mask.ucharPtr(py, px)[0] = 255;
        }
    }

    const dst = new cv.Mat();
    cv.inpaint(srcRgb, mask, dst, 3, cv.INPAINT_TELEA);

    const dstRgba = new cv.Mat();
    cv.cvtColor(dst, dstRgba, cv.COLOR_RGB2RGBA);

    const result = new ImageData(new Uint8ClampedArray(dstRgba.data), width, height);
    ctxCanvas.putImageData(result, 0, 0);

    src.delete();
    srcRgb.delete();
    mask.delete();
    dst.delete();
    dstRgba.delete();
}
onMounted(async () => {
    const img = await loadImage(import("./a.png"));
    canvas.value.width = img.width;
    canvas.value.height = img.height;
    const ctx = canvas.value?.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    console.time()
    contentAwareFill(img.width - 320, img.height - 120, 300, 100);
    console.timeEnd()
})
</script>
<style scoped lang="less">
.App {}
</style>

```

## 实现ps内容识别，去图片水印效果
```vue
<template>
    <div class='App'>
        <canvas ref="canvas" class="abs-content"></canvas>
    </div>
</template>
<script setup lang="ts">

const canvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
const loadImage = async (src: any) => {
    const { resolve, reject, promise } = Promise.withResolvers();
    const url = await src.then((res: any) => res.default);
    const img = new Image();
    img.src = url;
    img.onload = () => {
        resolve(img);
    }
    return promise as Promise<HTMLImageElement>;
}
function contentAwareFill(x: number, y: number, w: number, h: number) {
    const ctx = canvas.value.getContext("2d") as CanvasRenderingContext2D;
    const width = canvas.value.width;
    const height = canvas.value.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const output = new Uint8ClampedArray(imageData.data);

    const halfPatch = 4;
    const patchArea = 81;
    const searchMargin = 30;

    const totalPixels = width * height;
    const mask = new Uint8Array(totalPixels);
    const filled = new Uint8Array(totalPixels);
    const confidence = new Float32Array(totalPixels);

    for (let py = y; py < y + h; py++) {
        const row = py * width;
        for (let px = x; px < x + w; px++) {
            mask[row + px] = 1;
        }
    }
    for (let i = 0; i < totalPixels; i++) {
        if (!mask[i]) { filled[i] = 1; confidence[i] = 1; }
    }

    const sx0 = Math.max(0, x - searchMargin);
    const sy0 = Math.max(0, y - searchMargin);
    const sx1 = Math.min(width, x + w + searchMargin);
    const sy1 = Math.min(height, y + h + searchMargin);

    const borderArr: number[] = [];
    const inBorder = new Uint8Array(totalPixels);
    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
            const key = py * width + px;
            if (filled[key]) continue;
            for (let dy = -1; dy <= 1; dy++) {
                const ny = py + dy;
                if (ny < 0 || ny >= height) continue;
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = px + dx;
                    if (nx >= 0 && nx < width && filled[ny * width + nx]) {
                        borderArr.push(key);
                        inBorder[key] = 1;
                        dy = 2; break;
                    }
                }
            }
        }
    }

    // 预计算搜索候选列表（排除mask区域）
    const candidates: number[] = [];
    for (let cy = sy0; cy < sy1; cy += 2) {
        for (let cx = sx0; cx < sx1; cx += 2) {
            if (cx >= x && cx < x + w && cy >= y && cy < y + h) continue;
            candidates.push(cy * width + cx);
        }
    }

    let remaining = w * h;

    while (remaining > 0 && borderArr.length > 0) {
        // 找最高优先级边界像素
        let maxP = -1, targetX = x, targetY = y, bestIdx = 0;

        for (let bi = 0; bi < borderArr.length; bi++) {
            const key = borderArr[bi];
            const px = key % width, py = (key - px) / width;

            let conf = 0;
            const pyStart = py - halfPatch, pyEnd = py + halfPatch;
            const pxStart = px - halfPatch, pxEnd = px + halfPatch;
            const syClamp0 = pyStart < 0 ? 0 : pyStart;
            const syClamp1 = pyEnd >= height ? height - 1 : pyEnd;
            const sxClamp0 = pxStart < 0 ? 0 : pxStart;
            const sxClamp1 = pxEnd >= width ? width - 1 : pxEnd;

            for (let sy = syClamp0; sy <= syClamp1; sy++) {
                const row = sy * width;
                for (let sx = sxClamp0; sx <= sxClamp1; sx++) {
                    conf += confidence[row + sx];
                }
            }
            conf /= patchArea;

            let nnx = 0, nny = 0;
            for (let dy = -1; dy <= 1; dy++) {
                const sy2 = py + dy;
                if (sy2 < 0 || sy2 >= height) continue;
                const row2 = sy2 * width;
                for (let dx = -1; dx <= 1; dx++) {
                    const sx2 = px + dx;
                    if (sx2 >= 0 && sx2 < width && mask[row2 + sx2]) {
                        nnx -= dx; nny -= dy;
                    }
                }
            }
            const nLen = Math.sqrt(nnx * nnx + nny * nny) || 1;
            nnx /= nLen; nny /= nLen;

            let gx = 0, gy = 0;
            const pyRow = py * width;
            if (px > 0 && px < width - 1 && filled[pyRow + px - 1] && filled[pyRow + px + 1]) {
                const i1 = (pyRow + px + 1) * 4, i2 = (pyRow + px - 1) * 4;
                gx = ((output[i1] * 0.299 + output[i1+1] * 0.587 + output[i1+2] * 0.114) -
                      (output[i2] * 0.299 + output[i2+1] * 0.587 + output[i2+2] * 0.114)) * 0.5;
            }
            if (py > 0 && py < height - 1 && filled[(py-1) * width + px] && filled[(py+1) * width + px]) {
                const i1 = ((py+1) * width + px) * 4, i2 = ((py-1) * width + px) * 4;
                gy = ((output[i1] * 0.299 + output[i1+1] * 0.587 + output[i1+2] * 0.114) -
                      (output[i2] * 0.299 + output[i2+1] * 0.587 + output[i2+2] * 0.114)) * 0.5;
            }
            const dataVal = Math.abs(-gy * nnx + gx * nny) / 255 + 0.001;

            const p = conf * dataVal;
            if (p > maxP) { maxP = p; targetX = px; targetY = py; bestIdx = bi; }
        }

        // 粗搜：在候选列表中找最佳匹配
        let bestDist = Infinity, bestX = sx0, bestY = sy0;

        const tClampY0 = targetY - halfPatch < 0 ? -targetY : -halfPatch;
        const tClampY1 = targetY + halfPatch >= height ? height - 1 - targetY : halfPatch;
        const tClampX0 = targetX - halfPatch < 0 ? -targetX : -halfPatch;
        const tClampX1 = targetX + halfPatch >= width ? width - 1 - targetX : halfPatch;

        for (let ci = 0; ci < candidates.length; ci++) {
            const cKey = candidates[ci];
            const cx = cKey % width, cy = (cKey - cx) / width;

            let sum = 0, count = 0;
            for (let dy = tClampY0; dy <= tClampY1; dy++) {
                const pby = cy + dy;
                if (pby < 0 || pby >= height) continue;
                const rowA = (targetY + dy) * width;
                const rowB = pby * width;
                for (let dx = tClampX0; dx <= tClampX1; dx++) {
                    const pbx = cx + dx;
                    if (pbx < 0 || pbx >= width) continue;
                    if (!filled[rowA + targetX + dx]) continue;
                    const i1 = (rowA + targetX + dx) * 4, i2 = (rowB + pbx) * 4;
                    const dr = output[i1] - output[i2];
                    const dg = output[i1 + 1] - output[i2 + 1];
                    const db = output[i1 + 2] - output[i2 + 2];
                    sum += dr * dr + dg * dg + db * db;
                    count++;
                }
            }
            if (count > 0) {
                const d = sum / count;
                if (d < bestDist) { bestDist = d; bestX = cx; bestY = cy; }
            }
        }

        // 精搜
        for (let cy = bestY - 2; cy <= bestY + 2; cy++) {
            if (cy < 0 || cy >= height) continue;
            for (let cx = bestX - 2; cx <= bestX + 2; cx++) {
                if (cx < 0 || cx >= width) continue;
                if (cx >= x && cx < x + w && cy >= y && cy < y + h) continue;

                let sum = 0, count = 0;
                for (let dy = tClampY0; dy <= tClampY1; dy++) {
                    const pby = cy + dy;
                    if (pby < 0 || pby >= height) continue;
                    const rowA = (targetY + dy) * width;
                    const rowB = pby * width;
                    for (let dx = tClampX0; dx <= tClampX1; dx++) {
                        const pbx = cx + dx;
                        if (pbx < 0 || pbx >= width) continue;
                        if (!filled[rowA + targetX + dx]) continue;
                        const i1 = (rowA + targetX + dx) * 4, i2 = (rowB + pbx) * 4;
                        const dr = output[i1] - output[i2];
                        const dg = output[i1 + 1] - output[i2 + 1];
                        const db = output[i1 + 2] - output[i2 + 2];
                        sum += dr * dr + dg * dg + db * db;
                        count++;
                    }
                }
                if (count > 0) {
                    const d = sum / count;
                    if (d < bestDist) { bestDist = d; bestX = cx; bestY = cy; }
                }
            }
        }

        // 填充patch
        let filledCount = 0;
        for (let dy = -halfPatch; dy <= halfPatch; dy++) {
            const ty = targetY + dy, fsy = bestY + dy;
            if (ty < 0 || ty >= height || fsy < 0 || fsy >= height) continue;
            const dstRow = ty * width, srcRow = fsy * width;
            for (let dx = -halfPatch; dx <= halfPatch; dx++) {
                const tx = targetX + dx, fsx = bestX + dx;
                if (tx < 0 || tx >= width || fsx < 0 || fsx >= width) continue;
                const dstKey = dstRow + tx;
                if (filled[dstKey]) continue;

                const srcIdx = (srcRow + fsx) * 4;
                const dstIdx = dstKey * 4;
                output[dstIdx] = output[srcIdx];
                output[dstIdx + 1] = output[srcIdx + 1];
                output[dstIdx + 2] = output[srcIdx + 2];
                output[dstIdx + 3] = 255;
                filled[dstKey] = 1;
                mask[dstKey] = 0;
                confidence[dstKey] = maxP;
                filledCount++;

                if (inBorder[dstKey]) {
                    inBorder[dstKey] = 0;
                }

                for (let ndy = -1; ndy <= 1; ndy++) {
                    const nny2 = ty + ndy;
                    if (nny2 < y || nny2 >= y + h) continue;
                    for (let ndx = -1; ndx <= 1; ndx++) {
                        if (ndx === 0 && ndy === 0) continue;
                        const nnx2 = tx + ndx;
                        if (nnx2 < x || nnx2 >= x + w) continue;
                        const nKey = nny2 * width + nnx2;
                        if (!filled[nKey] && !inBorder[nKey]) {
                            borderArr.push(nKey);
                            inBorder[nKey] = 1;
                        }
                    }
                }
            }
        }

        // 清理borderArr中已填充的元素（swap-remove）
        let writeIdx = 0;
        for (let ri = 0; ri < borderArr.length; ri++) {
            if (!filled[borderArr[ri]]) {
                borderArr[writeIdx++] = borderArr[ri];
            }
        }
        borderArr.length = writeIdx;

        remaining -= filledCount;
        if (filledCount === 0) break;
    }

    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);
}
onMounted(async () => {
    const img = await loadImage(import("./a.png"));
    canvas.value.width = img.width;
    canvas.value.height = img.height;
    const ctx = canvas.value?.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    console.time()
    contentAwareFill(img.width - 320, img.height - 120, 300, 100);
    console.timeEnd()
})
</script>
<style scoped lang="less">
.App {}
</style>
```

## 零宽字符串隐藏

利用零宽字符串及字符串分割思路

常见零宽字符
Unicode	名称	转义	用途
U+200B	零宽空格	\u200B	换行点
U+200C	零宽非连接符	\u200C	防止连字
U+200D	零宽连接符	\u200D	启用连字
U+FEFF	零宽不换行空格/BOM	\uFEFF	字节顺序标记
U+200E	左至右标记	\u200E	文本方向
U+200F	右至左标记	\u200F	文本方向


### 零宽字符串隐藏 解密/加密

```js
// 将文本编码为零宽字符序列
function encodeToZeroWidth(str) {
  // 将每个字符转为二进制，用零宽字符表示
  const zeroWidthChars = {
    '0': '\u200B',  // 零宽空格
    '1': '\u200C',  // 零宽非连接符
    'separator': '\u200D'  // 分隔符
  };
  
  let result = '';
  for (let char of str) {
    const binary = char.charCodeAt(0).toString(2);
    for (let bit of binary) {
      result += zeroWidthChars[bit];
    }
    result += zeroWidthChars.separator;
  }
  return result;
}

// 解码零宽字符
function decodeFromZeroWidth(str) {
  const zeroWidthChars = {
    '\u200B': '0',
    '\u200C': '1',
    '\u200D': 'separator'
  };
  
  let binary = '';
  let result = '';
  
  for (let char of str) {
    if (zeroWidthChars[char]) {
      if (zeroWidthChars[char] === 'separator') {
        result += String.fromCharCode(parseInt(binary, 2));
        binary = '';
      } else {
        binary += zeroWidthChars[char];
      }
    }
  }
  return result;
}

// 使用示例
const hidden = encodeToZeroWidth('Hello');
console.log(hidden); // 看起来是空字符串
console.log(hidden.length); // 有长度但不可见
console.log(decodeFromZeroWidth(hidden)); // "Hello"

// 嵌入正常文本中
const normalText = '这是一段正常文本';
const hiddenText = encodeToZeroWidth('secret code');
const combined = normalText + hiddenText;
console.log(combined); // 只显示"这是一段正常文本"
console.log(decodeFromZeroWidth(combined)); // "secret code"
```


## .prettierrc 代码格式化

```json
{
    "printWidth": 100,
    "tabWidth": 4,
    "useTabs": false,
    "semi": false,
    "singleQuote": true,
    "jsxSingleQuote": false,
    "trailingComma": "all",
    "bracketSpacing": true,
    "jsxBracketSameLine": false,
    "arrowParens": "always",
    "endOfLine": "lf",
    "htmlWhitespaceSensitivity": "css",
    "proseWrap": "preserve"
}

```

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
const waitForSelector = async (selector: string, hasContent?: boolean) => {
  return await page.evaluate(
	async function name(selector, hasContent) {
	  const el: any = document.querySelector(selector) as HTMLDivElement;
	  if (!el || (hasContent && !el.innerText.trim())) {
		return await new Promise((r) => {
		  requestAnimationFrame(async () => {
			await name(selector, hasContent);
			r(true);
		  });
		});
	  }
	},
	selector,
	hasContent,
  );
};
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
