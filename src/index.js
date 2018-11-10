import apiWrap from './api-wrap';
export default function (config, pathConfig) {
    let api = apiWrap(config);
    // pathConfig = {
    //     apiname:'/api/path/xxx'
    // }
    // 可以这样方便调用
    // api.apiname(data).then
    if (pathConfig && typeof pathConfig === 'object') {
        Object.keys(pathConfig).forEach(key => {
            let path = pathConfig[key];
            api[key] = async (data, options)=> {
                return await api(path, data, options);
            };
            
        });
    }

    return api;
}
