import {sync} from 'fast-glob'
import JavaScriptObfuscator, {ObfuscatorOptions} from 'javascript-obfuscator'
import {readFileSync, writeFileSync} from 'fs'
import {resolve} from 'path'
import Chalk from 'chalk'
import ProgressBar, {ProgressBarOptions} from 'progress'
import {merge} from 'lodash'
const log = console.log
export type JavascriptObfuscatorServeOptions = Partial<{
    dir:string
    ObfuscatorOptions:ObfuscatorOptions
    ProgressBarOptions:ProgressBarOptions
    PatternInternal:string | string[]
}>

export interface JavascriptObfuscatorServeImplements {
    init():Promise<any>
}

export class JavascriptObfuscatorServe implements JavascriptObfuscatorServeImplements {
    constructor(public options:JavascriptObfuscatorServeOptions = {}) {
    }

    async init() {
        return new Promise<any>((resolve1, reject) => {
            try {
                const dir = this.options.dir || resolve(process.cwd(), 'dist')
                const dirArr = this.options.PatternInternal || [`${dir}/**/*.js`]
                const files = sync(dirArr)
                log(Chalk.blue('正在启动【javascript-obfuscator】代码混淆加密'))
                log(Chalk.yellow(`混淆加密对象：${dirArr}\n已扫描文件：${files.length} 个\n正在执行混淆加密，请稍等...`))
                const bar = new ProgressBar(`当前进度:percent :bar 已处理(${Chalk.green(':current/:total')})文件`, {
                    total: files.length,
                    width: 50
                })

                files.forEach(file => {
                    const obfuscationResult = JavaScriptObfuscator.obfuscate(readFileSync(file).toString('utf-8'), merge({
                        compact: true,
                        numbersToExpressions: true,
                        simplify: true,
                        stringArrayShuffle: true,
                        splitStrings: true,
                        stringArrayThreshold: 1,
                        unicodeEscapeSequence:true
                    } as ObfuscatorOptions, this.options.ObfuscatorOptions))
                    writeFileSync(file, obfuscationResult.getObfuscatedCode(), 'utf-8')
                    bar.tick()
                    if (bar.complete) {
                        log(Chalk.blue('【javascript-obfuscator】代码混淆加密完成'))
                        setTimeout(() => {
                            resolve1(null)
                        })
                    }
                })
            } catch (e) {
                reject(e)
            }

        })
    }
}


import {Plugin} from 'vite'
export default (options:JavascriptObfuscatorServeOptions = {}) => {
    return {
        name:'javascript-obfuscator-serve',
        apply:'build',
        closeBundle() {
            return new JavascriptObfuscatorServe(options).init()
        }
    } as Plugin
}
