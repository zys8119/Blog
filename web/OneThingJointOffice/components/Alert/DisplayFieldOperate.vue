<template>
    <div class="DisplayFieldOperate">
        <div class="msg"><span @click="reset">恢复表单默认值</span></div>
        <content-table ref="table" :data="formList" :columns="columns" :pageConfig="{noPage:true}">
            <template slot-scope="{column,row}">
                <template v-if="column.type === 1">
                    <el-radio :label="1" v-model="value[row.id]" @click.native.stop="radioClick(row,1)"><i class="el-icon-check"></i></el-radio>
                </template>
                <template v-else-if="column.type === 2">
                    <el-radio :label="2" v-model="value[row.id]" @click.native.stop="radioClick(row,2)"><i class="el-icon-check"></i></el-radio>
                </template>
                <template v-else-if="column.type === 3">
                    <el-radio :label="3" v-model="value[row.id]" @click.native.stop="radioClick(row,3)"><i class="el-icon-check"></i></el-radio>
                </template>
            </template>
        </content-table>
    </div>
</template>

<script>
import {displayFieldOperate} from "../rulesOptions"
export default {
    name: "DisplayFieldOperate",
    props:{
        displayFieldOperate:{type:Object,default:Object},
        formList:{type:Array,default:Array},
    },
    data(){
        return {
            columns:[
                {label:"组件名称", prop:"info.label"},
                ...displayFieldOperate,
            ],
            value:{},
        }
    },
    watch:{
        value:{
            deep:true,
            handler(){
                this.$emit("save", this.value)
            }
        }
    },
    mounted() {
        this.value = {};
        this.formList.forEach(e=>{
            this.$set(this.value,e.id,this.displayFieldOperate[e.id] || null);
        });
        this.$refs.table.init();
    },
    methods:{
        radioClick(row,value){
            if(this.value[row.id] === value){
                setTimeout(()=>{
                    this.value[row.id] = null;
                }, 500)
            }
        },
        reset(){
            this.value = {};
        }
    }
}
</script>

<style scoped lang="less">
.DisplayFieldOperate{
    .el-icon-check{
        font-weight: bold;
    }
    .msg{
        text-align: right;
        margin-bottom: @unit15;
        span{
            color: @themeColor;
            cursor: pointer;
        }
    }
}
</style>