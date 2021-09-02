# h5 表格封装

```vue
<template>
    <div class="TableH5" :class="{
        dividerLine:dividerLine
    }">
        <table border="2" cellpadding="0" cellspacing="0">
            <thead>
                <tr :class="{trNoData:data.length === 0}">
                    <th v-for="(column,key) in columns" :key="key" v-bind="getBind(column)">{{ column.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(d,key) in data" :key="key">
                    <td v-for="(column,kk) in columns" :key="kk" v-bind="getBind(column, d)">
                        <template v-if="column.type === 'number'">
                            {{key+1}}
                        </template>
                        <template v-else>
                            {{ d[column.prop] }}
                        </template>
                    </td>
                </tr>
                <tr v-if="data.length === 0">
                    <td :colspan="columns.length" class="noData">暂无数据</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: "TableH5",
    props:{
        columns:{type:Array,default:Array},
        data:{type:Array,default:Array},
        dividerLine:{type:Boolean,default:false},
    },
    methods:{
        getBind({className, classHeaderName, ...column},d){
            return {
                align:"center",
                class:d ? className: classHeaderName,
                style: {
                    "min-width":column.width ? column.width :`${100/this.columns.length}%`,
                },
                ...column,
            }
        }
    },
}
</script>

<style scoped lang="less">
.TableH5{
    @borderColor:#ECF2FF;
    table{
        border:1px solid @borderColor;
        width: 100%;
        th,td{
            border-color: @borderColor;
            border-left:none;
            border-top:none;
            color:#333333;
            font-size: 14px;
            padding: 15px 4px;
            &:last-child{
                border-right: 0;
            }
        }
        th{
            background-color: @borderColor;
        }
        tbody{
            tr{
                &:last-child{
                    td{
                        border-bottom: none;
                    }
                }
            }
        }
    }
    .noData{
        text-align: center;
        color: #999999;
        height:50px;
    }
    &.dividerLine{
        table{
            th,td{
                border-right: none;
            }
        }
    }
}
</style>
```
