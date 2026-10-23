// Web Serial Communication Handler for Arduino Uno
// IoE-Based Smart Security and Intelligent Monitoring System

class SerialManager {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.buffer = '';
    this.onDataCallback = null;
    this.onStatusChangeCallback = null;
  }

  // Check if Web Serial API is supported in current browser
  isSupported() {
    return 'serial' in navigator;
  }

  // Request port and connect
  async connect(baudRate = 9600) {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);

      // Setup writer
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      // Start read loop
      this.readLoop();
      return true;
    } catch (err) {
      console.error('Serial connection error:', err);
      this.isConnected = false;
      if (this.onStatusChangeCallback) this.onStatusChangeCallback(false, err.message);
      throw err;
    }
  }

  // Read incoming data stream from Arduino
  async readLoop() {
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          this.handleIncomingChunk(value);
        }
      }
    } catch (err) {
      console.warn('Serial read error:', err);
    } finally {
      this.disconnect();
    }
  }

  // Assemble line buffers and parse JSON
  handleIncomingChunk(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    // Keep the last incomplete fragment in buffer
    this.buffer = lines.pop();

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const data = JSON.parse(line);
        if (this.onDataCallback) {
          this.onDataCallback(data);
        }
      } catch (err) {
        // Line might be plain debug text from Arduino
        console.log('[Arduino Serial Text]', line);
      }
    }
  }

  // Send command string to Arduino
  async sendCommand(command) {
    if (!this.isConnected || !this.writer) {
      console.warn('Cannot send command; serial port is not connected.');
      return false;
    }
    try {
      await this.writer.write(command + '\n');
      return true;
    } catch (err) {
      console.error('Error sending serial command:', err);
      return false;
    }
  }

  // Disconnect port cleanly
  async disconnect() {
    this.isConnected = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (err) {
      console.warn('Error during serial close:', err);
    }
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(false);
    }
  }
}

window.serialManager = new SerialManager();
