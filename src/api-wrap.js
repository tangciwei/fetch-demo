import queryString from 'query-string';
import serialize from './serialize';
import defaultConfig from './default-config';

export default function apiWrap(config = {}) {
    config = Object.assign({}, defaultConfig, config);

    let {
        method,
        type,
        timeout
    } = config;
    // formdata or json格式
    type = type.toLowerCase();
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (type === 'formdata') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    // 给后端的格式
    let input = {
        method,
        headers,
        timeout,
        body: '' // 待传入
    };
    function generateBody(data = {}) {
        if (type === 'formdata') {
            return serialize(data);
        }
        else {
            return queryString.stringify(data);
        }
    }

    // 请求状态
    const INIT = 0;
    const ING = 1;
    const SUCCESS = 2;
    const FAIL = 3;
    // 缓存请求结果
    let cacheResult = {
        // 结构如下
        // [key]:{
        //     status: SUCCESS,
        //     err: 请求不成功，例如超时，抛出错误等。
        //     后端返回的值
        //     result: {
        //         err: 0,
        //         data: {
        //             aa:1
        //         }
        //     }
        // }
    };
    // 定义一个简单的观察者
    let observe = {
        obj: {},
        once(key, callback) {
            if (!observe.obj[key]) {
                observe.obj[key] = [];
            }

            observe.obj[key].push(callback);
        },
        notify(key, option) {
            let list = observe.obj[key];
            if (list && list.length > 0) {
                let {err, data} = option;
                list.forEach(fn => {
                    fn.call(null, err, data);
                });
                delete observe.obj[key];
            }

        }
    };

    return function (path, data = {}, options = {}) {
        let defaultOptions = {
            // true: 开启缓存，复用第一次请求的结果；
            // false: 每次调用都发请求，不过已有请求正在发送时，不会再发送。
            // 对于需要轮询的接口，这里需要设置为false
            useCache: true,
            // true: 如果第一个请求失败后，后续请求依然使用这个错误的结果。
            useErrResult: true
        };
        options = Object.assign({}, defaultOptions, options);

        let body = generateBody(data);
        input.body = body;
        // 缓存的key值
        let key = path + '__' + body;

        if (cacheResult[key]) {
            let {
                fetchStatus,
                result,
                err
            } = cacheResult[key];
            // 已经有另外一个接口正在发送请求了
            if (fetchStatus === ING) {
                return new Promise((resolve, reject) => {
                    // 订阅，只要另一个接口完毕后，触发这里的回调
                    observe.once(key, () => {
                        let {err, result} = cacheResult[key];
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                });
            }
            else if (fetchStatus === SUCCESS) {
                if (options.useCache) {
                    // 用缓存数据
                    return Promise.resolve(cacheResult[key].result);
                }
            }
            else if (fetchStatus === FAIL) {
                // 第一个请求结果失败了，后面再次调用时
                // 这里是应该用缓存数据，还是应该再次发请求,值得商榷
                // 这里用的是缓存数据
                if (options.useCache && options.useErrResult) {
                    return Promise.reject(err);
                }
            }
        }
        else {
            cacheResult[key] = {
                // init,ing,success,fail;
                fetchStatus: INIT,
                err: null,
                result: null
            };
        }
        // 真正发请求
        return new Promise((resolve, reject) => {
            function resolveAction(data) {
                cacheResult[key].fetchStatus = SUCCESS;
                cacheResult[key].err = null;
                cacheResult[key].result = data;
                resolve(data);
                observe.notify(key, {
                    err: null,
                    data
                });
            }
            function rejectAction(err) {
                cacheResult[key].fetchStatus = FAIL;
                cacheResult[key].err = err;
                cacheResult[key].result = null;
                reject(err);
                observe.notify(key, {
                    err,
                    data: null
                });
            }

            // 超时逻辑
            let timer = setTimeout(() => {
                clearTimeout(timer);
                // 超时处理
                config.timeoutAction({path, input});
                rejectAction({
                    path,
                    input
                });
            }, timeout);

            fetch(path, input).then((res) => {
                clearTimeout(timer);
                resolveAction(res);
            }).catch(e => {
                // 没有超时，进行统一的错误处理
                if (timer) {
                    clearTimeout(timer);
                    // 统一错误处理
                    config.errAction({path, input, e});
                    rejectAction({path, input, e});
                }

                // 否则已进行过超时处理，不需要再做什么。
            });
        });
    };
}
