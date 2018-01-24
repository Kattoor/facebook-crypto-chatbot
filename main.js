const webhookServer = require('./facebook/webhook-server.js');
const veloPoller = require('./velo/velo-poller.js');
const dataContainer = require('./data-container.js');

veloPoller.startPolling(dataContainer.updateVeloData);

webhookServer.start();
