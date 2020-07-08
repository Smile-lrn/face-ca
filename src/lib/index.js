import Face from './face.vue' // 导入组件
var face = {};
face.install = function (Vue, options) {
    Vue.component('Face', Face)
    if (typeof window !== 'undefined' && window.Vue) {
        window.Vue.use(Face);
    }
}
export default face
