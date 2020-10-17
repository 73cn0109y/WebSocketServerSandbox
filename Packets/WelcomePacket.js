const Packet = require('./Packet');

class WelcomePacket extends Packet {
  message;

  constructor(message = 'Welcome :)') {
    super();

    this.message = message;
  }
}

module.exports = WelcomePacket;
