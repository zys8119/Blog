<template>
    <div class="AddMaterialCascaderSetData">
        <div class="AddMaterialCascaderSetDataContent" :style="{width:width ? `${width}px` : null}">
            <HorizontalTree ref="HorizontalTree" type="add" @add="add" :options="options">
                <template slot="header-label" slot-scope="{level}">
                    添加{{level+1 | number_chinese}}级数据
                </template>
                <template slot-scope="{node}">
                    {{node.name}}
                    <el-dropdown trigger="click" class="HorizontalTree-el-dropdown">
                                <span class="el-dropdown-link">
                                  <i class="el-icon-more"
                                     style="color: #C2C6CC;margin-left: 8px"></i>
                                </span>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item @click.native.stop="editItem(node)">修改</el-dropdown-item>
                            <el-dropdown-item @click.native.stop="delItem(node)">删除</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                </template>
            </HorizontalTree>
        </div>
        <z-alert-footer>
            <el-button type="primary" @click="save">保存</el-button>
        </z-alert-footer>
    </div>
</template>

<script>

export default {
    name: "AddMaterialCascaderSetData",
    props:{
        data:{type:Array,default:Array},
    },
    data(){
        return {
            options:[],
            time:null,
            width:null,
        }
    },
    mounted() {
        this.width = window.innerWidth;
        this.options = this.data;
    },
    methods:{
        save(){
            this.$emit('save',this.options);
            this.$ZAlert.hide();
        },
        editItem(item){
            this.getItem(item).then(res=>{
                this.$set(item,"name",res.name);
            })
        },
        delItem(item){
            let paths = this.$utils.findPath(this.options, {id:item.id});
            if(paths){
                const obj = paths[paths.length - 1];
                if(paths.length > 1){
                    paths = paths[paths.length-2].children;
                }else {
                    paths = this.options
                }
                paths.splice(paths.indexOf(obj),1)
            }

        },
        add(type,item){
            if(type === 'directory'){
                this.getItem().then(res=>{
                    this.options.push(res);
                    this.init(this.$refs.HorizontalTree);
                })
            }else if(type === 'child_directory'){
                if(!item){
                    return this.$message.error("请先添加一级数据或先选择上级数据")
                }else {
                    this.getItem().then(res=>{
                        this.$set(item,'children', item.children.concat([res]));
                        this.init(this.$refs.HorizontalTree);
                    })
                }
            }
        },
        getItem(item){
            return new Promise(resolve => {
                this.$ZAlert.show({
                    title:item ? "编辑数据":"添加数据",
                    width:"500px",
                    components:require("./AddData"),
                    props:{
                        item:()=>item,
                    },
                    _event:{
                        save:name=>{
                            resolve( {
                                name,
                                id:Date.now().toString(),
                                children:[],
                            })
                        }
                    }
                })
            })
        },
        init(vm){
            vm.draggableOptionsInit()
            if(vm.$children[1]){
                this.init(vm.$children[1]);
            }
        }
    },
    filters: {
        number_chinese (strObj) {
            //如果数字含有小数部分，那么可以将小数部分单独取出
            //将小数部分的数字转换为字符串的方法：
            var chnNumChar = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            var chnUnitSection = ['', '万', '亿', '万亿', '亿亿'];
            var chnUnitChar = ['', '十', '百', '千'];
            var numToChn = function (num) {
                var index = num.toString().indexOf('.');
                if (index != -1) {
                    var str = num.toString().slice(index);
                    var a = '点';
                    for (var i = 1; i < str.length; i++) {
                        a += chnNumChar[parseInt(str[i])];
                    }
                    return a;
                }
                else {
                    return '';
                }
            };
            //定义在每个小节的内部进行转化的方法，其他部分则与小节内部转化方法相同
            function sectionToChinese(section) {
                var str = '', chnstr = '', zero = false, count = 0; //zero为是否进行补零， 第一次进行取余由于为个位数，默认不补零
                while (section > 0) {
                    var v = section % 10; //对数字取余10，得到的数即为个位数
                    if (v == 0) { //如果数字为零，则对字符串进行补零
                        if (zero) {
                            zero = false; //如果遇到连续多次取余都是0，那么只需补一个零即可
                            chnstr = chnNumChar[v] + chnstr;
                        }
                    }
                    else {
                        zero = true; //第一次取余之后，如果再次取余为零，则需要补零
                        str = chnNumChar[v];
                        str += chnUnitChar[count];
                        chnstr = str + chnstr;
                    }
                    count++;
                    section = Math.floor(section / 10);
                }
                return chnstr;
            }
            //定义整个数字全部转换的方法，需要依次对数字进行10000为单位的取余，然后分成小节，按小节计算，当每个小节的数不足1000时，则需要进行补零
            function TransformToChinese(num) {
                var a = numToChn(num);
                num = Math.floor(num);
                var unitPos = 0;
                var strIns = '', chnStr = '';
                var needZero = false;
                if (num === 0) {
                    return chnNumChar[0];
                }
                while (num > 0) {
                    var section = num % 10000;
                    if (needZero) {
                        chnStr = chnNumChar[0] + chnStr;
                    }
                    strIns = sectionToChinese(section);
                    strIns += (section !== 0) ? chnUnitSection[unitPos] : chnUnitSection[0];
                    chnStr = strIns + chnStr;
                    needZero = (section < 1000) && (section > 0);
                    num = Math.floor(num / 10000);
                    unitPos++;
                }
                return chnStr + a;
            }
            return TransformToChinese(strObj);
        },
    },
}
</script>

<style scoped lang="less">
.AddMaterialCascaderSetData{
    overflow-y: hidden;
    width: 100%;
    .AddMaterialCascaderSetDataContent{
        padding-bottom: @unit15;
    }
}
</style>