const http = require('http');

const router = require('../facebook/router.js');
const routeHandler = require('../facebook/route-handler.js');

const server = http.createServer(router(routeHandler));

exports.start = () => server.listen(4040);