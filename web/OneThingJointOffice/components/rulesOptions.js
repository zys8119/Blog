/**
 * 元件列表
 * @type {({test: test, name: string}|{test: test, name: string}|{test: test, name: string}|{test: test, name: string}|{test: test, name: string})[]}
 */
module.exports.componentList = [
    {name:"单选", component:"MaterialRadio"},
    {name:"多选", component:"MaterialCheckbox"},
    {name:"输入框", component:"MaterialInput"},
    {name:"日期", component: "MaterialDatePicker"},
    {name:"下拉框", component: "MaterialSelect"},
    {name:"级联", component: "MaterialCascader"},
    {name:"富文本", component: "MaterialWangeditor"},
    {name:"文件上传", component: "MaterialFileUpload", type:"file"},
    {name:"图片上传", component: "MaterialFileUpload", type:"image"},
    {name:"视频上传", component: "MaterialFileUpload", type:"video"},
    {name:"地理位置", component: "MaterialMap"},
];

/**
 * 校验规则
 * @type {({test: test, name: string}|{test: test, name: string}|{test: test, name: string}|{test: test, name: string}|{test: test, name: string})[]}
 */
module.exports.rulesOptions = [
    {name:"不能为空",test:(val)=>{}},
    {name:"必须是数字",test:(val)=>{}},
    {name:"必须是身份证格式",test:(val)=>{}},
    {name:"必须是手机格式",test:(val)=>{}},
    {name:"必须是邮件格式",test:(val)=>{}},
    {name:"用户名",test:(val)=>{}},
    {name:"密码",test:(val)=>{}},
    {name:"必须中文",test:(val)=>{}},
];

/**
 * 输入框类型
 * @type {({name: string, value: string}|{name: string, value: string}|{name: string, value: string})[]}
 */
module.exports.inputTypeOptions = [
    {name:"文字",value:"text"},
    {name:"文本域",value:"textarea"},
    {name:"密码",value:"password"},
];

/**
 * 日期类型
 * @type {({name: string, value: string}|{name: string, value: string}|{name: string, value: string}|{name: string, value: string}|{name: string, value: string})[]}
 */
module.exports.datePickerTypeList =  [
    {name:"年",value:"year",},
    {name:"月",value:"month",},
    {name:"年月日",value:"date",},
    {name:"多个日期",value:"dates",},
    {name:"周",value:"week",},
    {name:"年月日时分秒",value:"datetime",},
    {name:"年月日时分秒范围",value:"datetimerange",},
    {name:"年月日范围",value:"daterange",},
    {name:"月范围",value:"monthrange",},
];

/**
 * 本节点动作设置
 * @type {({name: string, value: string}|{name: string, value: string}|{name: string, value: string}|{name: string, value: string}|{name: string, value: string})[]}
 */
module.exports.nodeActionOptions =  [
    {name:"同意",value:"同意",},
    {name:"拒绝",value:"拒绝",},
];

/**
 * 可操作性
 */
module.exports.displayFieldOperate =  [
    {label:"可操作", prop:null,type:1},
    {label:"只读", prop:null,type:2},
    {label:"隐藏", prop:null,type:3},
];

/**
 * 页面操作
 */
module.exports.pageOperation =  [
    {label:"暂存", value:1},
    {label:"打印", value:2},
];

/**
 * 默认排序规则
 */
module.exports.defaultCollation =  [
    {label:"按创建时间从新到旧", value:1},
    {label:"按创建时间从旧到新", value:2},
    {label:"按修改时间从新到旧", value:3},
    {label:"按修改时间从旧到新", value:4},
];

/**
 * 消息类型
 */
module.exports.messageTypeOptions =  [
    {label:"短信消息", value:1},
    {label:"钉钉消息", value:2},
];

/**
 * 触发条件
 */
module.exports.triggeringConditionsOptions =  [
    {label:"流程开始", value:1},
    {label:"流程结束", value:2},
    {label:"流程节点", value:3},
];

/**
 * 审批结论
 */
module.exports.approvalConclusionOptions =  [
    {label:"通过", value:1},
    {label:"未通过", value:2},
];

/**
 * 流程参与人
 */
module.exports.processParticipantOptions =  [
    {label:"发起人", value:1},
    {label:"已审批人", value:2},
    {label:"当前审批人", value:3},
];