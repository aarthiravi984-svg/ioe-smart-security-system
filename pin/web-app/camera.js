// Camera & Real-Time Computer Vision Motion Detection Module
// IoE-Based Smart Security and Intelligent Monitoring System

class CameraManager {
  constructor() {
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.stream = null;
    this.isActive = false;
    this.lastFrameData = null;
    this.motionThreshold = 25; // Pixel change sensitivity
    this.motionPixelCountThreshold = 500; // Minimum changed pixels to trigger motion
    this.analysisInterval = null;
    this.onMotionDetected = null;
    this.onStatusChange = null;
    this.lastMotionTime = 0;
  }

  init(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    if (this.canvasElement) {
      this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    }
  }

  // Start webcam with explicit permission handling
  async startCamera(constraints = { video: { width: 640, height: 480, facingMode: 'user' } }) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }
      this.isActive = true;
      if (this.onStatusChange) this.onStatusChange(true);

      // Start frame differential computer vision analysis
      this.startMotionAnalysis();
      return true;
    } catch (err) {
      console.error('Camera access failed:', err);
      this.isActive = false;
      if (this.onStatusChange) this.onStatusChange(false, err.name + ': ' + err.message);
      throw err;
    }
  }

  // Stop camera stream cleanly
  stopCamera() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isActive = false;
    this.lastFrameData = null;
    if (this.onStatusChange) this.onStatusChange(false);
  }

  // Computer Vision: Frame Differencing Algorithm
  // Compares current grayscale pixels against previous frame to detect genuine motion
  startMotionAnalysis() {
    if (this.analysisInterval) clearInterval(this.analysisInterval);

    // Analyze every 150ms for low CPU usage and fast response
    this.analysisInterval = setInterval(() => {
      if (!this.isActive || !this.videoElement || !this.canvasElement || !this.ctx) return;
      if (this.videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      const width = 160;
      const height = 120;

      // Draw downsampled frame for lightweight CV processing
      this.ctx.drawImage(this.videoElement, 0, 0, width, height);
      const currentFrame = this.ctx.getImageData(0, 0, width, height);
      const data = currentFrame.data;

      if (!this.lastFrameData) {
        // First frame initialization
        this.lastFrameData = new Uint8ClampedArray(data);
        return;
      }

      let diffPixels = 0;
      let minX = width, minY = height, maxX = 0, maxY = 0;

      // Compare pixel luminance differences
      for (let i = 0; i < data.length; i += 4) {
        const curLuma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const prevLuma = 0.299 * this.lastFrameData[i] + 0.587 * this.lastFrameData[i + 1] + 0.114 * this.lastFrameData[i + 2];

        if (Math.abs(curLuma - prevLuma) > this.motionThreshold) {
          diffPixels++;
          const pixelIndex = i / 4;
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }

      // Save current frame for next comparison
      this.lastFrameData.set(data);

      const motionScore = (diffPixels / (width * height)) * 100;
      const hasMotion = diffPixels > 250; // Threshold of changed pixels

      if (hasMotion) {
        const now = Date.now();
        // Cooldown between event triggers (1.5 seconds)
        if (now - this.lastMotionTime > 1500) {
          this.lastMotionTime = now;
          if (this.onMotionDetected) {
            this.onMotionDetected({
              motionScore: motionScore.toFixed(1),
              diffPixels,
              boundingBox: { minX, minY, maxX, maxY },
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }, 150);
  }

  // Capture current video frame as base64 JPEG snapshot for security incident logs
  captureSnapshot() {
    if (!this.videoElement || !this.isActive) return null;
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.videoElement.videoWidth || 640;
    snapCanvas.height = this.videoElement.videoHeight || 480;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(this.videoElement, 0, 0, snapCanvas.width, snapCanvas.height);
    return snapCanvas.toDataURL('image/jpeg', 0.8);
  }
}

window.cameraManager = new CameraManager();
