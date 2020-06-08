import Vue from 'vue'
import App from './App.vue'
import 'lib-flexible/flexible.js'
import axios from 'axios';
import face from './lib/index.js'
Vue.prototype.$axios = axios;

Vue.use(face)
new Vue({
  el: '#app',
  render: h => h(App)
})
