/**
 * 项目名称
 */
export const ProjectName = 'xxxxxx'

export default {
    'xxxxxxx':{
        token:'xxxxx',
        username:'xxxxx'
    },
} as Record<string, Config>

type Config = {
    token:string // 团队成员对应的gitlab Token
    username?:string // 成员名称
}
