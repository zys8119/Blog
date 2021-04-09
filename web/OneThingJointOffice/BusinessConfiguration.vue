<template>
    <div class="BusinessConfiguration">
        <layout-box>
            <layout-filter-content>
                <filter-content
                    slot="filter"
                    @add="add"
                    :config="{
                        input:false,
                        resetText:false,
                        searchText:false,
                        rightBtns:[
                            {name:'新增业务表单', type:'primary', emit:'add'}
                        ]
                    }">
                </filter-content>
                <content-table ref="table" :columns="columns"></content-table>
            </layout-filter-content>
        </layout-box>
    </div>
</template>

<script>
export default {
    name: "BusinessConfiguration",
    data(){
        return {
            columns:[
                {label:"业务名称", prop:"name"},
                {label:"字段数量", prop:"name"},
                {label:"节点数量", prop:"name"},
                {label:"操作", type:"operate",btns:[
                    {name:'编辑', type:"text", className:"primary"},
                    {name:'删除', type:"text", className:"delete"},
                ]},
            ]
        }
    },
    mounted(){
        this.init();
    },
    methods:{
        init(){
            this.reset();
        },
        reset(){
            this.search();
        },
        search(){
            // this.$refs.table.init();
            this.$refs.table.ContentTableData = [{name:"asd"}]
        },
        // 新增业务表单
        add(){
            this.$router.push({
                path:"/agency-handling/one-thing-joint-office/business-configuration-form",
                query:{
                    type:"add"
                }
            })
        }
    }
}
</script>

<style scoped lang="less">
.BusinessConfiguration{
}
</style>