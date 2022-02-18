# vue3.0 基础表格算法

```tsx
import { buildProps } from "@wisdom-plus/utils/props"
import {defineComponent, ExtractPropTypes, PropType} from "vue"

export const tableProps = buildProps({
    columns: {
        type: [Array] as PropType<Array<any>>,
        default: ()=>[]
    },
    data: {
        type: [Array] as PropType<Array<any>>,
        default: ()=>[]
    },
    spanCell: {
        type: [Function] as PropType<Function>,
        default: ()=>[]
    },
})

export type TableProps = ExtractPropTypes<typeof tableProps>

export default defineComponent({
    name: 'WpTable',
    props: tableProps,
    setup(props) {
        /**
         * 获取合并单元格栏目数据
         * @param columns
         */
        const getColumnsMergedCell = (columns)=>{
            let rowspanMax = 0;
            let colspanMax = 0;
            let columns_col:any = [];
            let columnsMap = {};
            /**
             * 平铺单元格栏目
             * @param itemColumns 单元格栏目集合
             * @param result 返回平铺数据
             */
            const flatDry:any = (itemColumns,result:any = []) =>{
                itemColumns.forEach(it=>{
                    if(it.columns.length > 1){
                        flatDry(it.columns,result)
                    }else {
                        result.push(it);
                    }
                })
                return result;
            }
            /**
             * 获取单元格栏目信息
             * @param columns 栏目
             * @param level 栏目层深
             */
            const getItemColumns = (columns, level = 0)=>{
                return columns.map(it=>{
                    const levelIndex = level+1;
                    rowspanMax = levelIndex > rowspanMax ? levelIndex : rowspanMax;
                    colspanMax = it.columns ? colspanMax : colspanMax + 1;
                    columnsMap[levelIndex] = columnsMap[levelIndex] || [];
                    const itemColumns = getItemColumns(it.columns || [],levelIndex);
                    let colspanArr = flatDry(itemColumns);
                    const item = {
                        ...it,
                        level:levelIndex,
                        columns:itemColumns,
                        colspanArr,
                        colspan:colspanArr.length || 1,
                    }
                    if(!it.columns){
                        columns_col.push(item);
                    }
                    columnsMap[levelIndex].push(item);
                    return item;
                });
            }
            getItemColumns(columns);
            return {
                // 栏目映射
                columnsMap,
                // 总行数
                rowspanMax,
                // 总列数
                colspanMax,
                // 栏目列集合
                columns_col,
            }
        }
        /**
         * 合并body单元格
         */
        const getTbodyMergedCells:any = ()=>{
            const result:any = [];
            const spanCellFilters:any = []
            props.data.forEach((row,rowIndex)=>{
                const item:any = [];
                theadColumns.columns_col.forEach((column, columnIndex)=>{
                    const it:any = {
                        column,
                        row,
                        rowIndex,
                        columnIndex,
                    }
                    const spanCell = props.spanCell(it) || []
                    it.spanCell = [spanCell[0] || 1,spanCell[1] || 1];
                    if(it.spanCell.reduce((a,b)=>a+b) > 2){
                        for(let x = 0; x < it.spanCell[1]; x++){
                            for(let y = 0; y < it.spanCell[0]; y++){
                                const str = [rowIndex + y, columnIndex + x].join("-");
                                const startStr = [rowIndex, columnIndex].join("-");
                                if(str != startStr){
                                    spanCellFilters.push(str)
                                }
                            }
                        }
                    }
                    item.push(it);
                });
                result.push(item)
            });
            return result.map((it,rk)=>{
                return it.filter((ee,ck)=>{
                    return !spanCellFilters.includes([rk,ck].join("-"))
                })
            })
        }

        const theadColumns = getColumnsMergedCell(props.columns)
        const tbodyCells = getTbodyMergedCells();
        return {
            theadColumns,
            tbodyCells
        }
    },
    render() {
        const theadRender = ()=>(<thead>
            {Object.values(this.theadColumns.columnsMap).map((item:any,key:number)=>(
                <tr>
                    {item.map((column)=>(
                        <th class={{
                                "wp-table__cell":true,
                            }}
                            colspan={column.colspan}
                            rowspan={column.colspan === 1 ? this.theadColumns.rowspanMax-key:1}>
                            <div class={{
                                "cell":true
                            }}>{column.label}</div>
                        </th>
                    ))}
                </tr>
            ))}
        </thead>)
        const tbodyRender = ()=>(<tbody>
            {this.tbodyCells.map(item=>(
                <tr>
                    {item.map(({column, row, spanCell, rowIndex}:any)=>(
                        <td class={{
                                "wp-table__cell":true,
                            }}
                            rowspan={spanCell[0]}
                            colspan={spanCell[1]}
                        >
                            <div class={{
                                "cell":true
                            }}>{rowIndex}/{row[column.prop]}</div>
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>)
        return (
            <div class={'wp-table'}>
                <table class={{
                    'wp-table--body': true,
                }} border={0} cellpadding={0} cellspacing={0}>
                    {theadRender()}
                    {tbodyRender()}
                </table>
            </div>
        )
    }
})

```