<!-- home -->
<template>
  <div>
    <div :class="'app-container '+activename">
      <div class="warpper">
        <div class="btnBox">
          <div class="left" @click="closeFaceBox">
            <img src="/src/assets/imgs/close.svg" alt srcset />
          </div>
          <!-- <div class="right" @click="changeVoice">
                <img src="../assets/imgs/openvoice.svg" alt="" srcset="" v-if="voiceFlag">
                <img src="../assets/imgs/closevoice.svg" alt="" srcset="" v-else>
          </div>-->
        </div>
        <!-- 提示信息 -->
        <p class="tip">{{tipTxt}}</p>
        <div class="photoBox">
          <video
            @play="onPlay($event)"
            ref="myVideo"
            id="myVideo"
            preload="auto"
            loop
            playsinline
            muted
            autoplay
            webkit-playsinline="true"
            v-show="!isOpenMouth"
          ></video>
          <canvas id="overlay" ref="overlay" v-show="!isOpenMouth"></canvas>
          <span id="hoverTxt" :class="hovertxt?'active':''"  v-show="!isOpenMouth">{{hovertxt}}</span>
        </div>
        <div style="display:none;">
          <img :src="imgSrc" alt class="imgSrc" />
          <!-- <img :src="firstfaceImg" alt="" srcset=""> -->
        </div>
        <div class="safeBox">
            <img src="../assets/imgs/safe.png" alt="" srcset=""><span>信息已加密,仅用于身份认证</span>
        </div>
      </div>
    </div>
    <!-- <button id="facelogin" @click="faceLogin">人脸登录</button> -->
  </div>
</template>

