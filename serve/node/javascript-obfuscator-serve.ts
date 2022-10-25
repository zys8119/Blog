const {sync} = require("fast-glob")
var JavaScriptObfuscator = require('javascript-obfuscator');
var {readFileSync, writeFileSync} = require('fs');
var {resolve} = require('path');
var Chalk = require('chalk');
var ProgressBar = require('progress');
const log = console.log;
const dir = resolve(process.cwd(), 'dist')
const dirArr = [`${dir}/**/*.js`]
const files = sync(dirArr)
log(Chalk.blue('正在启动【javascript-obfuscator】代码混淆加密'));
log(Chalk.yellow(`
混淆加密对象：${dirArr}
已扫描文件：${files.length} 个
`));
const bar = new ProgressBar(`当前进度:percent :bar 已处理(${Chalk.green(':current/:total')})文件`, { total: files.length, width:50 });

files.forEach(file=>{
    const obfuscationResult = JavaScriptObfuscator.obfuscate(
        readFileSync(file).toString('utf-8'),
        {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        }
    );
    writeFileSync(file, obfuscationResult.getObfuscatedCode(), 'utf-8')
    bar.tick();
    if(bar.complete){
        log(Chalk.blue('【javascript-obfuscator】代码混淆加密完成'));
    }
})
