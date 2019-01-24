function isEqualObj(a, b) {
    // Create arrays of property names
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different, objects are not equivalent
    if (aProps.length !== bProps.length) {
        return false;
    }

    for (var i = 0, len = aProps.length; i < len; i++) {
        let propName = aProps[i];

        // If values of same property are not equal, objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects are considered equivalent
    return true;
}

function removeEmptyValues(obj) {
    let keys = Object.keys(obj);
    for( let i = 0; i < keys.length; i++) {
        let val = obj[keys[i]]
        if( val === '' || val === null || val === undefined) {
            delete obj[keys[i]]
        }
    }
}

function toTitleCase(str) {
    arr = str.toLowerCase().split(' ');
    arr = arr.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    return arr.join(' ');
}

module.exports = {
    isEqualObj,
    removeEmptyValues,
    toTitleCase,
};
