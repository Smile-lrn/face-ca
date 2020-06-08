import './axiosConfig'
import Face from './face.vue' // 导入组件
var face = {};
face.install = function (Vue, options) {
    Vue.component('Face', Face)
    if (typeof window !== 'undefined' && window.Vue) {
        window.Vue.use(Face);
    }
    // 4. 添加事例方法
    Vue.prototype.axiosError = function (param) {
        // 逻辑...
        console.log('请求出错处理函数')
    }
    Vue.prototype.axiosSuccess = function (param) {
        // 逻辑...
        console.log('请求成功处理函数')
    }
    // 区别项目
    Vue.prototype.projectTag = 'prohect_1';
    Vue.prototype.proConfig = function () { 
        if (this.projectTag == 'prohect_1') {
            return {
                title: '项目1-人脸识别',
                baseUrl: 'https://test.xxx.com', // 测试项目地址
                baseApi: 'https://test.xxx.com/api', // 测试api请求
                $cdn: 'https://imgs.solui.cn'
            }
        }
    };
}
export default face