const isEqualObj = (a, b) => {
    // Create arrays of property names
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different, objects are not equivalent
    if (aProps.length !== bProps.length) {
        return false;
    }

    for (var i = 0, len = aProps.length; i < len; i++) {
        const propName = aProps[i];

        // If values of same property are not equal, objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects are considered equivalent
    return true;
};

const removeEmptyValues = obj => {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const val = obj[keys[i]];
        if (val === '' || val === null || val === undefined) {
            delete obj[keys[i]];
        }
    }
    return obj;
};

const toTitleCase = str => {
    return String(str)
        .toLowerCase()
        .trim()
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
};

module.exports = {
    isEqualObj,
    removeEmptyValues,
    toTitleCase,
};
