import './axiosConfig'
import Face from './face.vue' // 导入组件
var face = {};
face.install = function (Vue, options) {
    Vue.component('Face', Face)
    if (typeof window !== 'undefined' && window.Vue) {
        window.Vue.use(Face);
    }
    // 截图传给后端接口的错误回调函数
    Vue.prototype.axiosError = function (data) {
        // 逻辑...
        console.log('请求出错处理函数')
    }
    // 截图传给后端接口的成功回调函数
    Vue.prototype.axiosSuccess = function (err) {
        // 逻辑...
        console.log('请求成功处理函数')
    }
}
export default face