const veloData = [];
const veloDataSubscribers = [];

exports.updateVeloData = data => {
    veloData.length = 0;
    veloData.push(...data);
    veloDataSubscribers.forEach(callback => callback(data));
};

exports.getVeloData = () => JSON.parse(JSON.stringify(veloData));

exports.notifyMeOnVeloDataChange = veloDataSubscribers.push;
