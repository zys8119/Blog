const {sync} = require("fast-glob")
var JavaScriptObfuscator = require('javascript-obfuscator');
var {readFileSync, writeFileSync} = require('fs');
var {resolve} = require('path');
var Chalk = require('chalk');
var ProgressBar = require('progress');
const log = console.log;
const dirArr = ["disttest/**/*.js"]
const files = sync(dirArr)
log(Chalk.blue('正在启动【javascript-obfuscator】代码混淆'));
log(Chalk.yellow(`
混淆对象：${dirArr}
已扫描文件：${files.length} 个
`));
var bar = new ProgressBar(`当前进度:percent :bar 已处理(${Chalk.green(':current/:total')})文件`, { total: files.length, width:50 });

files.forEach(file=>{
    const target = resolve(__dirname, file)
    var obfuscationResult = JavaScriptObfuscator.obfuscate(
        readFileSync(resolve(__dirname, file)).toString('utf-8'),
        {
            compact: false,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        }
    );
    writeFileSync(target, obfuscationResult.getObfuscatedCode(), 'utf-8')
    bar.tick();
    if(bar.complete){
        log(Chalk.blue('【javascript-obfuscator】代码混淆完成'));
    }
})
