const Packet = require('./Packets/Packet');

// Packets
const WelcomePacket = require('./Packets/WelcomePacket');
const ClosePacket = require('./Packets/ClosePacket');

class Client {
  #server;
  #socket;

  constructor(server, socket) {
    this.#server = server;
    this.#socket = socket;

    this.#socket.on('data', this._parseMessage.bind(this));
  }

  send(packet) {
    if (!(packet instanceof Packet)) {
      throw new Error('Argument "packet" MUST be an instance of "Packet"');
    }

    this.#socket.write(packet.toBuffer());
  }

  _parseMessage(buffer) {
    const packet = Packet.fromBuffer(buffer);

    switch (packet.constructor) {
      case WelcomePacket:
        return this.send(new WelcomePacket);
      case ClosePacket:
        return;
    }
  }
}

module.exports = Client;
