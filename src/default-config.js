// 这里的config理解为业务中基本唯一,否则这里部分参数可以提取出来，放到内部函数参数中。
export default {
    method: 'post',
    type: 'json',
    timeout: 30 * 1000,
    // 错误处理
    errAction({
            path,
            input,
            err
        }) {
        // 可以有一些弹框提示，可以有日志记录
        // 根据err的类型，来判断是什么类型的错误
        console.log(JSON.stringify({
            path,
            input,
            err
        }));
    },
    // 超时处理
    timeoutAction({
            path,
            input
        }) {
        console.log(JSON.stringify({
            path,
            input,
            err
        }));
    }
}
