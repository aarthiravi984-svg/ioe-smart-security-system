// Web Audio API Synthesizer for Local Security Siren & Buzzer Alerts
// Simulates the physical piezoelectric buzzer and audible alarm

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying = false;
  private isMuted = false;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isSirenPlaying) {
      this.stopSiren();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Play short confirmation beep (e.g. system armed)
  public playChirp(frequency = 1200, durationMs = 120) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  // Arming sequence sound
  public playArmSound() {
    this.playChirp(1000, 100);
    setTimeout(() => this.playChirp(1500, 150), 120);
  }

  // Disarming sequence sound
  public playDisarmSound() {
    this.playChirp(1200, 100);
    setTimeout(() => this.playChirp(700, 180), 120);
  }

  // Start continuous alarm siren (warble effect between 800Hz and 1400Hz)
  public startSiren() {
    if (this.isMuted || this.isSirenPlaying) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      this.sirenOsc = this.audioCtx.createOscillator();
      this.sirenGain = this.audioCtx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(800, this.audioCtx.currentTime);

      // LFO for frequency modulation warble
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(4, this.audioCtx.currentTime); // 4Hz modulation
      lfoGain.gain.setValueAtTime(300, this.audioCtx.currentTime); // +/- 300Hz

      lfo.connect(this.sirenOsc.frequency);
      lfo.start();

      this.sirenGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);

      this.sirenOsc.start();
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Error starting siren:', e);
    }
  }

  // Stop the alarm siren
  public stopSiren() {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenGain && this.audioCtx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      }
      setTimeout(() => {
        if (this.sirenOsc) {
          try {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
          } catch (_) {
            // ignore if already stopped
          }
          this.sirenOsc = null;
        }
        this.isSirenPlaying = false;
      }, 120);
    } catch (e) {
      this.isSirenPlaying = false;
    }
  }

  public getIsSirenActive(): boolean {
    return this.isSirenPlaying;
  }
}

export const audioAlertService = new AudioAlertService();
