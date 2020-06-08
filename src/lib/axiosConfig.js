import Vue from 'vue';
import axios from 'axios';
// axios.defaults.baseURL = 'http://www.huahuala.art/';
axios.defaults.baseURL = 'http://localhost:8081';
axios.defaults.headers['Content-Type'] = 'application/json; charset=utf-8';
// sessionStorage.getItem('token')?axios.defaults.headers.common['Authorization'] = sessionStorage.getItem('token'):'';
// todo 连调时放开第9行注释; 
// sessionStorage.getItem('token')?axios.defaults.headers.common['qnquerystring'] = sessionStorage.getItem('token'):'';

// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
let pending = []; //声明一个数组用于存储每个ajax请求的取消函数和ajax标识
let cancelToken = axios.CancelToken;
let removePending = (ever) => {
    for (let p in pending) {
        if (pending[p].u === ever.url + '&' + ever.method) { //当当前请求在数组中存在时执行函数体
            pending[p].f(); //执行取消操作
            pending.splice(p, 1); //把这条记录从数组中移除
        }
    }
}
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
    config && removePending(config); //在一个ajax发送前执行一下取消操作
    config.cancelToken = new cancelToken((c) => {
        // 这里的ajax标识我是用请求地址&请求方式拼接的字符串，当然你可以选择其他的一些方式
        pending.push({ u: config.url + '&' + config.method, f: c });
    });
    // 在发送请求之前做些什么
    if (sessionStorage.getItem('code') == '700') {
        // errCodeFun(700)
    } else {
        return config
    }
}, function (error) {
    console.log('preerror', error);
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    console.log(response)
    // 对响应数据做点什么
    removePending(response.config);  //在一个ajax响应后再执行一下取消操作，把已经完成的请求从pending中移除

    if (!response.data) {
        return;
    }
    sessionStorage.setItem('code', response.data.result)
    if (response.data.result != 100) {
        errCodeFun(response.data.result, response.data.message)
    } else {
        return response.data;
    }
}, function (error) {
    console.log('aftererror', error);
    // errCodeFun('error');
    // 对响应错误做点什么
    return Promise.reject(error);
});
// 重新登录弹窗
function errCodeFun(code, msg) {
    // switch (code) {
    //     case 700:
    //         MessageBox({
    //             showCancelButton: true,
    //             confirmButtonText: '重新登录',
    //             cancelButtonText: '取消',
    //             type: 'warning',
    //             dangerouslyUseHTMLString: true,
    //             closeOnHashChange: true,
    //             message: '检测到会话失效，是否重新登录？',
    //             title: '重新登录',
    //         })
    //             .then(() => {
    //                 sessionStorage.removeItem('code');
    //                 router.push({
    //                     path: '/login'
    //                 });
    //             })
    //             .catch(() => {
    //             });
    //         break;
    //     case 'error':
    //         MessageBox({
    //             message: '接口500',
    //             showConfirmButton: false,
    //             showClose: true,
    //             title: '快递助手',
    //             type: "warning"
    //         })
    //         break;
    //     default:
    //         MessageBox({
    //             message: code + msg,
    //             showConfirmButton: false,
    //             showClose: true,
    //             title: '快递助手',
    //             type: "warning"
    //         })
    // }
}
Vue.prototype.axios = axios;