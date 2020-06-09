# faceapi

> 人脸识别
<!-- 人脸识别 -->
## 安装
  ```
    npm install face-ca --save-dev
  ```
## 引入相关文件
  ```
  main.js:
      import face from 'face-ca'
      face.install(Vue,{
        msg:'Hellworld'
        ...参数
      })
  ```
## 使用
  ```
  .vue组件直接使用：
    <template>
      <div>
        <face :activename="activeName" :isrest='isRest' @restActive='restactive' @responseFun='responseFun' ></face>
      </div>
    </template>
    activename:控制人脸识别展示还是隐藏
    restActive：关闭人脸识别页面
    responseFun：该函数能拿到符合的截图，在该函数中调用接口进行其他数据处理
  ```
## 模型加载错误
   - 资源未加载到
   - 测试无效这里手动把/node_modules/face-ca/src/assets/文件夹下的数据复制到当目录下/static/

<!-- flexible -->
## 安装
```
npm install flexible --save
```
## 引用
  ```
  main.js:
    // 移动端适配
    import 'lib-flexible/flexible.js'
  ```
## vue组件中使用完整代码
```
<template>
  <div>
    {{ msg }}
    <face :activename="activeName" :isrest='isRest' @restActive='restactive' @responseFun='responseFun' ></face>
    <button id="facelogin" @click="faceLogin">人脸登录</button>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data() {
    return {
      msg: '',
      activeName: '',
      isRest:false
    };
  },
  methods: {
    // 进入人脸识别页面
    faceLogin() {
      this.activeName = 'active';
    },
    // 重置插件中的数据
    restactive(val){
      this.activeName = val
      this.isRest = false;
    },
    responseFun(data){
      // 活体检测后的图片
       console.log(data)
       setTimeout(()=>{
         this.isRest = true;
       },1000)
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>

```






## 开发环境测试
webpack.config.js  -> entry: './src/main.js'
## 打包
webpack.config.js  -> entry: './src/lib/index.js'

## 在index.html中使用
```
<div id="app">
    <face></face>
</div>
<script src="https://cdn.staticfile.org/vue/2.4.2/vue.min.js"></script>
<script src="./dist/face.js" type="module"></script>
```
For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).
