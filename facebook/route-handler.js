const https = require('https');
const fs = require('fs');
const utils = require('../utils.js');
const dataContainer = require('../data-container.js');

exports.get = (req, res) => {
    const queryParams = utils.extractQueryParameters(req.url);
    const verifyToken = 'randomstuff';
    const mode = queryParams['hub.mode'];
    const token = queryParams['hub.verify_token'];
    const challenge = queryParams['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            res.writeHead(200);
            res.end(challenge);
        } else {
            res.writeHead(403);
            res.end();
        }
    }
};

exports.post = (req, res) => {
    const binaryChunks = [];
    req.on('data', chunk => binaryChunks.push(chunk));
    req.on('end', () => {
        const postData = JSON.parse(Buffer.concat(binaryChunks).toString());
        if (postData.object === 'page') {
            postData.entry.forEach(entry => {
                const webhookEvent = entry.messaging[0];
                const senderPsid = webhookEvent.sender.id;
                const message = webhookEvent.message;
                if (message.text)
                    handleMessage(senderPsid, message.text);
                else if (message.attachments) {
                    const attachment = message.attachments[0];
                    switch (attachment.type) {
                        case 'location':
                            handleLocation(senderPsid, attachment.payload.coordinates);
                            break;
                        default:
                            console.log("I don't support attachment type: " + attachment.type);
                            break;
                    }
                }
            });
            res.writeHead(200);
            res.end('EVENT_RECEIVED');
        } else {
            res.writeHead(404);
            res.end();
        }
    });
};

dataContainer.notifyMeOnVeloDataChange = data => {
    //todo: send to client?
};

function handleMessage(senderPsid, message) {
    console.log('Message: ' + message + ' (' + senderPsid + ')');
    send(senderPsid, {text: "I've received the following message: " + message});
}

function handleLocation(senderPsid, location) {
    const closestBikeCenter = getClosestBikeCenter(location);
    console.log('Id: ' + closestBikeCenter.id);
    console.log('Distance' + closestBikeCenter.distance);
    send(senderPsid, {text: `Closest to you is #${closestBikeCenter.id}`});
}

function getClosestBikeCenter(location) {
    return dataContainer.getVeloData().reduce((closest, current) => {
        const distance = getDistance(current, location);
        return !closest || distance < closest.distance
            ? Object.assign(current, {distance})
            : closest;
    });
}

function getDistance(position1, position2) {
    /* Haversine Formula - https://stackoverflow.com/a/1420059 */
    const earthRadius = 6371e3;
    const deltaLat = position2.lat - position1.lat;
    const deltaLon = position2.long - position1.lon;
    console.log('hi')
    console.log(position2.long);
    console.log(position1.lon);
    const a = Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(position1.lat) * Math.cos(position2.lat) * Math.pow(Math.sin(deltaLon / 2),2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function send(senderPsid, message) {
    const data = JSON.stringify({recipient: {id: senderPsid}, message});
    const options = {
        protocol: 'https:',
        host: 'graph.facebook.com',
        path: '/v2.6/me/messages?access_token=' + fs.readFileSync('../facebook-bot/accesstoken', 'utf-8'),
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)}
    };
    const request = https.request(options, res => {
        const binaryChunks = [];
        res.on('data', chunk => binaryChunks.push(chunk));
        res.on('end', () => console.log('Response: ' + Buffer.concat(binaryChunks).toString()));
    });
    request.write(data);
    request.end();
}
