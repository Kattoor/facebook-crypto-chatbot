const http = require('http');
const https = require('https');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        handleGet(req, res);
    } else if (req.method === 'POST') {
        handlePost(req, res);
    }
});

function handleGet(req, res) {
    const queryParams = extractQueryParameters(req.url);
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
}

function handlePost(req, res) {
    const binaryChunks = [];
    req.on('data', chunk => binaryChunks.push(chunk));
    req.on('end', () => {
        const postData = JSON.parse(Buffer.concat(binaryChunks).toString());
        if (postData.object === 'page') {
            postData.entry.forEach(entry => {
                const webhookEvent = entry.messaging[0];
                const senderPsid = webhookEvent.sender.id;
                if (webhookEvent.message)
                    handleMessage(senderPsid, webhookEvent.message.text);
            });
            res.writeHead(200);
            res.end('EVENT_RECEIVED');
        } else {
            res.writeHead(404);
            res.end();
        }
    });
}

function extractQueryParameters(url) {
    return url
        .split('?')[1]
        .split('&')
        .reduce((accumulatingObject, current) => {
            const keyValue = current.split('=');
            accumulatingObject[keyValue[0]] = keyValue[1];
            return accumulatingObject;
        }, {});
}

function handleMessage(senderPsid, message) {
    console.log('Message: ' + message + ' (' + senderPsid + ')');
    send(senderPsid, {text: "I've received the following message: " + message});
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

server.listen(4040);