<script>
// 请求接口
import * as faceapi from "face-api.js";
// import closeImg  from  '/src/assets/imgs/close.svg';
// import safeImg  from  '/src/assets/imgs/safe.svg';
export default {
  name: "Face",
  props: ["activename",'isrest'],
  computed:{
    isreset(){
      return this.isrest;
    },
  },
  watch:{
    isreset:function(){
      this.isreset?this.resetFun():''
    }
  },
  data() {
    return {
      hovertxt:'',
      // activeName: "",
      voiceFlag: true, //静音
      tipTxt: "模型初始化中...",
      vid: "",
      vid_width: 200,
      vid_height: 200,
      overlay: "",
      palyFlag: false,
      isOpenMouth: false, // 张嘴是否通过
      isTwinkle: false, // 眨眼是否通过
      last_mouth_distance: 0, // 上一次嘴巴张开的高度
      imgSrc: "", // 截图
      mouthNum: 0, // 张嘴次数
      last_nose_distance_y: 0, // 上一次鼻子的垂直坐标
      last_nose_distance_x: 0, // 上一次鼻子的水平坐标
      lastTime: 0, // 时间因素
      last_DIF: 0, // 记录上一次左右两边距离差值
      first_outline_l: [], // 存储每次识别到人脸时左轮廓线中间点距离鼻点的距离
      first_outline_r: [], // 存储每次识别到人脸时右轮廓线中间点距离鼻点的距离
      counter: 0, // 向左或向右的次数,
      last_nose_left: 0,
      last_nose_top: 0,
      last_dis_eye_norse: 0,
      firstfaceImg: "",
      getPhotoNum: 0 //调取getPhotoNum的次数
    };
  },
  mounted() {
    var that = this;
    this.vid = this.$refs.myVideo;
    this.vid_width = this.$refs.myVideo.width;
    this.vid_height = this.$refs.myVideo.height;
    this.overlay = this.$refs.overlay;
    this.overlayCC = this.$refs.overlay.getContext("2d");
    this.initFun();
    console.log(this.activename+'-------------'+this.isrest)
  },
  created() {},
  methods: {
    faceLogin() {
      this.activeName = "active";
      this.resetFun();
    },
    //   静音
    changeVoice() {
      this.voiceFlag = !this.voiceFlag;
      // var gamemuiscs1 = new Audio("../../static/audio/"+this.valueOpt);
      // gamemuiscs1.play();
    },
    //   关闭页面
    closeFaceBox() {
      this.$emit('restActive','')
    },
    // 初始化
    initFun: async function(input) {
      const video = this.vid;
      const canvas = this.overlay;
      // 加载神经网络模型
      Promise.all([
        // 加载我想要使用的模型 同时对应的json文件和shard文件要处在同一目录 不然读取的时候可能读取不到。当你读取不到的时候你可能会报 SyntaxError: Unexpected token < in JSON at position 0。这点略坑
        faceapi.nets.tinyFaceDetector.loadFromUri("/src/assets/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/src/assets/models"),
        // faceapi.nets.faceRecognitionNet.loadFromUri("../../static/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/src/assets/models")
      ]).then(
        () => {
          this.tipTxt = "模型加载成功，正在检测人脸";
          navigator.getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
          navigator.getUserMedia(
            { video: {} },
            stream => {
              video.srcObject = stream;
              this.palyFlag = true;
            },
            err => {
              this.palyFlag = false;
              console.error(err);
            }
          );
        },
        () => {
          this.tipTxt = "模型加载错误，即将重试";
          this.initFun();
        }
      ); // 载入成功之后唤醒摄像头
    },
    onPlay: async function(event) {
      var that = this;
      const video = this.vid;
      const canvas = this.overlay;
      const vid_width = document.querySelector("#myVideo").videoWidth || 200;
      const vid_height = document.querySelector("#myVideo").videoHeight || 200;
      if (this.vid.paused || this.vid.ended || !this.palyFlag) {
        return setTimeout(() => this.onPlay());
      }
      const displaySize = { width: vid_width, height: vid_height }; // 这部分的大小是等同video的大小的
      faceapi.matchDimensions(canvas, displaySize); // 声明大小
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 128 })
        )
        .withFaceLandmarks()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      if (resizedDetections.length == 0) {
        this.hovertxt = "未检测到人脸";
        // return
      } else {
        // console.log(resizedDetections[0].alignedRect.relativeBox.bottom)
        // 限定人脸在圆框中展示的位置
        if (
          resizedDetections[0].alignedRect.relativeBox.top > 0.55 ||
          resizedDetections[0].alignedRect.relativeBox.left < 0.2 ||
          resizedDetections[0].alignedRect.relativeBox.right > 0.8 ||
          resizedDetections[0].alignedRect.relativeBox.bottom > 0.98
        ) {
          this.hovertxt = "请将脸对正中间";
        } else {
          if (this.getPhotoNum == 0) {
            this.getPhoto();
          }
          this.hovertxt = "请张张嘴巴";
          const landmarks = resizedDetections[0].landmarks;
          const landmarkPositions = landmarks.positions;
          // 或者得到各个轮廓的位置，
          // 仅适用于68点面部标记(FaceLandmarks68)
          // const jawOutline = landmarks.getJawOutline()
          // const nose = landmarks.getNose()
          // const mouth = landmarks.getMouth()
          // const leftEye = landmarks.getLeftEye()
          // const rightEye = landmarks.getRightEye()
          // const leftEyeBbrow = landmarks.getLeftEyeBrow()
          // const rightEyeBrow = landmarks.getRightEyeBrow()
          if (!this.isOpenMouth) {
            // 张张嘴判断
            this.openMouth(landmarkPositions);
            // 摇头
            // this.shakeHead(landmarkPositions)
            // 眨眼睛
            // this.twinkle(landmarkPositions)
          }
          //  if (!this.isTwinkle) {
          //     this.twinkle(landmarkPositions);
          // }
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }
      if (this.isOpenMouth) {
        // 截图
        this.getPhoto();
      } else {
        setTimeout(() => this.onPlay());
      }
    },
    // 张嘴判断
    openMouth: function(positions) {
      // 63:上嘴唇底部中间点 67：下嘴唇顶部中间点
      var mouth_distance = positions[67].y - positions[63].y;
      var nose_distance_y = positions[31].y;
      var nose_distance_x = positions[31].x;
      // console.log(Math.abs(nose_distance_x-this.last_nose_distance_x))
      if (
        Math.abs(nose_distance_y - this.last_nose_distance_y) > 3 &&
        Math.abs(this.last_nose_distance_x - nose_distance_x) > 4
      ) {
        this.hovertxt = "请保持头部不要晃动";
      } else {
        this.hovertxt = "请张张嘴巴";
      }
      this.last_nose_distance_y = nose_distance_y;
      this.last_nose_distance_x = nose_distance_x;
      if (
        this.last_mouth_distance > 0 &&
        mouth_distance > 0 &&
        Math.abs(this.last_mouth_distance - mouth_distance) > 6 &&
        Math.abs(this.last_nose_distance_y - nose_distance_y) < 0.6 &&
        Math.abs(this.last_nose_distance_x - nose_distance_x) < 0.6
      ) {
        // this.tipTxt='张嘴通过请再眨下眼睛'
        this.mouthNum++;
        if (this.mouthNum > 2) {
          console.log("张嘴通过");
          this.tipTxt = "验证中，请稍等...";
          this.isOpenMouth = true;
          this.last_mouth_distance = 0;
          this.mouthNum = 0;
        }
      }
      this.last_mouth_distance = mouth_distance;
    },
    // 截取视频中符合条件的图片
    getPhoto: function() {
      this.getPhotoNum++;
      this.overlayCC.clearRect(0, 0, this.overlay.width, this.overlay.height);
      this.overlayCC.drawImage(
        this.vid,
        0,
        0,
        this.overlay.width,
        this.overlay.height
      );
      // let dataUrl = overlay.toDataURL('image/jpeg', 1);
      // imgbase64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      var snapData = this.overlay.toDataURL("image/png");
      var imgSrc = "data:image/png;" + snapData;
      if (this.getPhotoNum == 1) {
        this.firstfaceImg = imgSrc;
      } else {
        this.imgSrc = imgSrc;
        this.$emit('responseFun',imgSrc)
      }

      // 把该图片数据传给后端  做相关校验
    },
    // 判断摇头
    shakeHead: function(positions) {
      if (positions.length == 0) {
        return;
      }
      // 指定时间段内收集参数
      if (
        this.lastTime == 0 ||
        (new Date().getTime() - this.lastTime > 500 &&
          new Date().getTime() - this.lastTime < 10000)
      ) {
        // console.log(positions[62][0])
        // 计算鼻尖和左边轮廓线中间点的水平差值
        var l_diff_x = positions[31].x - positions[2].x;
        // 计算鼻尖和左边轮廓线中间点的垂直差值
        var l_diff_y = positions[31].y - positions[2].y;
        // 计算鼻尖点与左边轮廓线中间点的距离
        var l_distance = Math.pow(
          l_diff_x * l_diff_x + l_diff_y * l_diff_y,
          0.5
        );
        // 计算鼻尖和右边轮廓线中间点的水平差值
        var r_diff_x = positions[16].x - positions[31].x;
        // 计算鼻尖点和右边轮廓线中间点的垂直差值
        var r_diff_y = positions[16].y - positions[31].y;
        // 计算鼻尖与右边轮廓线中间点的距离
        var r_distance = Math.pow(
          r_diff_x * r_diff_x + r_diff_y * r_diff_y,
          0.5
        );
        // 计算出左右轮廓线中间点的水平差值
        var lr_diff_x = positions[16].x - positions[2].x;
        // 计算出左右轮廓线中间点的垂直差值
        var lr_diff_y = positions[16].y - positions[2].y;
        // 计算出左右轮廓线两中间点的直线距离
        var lr_distance = Math.pow(
          lr_diff_x * lr_diff_x + lr_diff_y * lr_diff_y,
          0.5
        );
        // 计算出左右两轮廓线中间点距离鼻尖的差值
        // 向左扭头l_distance < r_distance;
        // 向右扭头l_distance > r_distance;
        // var DIF = Math.abs( l_distance - r_distance);
        this.first_outline_l.push(l_distance);
        this.first_outline_r.push(r_distance);
        // 验证是否摇头
        if (
          (l_distance > r_distance &&
            Math.abs(l_distance - this.first_outline_l[0]) > 20 &&
            Math.abs(r_distance - this.first_outline_r[0]) > 30) ||
          (l_distance < r_distance &&
            Math.abs(l_distance - this.first_outline_l[0]) > 30 &&
            Math.abs(r_distance - this.first_outline_r[0]) > 50)
        ) {
          this.counter++;
        }
        if (this.counter > 1) {
          console.log("摇头已验证通过");
          this.getPhoto();
          this.counter = 0;
          this.first_outline_l = [];
          this.first_outline_r = [];
        }
        // 重置时间因素 记录当前数据为上一次的记录
        // this.last_DIF = DIF;
        this.lastTime = new Date().getTime();
      }
    },
    // 判断眨眼
    twinkle: function(positions) {
      // 38,39左眼皮上方两个点    42，41左眼皮下方两个点
      // 44,45右眼皮上方两个点    48，47右眼皮下方两个点
      // 计算左眼睛上下中间的距离
      // let l_eye_distance_1 =  positions[38].y - positions[42].y;
      // let l_eye_distance_2 =  positions[39].y - positions[41].y;
      // let r_eye_distance_1 =  positions[48].y - positions[44].y;
      // let r_eye_distance_2 =  positions[47].y - positions[45].y;
      // console.log(l_eye_distance_1,l_eye_distance_2,r_eye_distance_1,r_eye_distance_2)
      if (positions.length == 0) {
        return;
      }
      if (this.lastTime == 0 || new Date().getTime() - this.lastTime > 10) {
        var xdiff1 = positions[31].x - positions[38].x;
        var ydiff1 = positions[31].y - positions[38].y;
        // 计算出做左眼睛上眼皮某点距离鼻尖的距离
        var dis_eye_norse1 = Math.pow(xdiff1 * xdiff1 + ydiff1 * ydiff1, 0.5);
        var xdiff2 = positions[31].x - positions[45].x;
        var ydiff2 = positions[31].y - positions[45].y;
        // 计算出做左眼睛上眼皮某间点距离鼻尖的距离
        var dis_eye_norse2 = Math.pow(xdiff2 * xdiff2 + ydiff2 * ydiff2, 0.5);
        // 计算出左右两个眼睛距离同一处鼻尖的距离之和
        var dis_eye_norse = dis_eye_norse1 + dis_eye_norse2;
        // console.log(Math.abs(dis_eye_norse, this.last_dis_eye_norse));
        if (
          Math.abs(positions[31].x - this.last_nose_left) < 0.5 &&
          Math.abs(positions[31].y - this.last_nose_top) < 0.5
        ) {
          // if ((Math.abs(dis_eye_norse - this.last_dis_eye_norse) > 0.8)) {
          if (ydiff1 > 1000) {
            alert("眼睛验证通过");
            this.getPhoto();
            this.last_nose_left = 0;
            this.last_nose_top = 0;
            this.last_dis_eye_norse = 0;
            this.lastTime = 0;
            this.isTwinkle = true;
          }
        }
        this.last_nose_left = positions[31].x;
        this.last_nose_top = positions[31].y;
        this.last_dis_eye_norse = dis_eye_norse;
        this.lastTime = new Date().getTime();
      }
    },
    resetFun() {
      this.last_nose_distance_y = 0;
      this.last_nose_distance_x = 0;
      this.last_mouth_distance = 0;
      this.last_nose_left = 0;
      this.last_nose_top = 0;
      this.last_dis_eye_norse = 0;
      this.lastTime = 0;
      this.isTwinkle = false;
      this.isOpenMouth = false;
      this.first_outline_l = [];
      this.first_outline_r = [];
      this.mouthNum = 0;
      this.firstfaceImg = "";
      this.imgSrc = "";
      if(document.querySelector("#imgSrc")){
         document.querySelector("#imgSrc").setAttribute("src", "");
      }
      this.getPhotoNum = 0;
      this.onPlay();
    },
  }
};
</script>
<style lang="scss" scoped>
$unitSize: 1/37.5;
* {
  margin: 0;
  padding: 0;
}
#facelogin{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 60px;
    background: deepskyblue;
    border: 1px solid #ebebeb;
    color: #fff;
    font-size: 16px;
    letter-spacing: 4px;
    border-radius: 8px;
    margin: auto;
    margin-top: 40%;
    cursor: pointer;
}
.app-container {
  background: #fff;
  height: 100vh;
  box-sizing: border-box;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  display: none;
  &.active {
    display: block;
  }
  .warpper {
    width: 100%;
    height: 100%;
    display: flex;
    box-sizing: border-box;
    // padding-top: 30px;
    flex-direction: column;
    // justify-content: center;
    align-items: center;
    // background: rgba(0, 0, 0, 0.6);
    .btnBox {
      width: 100%;
      height: 1.875rem;
      display: flex;
      margin-bottom: 0.625rem;
      padding-left: 0.625rem;
      padding-top: 0.625rem;
      box-sizing: border-box;
      img {
        cursor: pointer;
        width: 0.575rem;
        height: 0.575rem;
      }
      .right img {
        width: 27rem * $unitSize;
        height: 27rem * $unitSize;
      }
    }
    .tip {
      font-size: 0.4625rem;
      color:#333;
      margin-bottom: 1.25rem;
      height: 0.625rem;
    }
    .photoBox {
      width:5.625rem;
      height:5.625rem;
      border-radius: 50%;
      /* border: 2px dashed red; */
      box-shadow: 0 0 10px rgba(0,0,0,.2);
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      margin-bottom: 0.9375rem;
      background: url(/src/assets/imgs/circlebg.png) no-repeat;
      background-size: cover;
      video,
      canvas {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      #hoverTxt{
        display: flex;
        position: absolute;
        width: 100%;
        height: 1.5rem;
        color:#fff;
        background: rgba(0,0,0,.6);
        justify-content: center;
        align-items: center;
        font-size: 0.4rem;
        top: -1.5rem;
        transition: 0.2s;
        -webkit-transition:0.2s;
        -moz-transition:0.2s;
        -ms-transition:0.2s;
        -o-transition:0.2s;
        &.active{
          top: 0 !important;
          transition: 0.2s;
          -webkit-transition: 0.2s;
          -moz-transition: 0.2s;
          -ms-transition: 0.2s;
          -o-transition: 0.2s;
        }
      }
    }
    .imgSrc {
      width: 6.25rem;
      height: auto;
    }
    .safeBox{
      display: flex;
      align-items: center;
      font-size: 0.3rem;
      color: #999;
      img{
        width: 0.5rem;
        height: 0.5rem;
        margin-right: 10px;
      }
    }
  }
}
</style>
