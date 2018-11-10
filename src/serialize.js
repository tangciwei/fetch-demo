function typeUtil(obj) {
    function getType(obj){
        let str = Object.prototype.toString.call(obj);
        return str.split('object')[1].split(']')[0].trim().toLowerCase();
    } 
    return {
        isObject(){
            return getType(obj)==='object';
        },
        isArray(){
            return getType(obj)==='array';
        },
        getType
    }
}

let pushEncodedKeyValuePair = (pairs, key, val) => {
    let type = typeUtil(obj);
    if (val != null) {
        if (type.isArray()) {
            val.forEach(v => {
                pushEncodedKeyValuePair(pairs, key, v);
            });
        }
        else if (type.isObject()) {
            for (let subKey in val) {
                if (val.hasOwnProperty(subKey)) {
                    pushEncodedKeyValuePair(pairs, `${key}[${subKey}]`, val[subKey]);
                }

            }
        }
        else {
            pairs.push(''
                + encodeURIComponent(key)
                + '='
                + encodeURIComponent(val));
        }
    }
    else if (val === null) {
        pairs.push(encodeURIComponent(key));
    }

};

export default function (object) {
    if (!typeUtil(object).isObject()) {
        throw new Error('[error] 数据不是`Object`类型');
        return object;
    }
    let pairs = [];
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            pushEncodedKeyValuePair(pairs, key, object[key]);
        }
    }
    return pairs.join('&');
}
