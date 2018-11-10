import apiWrap from '../../src';
let api = apiWrap({}, {
    name: '/api'
});

api.name({
    key: 'value'
})
    .then(res => {
        console.log(res);
    })
    .cache(e => {
        console.log(e);
    });
