const { NODE_URL, NODE_PORT } = process.env;
require('module-alias/register');

const http = require('http');

const app = require('./app');

const server = http.createServer(app);

server.listen(NODE_PORT, NODE_URL, () => {
  console.info(`${NODE_URL}:${NODE_PORT}`);
});
