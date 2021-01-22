const fs = require("fs");
const path = require("path");
const ncol = require("ncol");
const {exec} = require("child_process");
exec("chcp 65001")
const CommitMsgFormatMap = {
    "Create":"项目初始化",
    "Add":"新增用户管理模块",
    "Fix":"修复XXX模块XXX的问题，禅道BUG编号：#XXX",
    "Mod":"修改XXX模块XXX接口内XXX的算法逻辑",
    "Refactor":"重构了XXX模块XXX接口/方法",
    "Merge":"合并XXX分支至XXX分支",
    "Migration":"提交迁移（XXX文件）：迁移影响XXX与XXX",
    "Docs":"更新XXX(模块、接口)的接口(说明、注释)文档",
    "Test":"新增/调整XXX模块/方法的单元测试或测试脚本",
    "Release":"version 1.0.0.1",
}
const Reg = new RegExp("^\\[("+Object.keys(CommitMsgFormatMap).map(e=>e.toLocaleLowerCase()).join("|")+")\\]\\s{1,}")
const CommitMsg = fs.readFileSync(path.resolve(__dirname,".git/COMMIT_EDITMSG"),"utf8");
const CommitMsgArr = CommitMsg.split(/\n{2,}/).filter(e=>e);
const isExit = CommitMsgArr.filter(e=>!Reg.test(e.toLocaleLowerCase()))
if(isExit.length > 0){
    ncol.color(function (){
        this.error("[ERROR] ")
            .error("消息格式错误，禁止提交！")
            .error("\n错误如下：")
    })
    ncol.log("")
    isExit.forEach((errMsg)=>{
        ncol.error(`>>> ${errMsg}`);
    })
    ncol.log("\n示例:")
    for(let k in CommitMsgFormatMap){
        ncol.color(function (){
            this.log("  ").info(`[${k}] `).log(CommitMsgFormatMap[k])
        })
    }

    ncol.color(function (){
        this.log("\n\n\n提交描述:")
            .log("[<")
            .success("Type")
            .log(">] ")
            .log("<")
            .success("Space")
            .log("> ")
            .log("<")
            .success("Message")
            .log(">")
    })
    ncol.color(function (){this.log("- ").success("type ").log("# 提交内容类型，放置在一对英文中括号内 `[]`")})
    ncol.color(function (){this.log("- ").success("space ").log("# 空格，用于隔开类型与详情")})
    ncol.color(function (){this.log("- ").success("message ").log("# 提交内容描述详情\n")})
    ncol.color(function (){
        this
            .log("# 每次Comment中允许存在多个完整的描述，每条占据一行内容，用回车符隔开\n")
            .log("# 每条描述尽量叙述一个问题，如Fix，一次提交中修复多个BUG则填写多个Fix类型的描述\n")
            .log("# Release类型不与其他类型描述共存\n")
    })
    process.exit(1)
}