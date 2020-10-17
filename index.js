const http = require('http');
const Client = require('./Client');

// Packets
const UpgradePacket = require('./Packets/UpgradePacket');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
  });
  res.end('OK');
});

server.on('upgrade', (req, socket, head) => {
  const client = new Client(server, socket);

  client.send(new UpgradePacket(req.headers['sec-websocket-key']));
});

server.listen(1337, '127.0.0.1', () => {
  const { address, family, port } = server.address();

  console.log(
      'Server listening on [%s] %s:%s',
      family,
      address,
      port,
  );
});
