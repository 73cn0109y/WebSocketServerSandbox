const crypto = require('crypto');
const Packet = require('./Packet');

class UpgradePacket extends Packet {
  #key;

  constructor(key) {
    super();

    this.#key = key;
  }

  _generateAcceptValue(acceptKey) {
    return crypto.createHash('sha1')
                 .update(`${acceptKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, 'binary')
                 .digest('base64');
  }

  toBuffer() {
    // This packet should be sent as plain text
    return this.toString();
  }

  toString() {
    const responseHeaders = [
      'HTTP/1.1 101 Web Socket Protocol Handshake',
      'Upgrade: WebSocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${this._generateAcceptValue(this.#key)}`,
    ];

    return (responseHeaders.join('\r\n') + '\r\n\r\n');
  }
}

module.exports = UpgradePacket;
