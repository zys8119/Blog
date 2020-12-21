const ncol = require("ncol");
const { execSync } = require("child_process");
const { resolve } = require("path");
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const crypto = require('crypto');
const lodash = require('lodash');
/**
 * 默认配置
 * */
const defaultOptions = {
    // 本地git部署项目目录
    cwd:"H:\\work\\common_prod_rd",
    // 相对具体部署目录
    dir:"./npc_h5/administrative-finance",
    // 发布分支
    branch:"release",
    // 文件拷贝目标
    copyPath:resolve(__dirname,"../../dist"),
    // 消息
    info:{
        title:"测试醒目",
        setting:"测试",
        dir:"common_prod_rd",
        remark:"common_prod_rd",
    },
    // 钉钉机器人配置
    dingtalk:{
        // 机器人token
        access_token:null,
        // 机器人密钥
        secret:null,
        // 钉钉消息模板
        getContent:options=>{
            return `前端更新\n1、更新项目名称：${options.info.title}\n2、更新环境：${options.info.setting}\n3、更新目录标明${options.info.dir} ${options.branch} 分支\n4、更新内容说明（回滚使用）：${commit}\n5、备注说明：${options.info.remark}`
        }
    },
    // 具体配置请参考钉钉开发文档：https://ding-doc.dingtalk.com/doc#/serverapi2/qf2nxq
    description:{
        // 消息类型
        msgtype: "text",
        text: {
            // 默认会被getContent替代，所以暂不建议使用
            content:""
        },
        at:{
            // 发送并提醒给谁
            atMobiles:[
            ],
            isAtAll:false,
        }
    },
};
// 合并配置
let customConfig = {};
let type = process.argv[process.argv.indexOf("--config")+1];
if(type){
    try {
        const buildServeConfig = require('../../buildServeConfig.js');
        if(buildServeConfig && buildServeConfig[type]){
            customConfig = buildServeConfig[type];
        }
    }catch (e){
        ncol.color(function (){this.error(e);})
    }
}
const options = lodash.merge(defaultOptions, customConfig);

/**
 * 控制台交互输入
 */
class input{
    options = null;
    log = ncol;
    constructor(options = {}) {
        if(options && options.options){
            this.options = options.options.map(e=>e.value);
        }
        ncol.info(`${options.message}${this.options ? "待选项：" :""}`);
        if(this.options){
            ncol.info(`${options.options.map(e =>`${e.value}(${e.name})`).join("、")}`);
        }
        return new Promise((resolve, reject) => {
            this.setEncoding();
            this.readable(() => {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    if(!this.options || (this.options && this.options.some(e=>e == chunk))){
                        if((this.options && this.options.some(e=>e == chunk))){
                            chunk = options.options.find(e=>e.value == chunk)
                        }
                        resolve(chunk)
                    }else {
                        if(options.error){
                            ncol.error(new Error(options.error))
                        }else {
                            reject();
                        }
                    }
                }
            });
            this.end();
        })
    }
    setEncoding(){
        process.stdin.setEncoding('utf8');
    }
    readable(callback){
        process.stdin.on('readable', callback);
    }
    end(){
        process.stdin.on('end', () => {
            process.stdout.write('end');
        });
    }
}

/**
 * 删除文件夹
 * @param filePath
 * @returns {Promise<unknown>|Promise<void>}
 */
function rmdirPromise(filePath) {
    if(!fs.existsSync(filePath)){
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        fs.stat(filePath, function(err, stat) {
            if(err) reject(err)
            if(stat.isFile()) {
                fs.unlink(filePath, function(err) {
                    if(err) reject(err)
                    resolve()
                })
            }else {
                fs.readdir(filePath, function(err, dirs) {
                    if(err) reject(err)
                    dirs = dirs.map(dir => path.join(filePath, dir)) // a/b a/c
                    let index = 0;
                    (function next() {
                        if(index === dirs.length) {
                            fs.rmdir(filePath, function(err) {
                                if(err) reject(err)
                                resolve()
                            })
                        }else {
                            rmdirPromise(dirs[index++]).then(() => {
                                next()
                            }, err => {
                                reject(err)
                            })
                        }
                    })()
                })
            }
        })
    })
}


/**
 * 钉钉机器人消息发送
 * 开发文档：https://ding-doc.dingtalk.com/doc#/serverapi2/qf2nxq
 */
function dingtalkSend(){
    let timestamp = Date.now();
    let access_token = options.dingtalk.access_token;
    const secret = options.dingtalk.secret;
    const sign = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}\n${secret}`, "utf8")
        .digest('base64');
    axios({
        url:"https://oapi.dingtalk.com/robot/send",
        method:"post",
        params:{
            access_token,
            timestamp,
            sign:encodeURIComponent(sign),
        },
        data:options.description
    })
}


//*
ncol.color(function (){this.info("拉取最新代码");})
console.log(execSync(`git pull`,{cwd:options.cwd}).toString())
ncol.color(function (){this.log("却换到").info(options.branch).log("分支");})
console.log(execSync(`git checkout ${options.branch}`,{cwd:options.cwd}).toString())
ncol.color(function (){this.info("当前分支");})
console.log(execSync(`git branch`,{cwd:options.cwd}).toString())
ncol.color(function (){this.info("同步分支最新代码");})
console.log(execSync(`git pull`,{cwd:options.cwd}).toString())
ncol.color(function (){this.info("复制打包文件");})
const dirName = options.dir.split("/").filter(e=>e).pop()
console.log(resolve(options.cwd, options.dir, "../"))
rmdirPromise(resolve(options.cwd, options.dir)).then(() => {
    fs.mkdirSync(resolve(options.cwd, options.dir))
    console.log(execSync(`xcopy /s /e /Q /Y /I ${options.copyPath}`,{cwd:resolve(options.cwd, options.dir)}).toString("utf8"))
    console.log(execSync(`git add .`,{cwd:options.cwd}).toString())
    let statusInfo = execSync(`git status`,{cwd:options.cwd}).toString();
    ncol.color(function (){this.success(statusInfo);})
    if(statusInfo.indexOf("nothing to commit, working tree clean") > -1){
        return ncol.color(function (){this.success("文件已经是最新,无需提交");})
    }
    if(statusInfo.indexOf("(use \"git push\" to publish your local commits)") === -1){
        // 自动化打包测试
        new input({
            message:"请输入 commit",
        }).then(commit=>{
            if(commit.length === 2){
                ncol.color(function (){this.error("commit 提交内容为必填");})
                return ;
            }
            options.description.text.content = options.dingtalk.getContent(options,commit);
            ncol.color(function (){this.success(execSync(`git commit -m \'${commit}\'`,{cwd:options.cwd}).toString());})
            ncol.color(function (){this.info(execSync(`git push origin ${options.branch}`,{cwd:options.cwd}).toString());})
            ncol.color(function (){this.success("提交完成");})
            dingtalkSend();
        })
    }else {
        ncol.color(function (){this.success("文件已经是最新");})
        ncol.color(function (){this.info(execSync(`git push origin ${options.branch}`,{cwd:options.cwd}).toString());})
        ncol.color(function (){this.success("提交完成");})
        dingtalkSend();
    }
})
//*/