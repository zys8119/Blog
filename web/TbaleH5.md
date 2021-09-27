# h5 表格封装

```vue
<template>
    <div class="TableH5" :class="{
        dividerLine:dividerLine,
        splitLine:splitLine,
    }">
        <table border="2" cellpadding="0" cellspacing="0">
            <thead v-if="showHeader">
                <tr :class="{trNoData:data.length === 0}">
                    <th v-for="(column,key) in columns" :key="key" v-bind="getBind(column)" @click="()=>column.emit ? $emit(column.emit, column) : null">{{ column.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(d,key) in data" :key="key">
                    <td v-for="(column,kk) in columns" :key="kk" v-bind="getBind(column, d)" @click="()=>column.emit ? $emit(column.emit, column, d) : null">
                        <template v-if="column.type === 'number'">
                            {{key+1}}
                        </template>
                        <template v-else>
                            <slot :column="column" :row="d" :$index="key" :rowIndex="kk">
                                {{ d[column.prop] }}
                            </slot>
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
        splitLine:{type:Boolean,default:false},
        showHeader:{type:Boolean,default:true},
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
            padding: @unit15 4px;
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
    &.splitLine{
        table{
            border:none;
            th,td{
                border-right: none;
                border-left: none;
            }
        }
    }
}
</style>
```
