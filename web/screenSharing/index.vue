<template>
    <div class="Home">
        <button @click="start" v-if="!stream">屏幕分享</button>
        <button @click="stop" v-if="stream && mediaRecorder && mediaRecorder.state === 'recording'">结束录制</button>
        <button @click="record" v-if="stream && (!mediaRecorder || mediaRecorder.state !== 'recording')">开始录制</button>
        <button @click="download" v-if="stream">下载视频</button>
        <video autoplay playsinline controls id="player" v-if="stream"></video>
    </div>
</template>

<script>
export default {
    name: "home",
    data(){
        return {
            buf:[],
            mediaRecorder:null,
            stream:null,
        }
    },
    mounted() {
    },
    methods:{
        /**
         * 屏幕分享
         */
        start(){
            // 获取共享内容
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                // 摄像头
                // navigator.mediaDevices.getUserMedia({
                // 屏幕分享
                navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                }).then((stream) => {
                    this.stream = stream;
                    // 关闭流
                    stream.oninactive = ()=>{
                        // 清空流及停止录制
                        this.stream = null;
                        this.stop();
                    }
                    this.$nextTick(()=>{
                        document.querySelector('#player').srcObject = stream;
                    })
                }).catch((err) => {
                    console.error(err);
                })
            } else {
                alert('不支持这个特性');
            }
        },
        /**
         * 开始录制
         * @returns {null}
         */
        record(){
            if(!this.stream){return null}
            this.buf = [];
            // 约束视频格式
            const options = {
                mimeType: 'video/webm;codecs=vp8'
            }
            // 判断是否是支持的mimeType格式
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error('不支持的视频格式');
                return;
            }
            try {
                this.mediaRecorder = new MediaRecorder(this.stream, options);
                // 处理采集到的事件
                this.mediaRecorder.ondataavailable = (e)=> {
                    if (e && e.data && e.data.size > 0) {
                        // 存储到数组中
                        this.buf.push(e.data);
                    }
                };
                // 开始录制
                this.mediaRecorder.start(10);
            } catch (e) {
                console.error(e);
            }
        },
        /**
         * 停止录制
         * */
        stop(){
            if(this.stream) {
                this.stream.getTracks().forEach(MediaStreamTrack => {
                    MediaStreamTrack.stop()
                })
            }
            if (!this.mediaRecorder){return }
            if (this.mediaRecorder) {
                this.mediaRecorder.stop();
                this.mediaRecorder = null;
            }
        },
        /**
         * 下载视频
         */
        download(){
            if (this.buf.length) {
                this.$nextTick(()=>{
                    const blob = new Blob(this.buf, { type: 'video/MP4'});
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.style.display = 'none';
                    a.download = 'aaa.MP4';
                    a.click();
                })
            } else {
                alert('还没有录制任何内容');
            }
        },
    }
}
</script>

<style scoped lang="less">
.Home {
    #player{
        display: block;
        width: 500px;
    }
}
</style>