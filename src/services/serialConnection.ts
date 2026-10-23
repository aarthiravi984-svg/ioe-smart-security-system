// Web Serial API Communication Service for Arduino Uno
// Handles hardware USB connection, packet assembly, JSON parsing, and commands

export interface SerialDataPacket {
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  distance?: number;
  alarm?: boolean;
  armed?: boolean;
  rawText?: string;
}

export type SerialStatusListener = (connected: boolean, message?: string) => void;
export type SerialDataListener = (data: SerialDataPacket) => void;
export type SerialRawListener = (text: string, direction: 'IN' | 'OUT') => void;

class SerialConnectionService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isConnected = false;
  private buffer = '';
  private statusListeners: SerialStatusListener[] = [];
  private dataListeners: SerialDataListener[] = [];
  private rawListeners: SerialRawListener[] = [];

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public onStatus(cb: SerialStatusListener): () => void {
    this.statusListeners.push(cb);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== cb);
    };
  }

  public onData(cb: SerialDataListener): () => void {
    this.dataListeners.push(cb);
    return () => {
      this.dataListeners = this.dataListeners.filter(l => l !== cb);
    };
  }

  public onRawLog(cb: SerialRawListener): () => void {
    this.rawListeners.push(cb);
    return () => {
      this.rawListeners = this.rawListeners.filter(l => l !== cb);
    };
  }

  private notifyStatus(connected: boolean, message?: string) {
    this.isConnected = connected;
    this.statusListeners.forEach(cb => cb(connected, message));
  }

  private notifyData(data: SerialDataPacket) {
    this.dataListeners.forEach(cb => cb(data));
  }

  private notifyRaw(text: string, dir: 'IN' | 'OUT') {
    this.rawListeners.forEach(cb => cb(text, dir));
  }

  // Connect to Arduino via Web Serial
  public async connect(baudRate = 9600): Promise<boolean> {
    if (!this.isSupported()) {
      const msg = 'Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.';
      this.notifyStatus(false, msg);
      throw new Error(msg);
    }

    try {
      // Request USB serial port from user
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      this.notifyStatus(true, `Connected to Arduino @ ${baudRate} baud`);

      // Set up output writer stream
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      // Begin background reader loop
      this.startReadLoop();
      return true;
    } catch (err: any) {
      console.error('Serial connection error:', err);
      this.notifyStatus(false, err.message || 'Failed to open serial port');
      throw err;
    }
  }

  private async startReadLoop() {
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.handleIncomingChunk(value);
        }
      }
    } catch (err: any) {
      console.warn('Serial reader exited:', err);
      this.notifyStatus(false, err.message);
    } finally {
      this.disconnect();
    }
  }

  private handleIncomingChunk(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete trailing fragment

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      this.notifyRaw(line, 'IN');

      // Attempt to parse structured JSON
      try {
        const parsed = JSON.parse(line);
        // Validate sensor payload
        const packet: SerialDataPacket = {};
        if (typeof parsed.temperature === 'number' && !isNaN(parsed.temperature)) {
          packet.temperature = Number(parsed.temperature.toFixed(1));
        }
        if (typeof parsed.humidity === 'number' && !isNaN(parsed.humidity)) {
          packet.humidity = Number(parsed.humidity.toFixed(1));
        }
        if (typeof parsed.distance === 'number' && !isNaN(parsed.distance)) {
          packet.distance = Number(parsed.distance.toFixed(1));
        }
        if (typeof parsed.motion === 'boolean') {
          packet.motion = parsed.motion;
        } else if (typeof parsed.motion === 'number') {
          packet.motion = parsed.motion === 1;
        }
        if (typeof parsed.alarm === 'boolean') {
          packet.alarm = parsed.alarm;
        }
        if (typeof parsed.armed === 'boolean') {
          packet.armed = parsed.armed;
        }

        packet.rawText = line;
        this.notifyData(packet);
      } catch (e) {
        // Not a JSON packet, could be debug string or startup text
        this.notifyData({ rawText: line });
      }
    }
  }

  // Send a control command string to Arduino
  public async sendCommand(cmd: string): Promise<boolean> {
    if (!this.isConnected || !this.writer) {
      return false;
    }
    try {
      await this.writer.write(cmd + '\n');
      this.notifyRaw(cmd, 'OUT');
      return true;
    } catch (err: any) {
      console.error('Failed to send serial command:', err);
      return false;
    }
  }

  // Disconnect serial port
  public async disconnect(): Promise<void> {
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
    } catch (e) {
      console.warn('Error during serial port cleanup:', e);
    }
    this.notifyStatus(false, 'Disconnected from serial port');
  }
}

export const serialConnection = new SerialConnectionService();
