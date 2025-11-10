# Bolg

个人爱好，知识积累，点滴成石

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
import axios from "axios";
import crypto from "crypto";
(async () => {
  const appid = "";
  const key = "";
  const query = `hello
  `;
  const salt = Date.now();
  const sign = crypto
    .createHash("md5")
    .update(`${appid}${query}${salt}${key}`)
    .digest("hex");
  console.log(
    (
      await axios.get("https://fanyi-api.baidu.com/api/trans/vip/translate", {
        params: {
          q: query,
          from: "en",
          to: "zh",
          appid,
          salt,
          sign,
        },
      })
    ).data
  );
})();

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
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
        ]
    },
    prompt: {
        messages: {
            type: '选择你要提交的类型 :',
            scope: '选择一个提交范围（可选）:',
            customScope: '请输入自定义的提交范围 :',
            subject: '填写简短精炼的变更描述 :\n',
            body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
            breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
            footerPrefixesSelect: '选择关联issue前缀（可选）:',
            customFooterPrefix: '输入自定义issue前缀 :',
            footer: '列举关联issue (可选) 例如: #31, #I3244 :\n',
            generatingByAI: '正在通过 AI 生成你的提交简短描述...',
            generatedSelectByAI: '选择一个 AI 生成的简短描述:',
            confirmCommit: '是否提交或修改commit ?'
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
        emojiAlign: 'center'
    }
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
