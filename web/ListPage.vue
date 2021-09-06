<template>
    <div class="ListPage" v-if="show">
        <van-list
            ref="list"
            @load="load"
            :immediate-check="false"
            v-model="loading"
            :finished="finished"
            :finished-text="finishedText"
        >
            <slot :list="list"></slot>
        </van-list>
    </div>
</template>

<script>
export default {
    name: "ListPage",
    props:{
        apiPath:{type:Function,default:Function},
        params:{type:Object,default:()=>({})},
        finishedText:{type:String,default:"没有更多了"},
    },
    data() {
        return {
            list: [],
            loading: false,
            finished: false,
            pageNo:1,
            pageSize:10,
            no_page:false,
            show:true,
        };
    },
    methods:{
        load(){
            const formData = {
                pageNo:this.pageNo,
                pageSize:this.pageSize,
                no_page:this.no_page,
                ...this.params,
            }
            this.apiPath(formData).then(res=>{
                if(formData.no_page){
                    this.list = res.data;
                    this.loading = false;
                    this.finished = true;
                }else {
                    if(formData.pageNo === 1){
                        this.list = res.data.list
                    }else {
                        this.list = this.list.concat(res.data.list);
                    }
                    if(this.list.length >= res.data.total){
                        this.finished = true;
                    }
                    this.pageNo += 1;
                    this.loading = false;
                }
                this.$emit("dataChange",res, formData);
            }).catch((err)=>{
                this.loading = false;
                this.finished = true;
                this.$emit("dataChangeError",err, formData);
            })
        },
        init(){
            this.list = [];
            this.pageNo = 1;
            this.pageSize = 10;
            this.no_page = false;
            this.loading = false;
            this.finished = false;
            this.show = false;
            this.$nextTick(()=>{
                this.show = true;
                setTimeout(()=>{
                    this.$refs.list.check()
                },500)
            })
        }
    }
}
</script>

<style scoped lang="less">
.ListPage{
}
</style>
