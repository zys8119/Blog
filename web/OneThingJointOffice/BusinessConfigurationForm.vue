<template>
    <div class="BusinessConfigurationForm">
        <layout-box>
            <layout-filter-content>
                <filter-content
                    slot="filter"
                    @save="save"
                    @previewForm="previewForm"
                    :config="{
                        input:false,
                        resetText:false,
                        searchText:false,
                        rightBtns:[
                            {name:'预览表单', type:'primary', emit:'previewForm'},
                            {name:'保存', type:'primary', emit:'save'},
                        ]
                    }">
                    <el-form slot="leftBefore">
                        <el-form-item><el-input placeholder="请输入业务名称" v-model="title"></el-input></el-form-item>
                    </el-form>
                </filter-content>
                <el-tabs v-model="activeName">
                    <el-tab-pane label="表单" name="FormPage"><FormPage ref="FormPage" :tabrefs="$refs"></FormPage></el-tab-pane>
                    <el-tab-pane label="流程" name="ProcessPage"><ProcessPage ref="ProcessPage" :tabrefs="$refs"></ProcessPage></el-tab-pane>
                    <el-tab-pane label="设置" name="SetUpPage"><SetUpPage ref="SetUpPage" :tabrefs="$refs"></SetUpPage></el-tab-pane>
                </el-tabs>
            </layout-filter-content>
        </layout-box>
    </div>
</template>

<script>
import FormPage from "./components/FormPage"
import ProcessPage from "./components/ProcessPage"
import SetUpPage from "./components/SetUpPage"
export default {
    name: "BusinessConfigurationForm",
    components:{
        FormPage,
        ProcessPage,
        SetUpPage,
    },
    data(){
        return {
            activeName:"FormPage",
            title:null,
        }
    },
    methods:{
        getData(){
            return {
                FormPage:this.$refs.FormPage.formList,
                ProcessPage:this.$refs.ProcessPage.formList,
                SetUpPage:this.$refs.SetUpPage.formData,
            }
        },
        save(){
            console.log(this.getData())
        },
        previewForm(){
            if(this.$utils.is_S(this.title)){return  this.$message.error("请输入业务名称")}
            this.$ZAlert.show({
                title:this.title,
                width:"1000px",
                top:"4vh",
                props:{
                    formData:()=> this.getData()
                },
                components: require("./Alert/PreviewForm")
            })
        }
    }
}
</script>

<style scoped lang="less">
.BusinessConfigurationForm{
}
</style>