<template>
    <div class="ListPage" v-if="show">
        <van-list
            ref="list"
            @load="load"
            :immediate-check="false"
            v-model="loading"
            :finished="finished"
            finished-text="没有更多了"
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
            this.apiPath({
                pageNo:this.pageNo,
                pageSize:this.pageSize,
                no_page:this.no_page,
                ...this.params,
            }).then(res=>{
                if(this.no_page){
                    this.list = res.data;
                    this.loading = false;
                    this.finished = true;
                }else {
                    if(this.pageNo === 1){
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
            }).catch(()=>{
                this.loading = false;
                this.finished = true;
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
                this.$nextTick(()=>{
                    this.$refs.list.check()
                })
            })
        }
    }
}
</script>

<style scoped lang="less">
.ListPage{
}
</style>