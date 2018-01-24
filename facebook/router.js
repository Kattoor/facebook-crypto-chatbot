module.exports = routeHandler => (req, res) => {
    if (req.url === '/hi')
        res.end('hi');
    else if (req.url === '/favicon.ico')
        res.end('hi');
    else if (req.method === 'GET')
        routeHandler.get(req, res);
    else if (req.method === 'POST')
        routeHandler.post(req, res);
};
