const https = require('https');

const url = 'https://www.velo-antwerpen.be/availability_map/getJsonObject';

function getVeloData(callback) {
    https.get(url, res => {
        const binaryChunks = [];
        res.on('data', chunk => binaryChunks.push(chunk));
        res.on('end', () => callback && callback(JSON.parse(Buffer.concat(binaryChunks).toString())));
    });
}

exports.startPolling = callback => {
    getVeloData(callback);
    setInterval(() => getVeloData(callback), 10000);
};
