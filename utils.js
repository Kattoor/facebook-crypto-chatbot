exports.extractQueryParameters = url => {
    return url
        .split('?')[1]
        .split('&')
        .reduce((accumulatingObject, current) => {
            const keyValue = current.split('=');
            accumulatingObject[keyValue[0]] = keyValue[1];
            return accumulatingObject;
        }, {});
};
