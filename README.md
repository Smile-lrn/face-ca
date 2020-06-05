# faceapi

> 人脸识别

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
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
