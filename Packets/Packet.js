class Packet {
  /**
   * Parse the buffer and try to convert it into a Packet
   *
   * @param {Buffer} buffer
   * @return {undefined|Packet}
   */
  static fromBuffer(buffer) {
    const firstByte = buffer.readUInt8(0);
    /*const isFinalFrame = Boolean((firstByte >>> 7) & 0x1);
    const [reserved1, reserved2, reserved3] = [
      Boolean((firstByte >>> 6) & 0x1),
      Boolean((firstByte >>> 5) & 0x1),
      Boolean((firstByte >>> 4) & 0x1),
    ];*/
    const opCode = (firstByte & 0xF);

    // Connection Termination Frame (Close)
    if (opCode === 0x8) {
      return new (require('./ClosePacket'));
    }

    // Discard non-text frames
    if (opCode !== 0x1) {
      return;
    }

    const secondByte = buffer.readUInt8(1);
    const isMasked = Boolean((secondByte >>> 7) & 0x1);

    let currentOffset = 2;
    let payloadLength = (secondByte & 0x7F);

    if (payloadLength > 125) {
      if (payloadLength === 126) {
        payloadLength = buffer.readUInt16BE(currentOffset);
        currentOffset += 2;
      } else {
        /*const leftPart = buffer.readUInt32BE(currentOffset);
        const rightPart = buffer.readUInt32BE(currentOffset += 4);*/

        throw new Error('Large payloads not currently implemented');
      }
    }

    let maskingKey;

    if (isMasked) {
      maskingKey = buffer.readUInt32BE(currentOffset);
      currentOffset += 4;
    }

    const data = Buffer.alloc(payloadLength);

    if (isMasked) {
      for (let i = 0, j = 0; i < payloadLength; i++, j = i % 4) {
        const shift = (j === 3 ? 0 : (3 - j << 3));
        const mask = ((shift === 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF);
        const source = buffer.readUInt8(currentOffset++);

        data.writeUInt8(mask ^ source, i);
      }
    } else {
      buffer.copy(data, 0, currentOffset++);
    }

    const plainData = data.toString('utf8');

    // Try to decode the Packet
    if ((plainData.startsWith('{') && plainData.endsWith('}')) ||
        (plainData.startsWith('[') && plainData.endsWith(']'))) {
      try {
        const parsedData = JSON.parse(plainData);
        const packet = new (require(`./${parsedData.t}`));

        for (const property of Object.getOwnPropertyNames(parsedData.d)) {
          packet[property] = parsedData.d[property];
        }

        return packet;
      } catch (error) {
        console.error('Error parsing packet:', error);
      }
    }

    throw new Error('Unknown packet');
  }

  /**
   * Convert this packet into a Buffer
   *
   * @return {Buffer}
   */
  toBuffer() {
    const data = this.toString();
    const byteLength = Buffer.byteLength(data);
    const lengthByteCount = (byteLength < 126 ? 0 : 2);
    const payloadLength = (lengthByteCount === 0 ? byteLength : 126);
    const buffer = Buffer.alloc(2 + lengthByteCount + byteLength);

    buffer.writeUInt8(0b10000001, 0);
    buffer.writeUInt8(payloadLength, 1);

    let payloadOffset = 2;

    if (lengthByteCount > 0) {
      buffer.writeUInt16BE(byteLength, 2);
      payloadOffset += lengthByteCount;
    }

    buffer.write(data, payloadOffset);

    return buffer;
  }

  toJSON() {
    const data = {};

    for (const property of Object.getOwnPropertyNames(this)) {
      data[property] = this[property];
    }

    return {
      t: this.constructor.name,
      d: data,
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

module.exports = Packet;
