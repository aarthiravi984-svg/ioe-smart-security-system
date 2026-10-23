import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Download, 
  AlertCircle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface CameraFeedProps {
  onMotionDetected: (snapshotDataUrl: string, motionScore: number) => void;
  isArmed: boolean;
  onCameraStatusChange: (active: boolean) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onMotionDetected,
  isArmed,
  onCameraStatusChange
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(30); // 10 (most sensitive) to 60 (least)
  const [motionPercent, setMotionPercent] = useState<number>(0);
  const [isMotionTriggered, setIsMotionTriggered] = useState(false);
  const [useSimulatedFeed, setUseSimulatedFeed] = useState(false);
  const [lastCaptureUrl, setLastCaptureUrl] = useState<string | null>(null);

  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Stop camera stream cleanly
  const stopStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    previousFrameRef.current = null;
    setIsStreaming(false);
    onCameraStatusChange(false);
  }, [onCameraStatusChange]);

  // Start real webcam
  const startCamera = async () => {
    setErrorMsg(null);
    setUseSimulatedFeed(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          onCameraStatusChange(true);
          startComputerVisionLoop();
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = err.message || 'Permission denied or webcam unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. You can enable camera in browser site settings, or switch to Simulated Surveillance Video.';
      }
      setErrorMsg(message);
      setIsStreaming(false);
      onCameraStatusChange(false);
    }
  };

  // Start simulated surveillance stream (moving shapes on canvas)
  const startSimulatedFeed = () => {
    stopStream();
    setErrorMsg(null);
    setUseSimulatedFeed(true);
    setIsStreaming(true);
    onCameraStatusChange(true);
  };

  // Computer Vision: Frame Differencing loop
  const startComputerVisionLoop = () => {
    const processFrame = () => {
      const video = videoRef.current;
      const cvCanvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!video || !cvCanvas || !overlayCanvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const cvWidth = 120;
      const cvHeight = 90;
      const cvCtx = cvCanvas.getContext('2d', { willReadFrequently: true });
      const overlayCtx = overlayCanvas.getContext('2d');

      if (!cvCtx || !overlayCtx) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Draw downscaled frame
      cvCtx.drawImage(video, 0, 0, cvWidth, cvHeight);
      const imgData = cvCtx.getImageData(0, 0, cvWidth, cvHeight);
      const pixels = imgData.data;

      // Clear overlay
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      if (!previousFrameRef.current) {
        previousFrameRef.current = new Uint8ClampedArray(pixels);
        animFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const prev = previousFrameRef.current;
      let diffCount = 0;
      let minX = cvWidth, minY = cvHeight, maxX = 0, maxY = 0;

      // Grayscale frame differencing
      for (let i = 0; i < pixels.length; i += 4) {
        const curLum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        const prevLum = 0.299 * prev[i] + 0.587 * prev[i + 1] + 0.114 * prev[i + 2];

        if (Math.abs(curLum - prevLum) > sensitivity) {
          diffCount++;
          const idx = i / 4;
          const px = idx % cvWidth;
          const py = Math.floor(idx / cvWidth);

          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }

      // Update previous buffer
      previousFrameRef.current.set(pixels);

      const percent = Math.min(100, Math.round((diffCount / (cvWidth * cvHeight)) * 100));
      setMotionPercent(percent);

      const isSubstantialMotion = diffCount > 180; // Trigger threshold
      setIsMotionTriggered(isSubstantialMotion);

      if (isSubstantialMotion) {
        // Draw computer vision bounding box on the overlay canvas
        const scaleX = overlayCanvas.width / cvWidth;
        const scaleY = overlayCanvas.height / cvHeight;
        const boxX = minX * scaleX;
        const boxY = minY * scaleY;
        const boxW = Math.max(30, (maxX - minX) * scaleX);
        const boxH = Math.max(30, (maxY - minY) * scaleY);

        overlayCtx.strokeStyle = '#ef4444';
        overlayCtx.lineWidth = 3;
        overlayCtx.strokeRect(boxX, boxY, boxW, boxH);

        overlayCtx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        overlayCtx.fillRect(boxX, boxY, boxW, boxH);

        overlayCtx.fillStyle = '#ef4444';
        overlayCtx.font = 'bold 12px monospace';
        overlayCtx.fillText(`TARGET DETECTED [${percent}%]`, boxX + 4, Math.max(16, boxY - 6));

        // Cooldown between captured incidents (2.5 seconds)
        const now = Date.now();
        if (now - lastDetectionTimeRef.current > 2500) {
          lastDetectionTimeRef.current = now;
          captureSnapshot(percent);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  // Simulated Surveillance Canvas animation
  useEffect(() => {
    if (!useSimulatedFeed) return;

    let posX = 50;
    let posY = 80;
    let dirX = 2;
    let dirY = 1.5;
    let simTimer: any;

    const runSimulation = () => {
      const cvCanvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!cvCanvas || !overlayCanvas) return;

      const ctx = cvCanvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!ctx || !overlayCtx) return;

      // Draw simulated camera view
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cvCanvas.width, cvCanvas.height);

      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < cvCanvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cvCanvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < cvCanvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cvCanvas.width, y);
        ctx.stroke();
      }

      // Simulated intruder bounding box
      posX += dirX;
      posY += dirY;
      if (posX < 30 || posX > cvCanvas.width - 120) dirX *= -1;
      if (posY < 30 || posY > cvCanvas.height - 100) dirY *= -1;

      // Draw intruder silhouette
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(posX + 40, posY + 20, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(posX + 20, posY + 36, 40, 50);

      // Draw timestamp watermark
      ctx.fillStyle = '#38bdf8';
      ctx.font = '12px monospace';
      ctx.fillText(`CAM-01 [SIMULATED] | ${new Date().toLocaleTimeString()}`, 12, 24);

      // Motion percent simulation
      const simPercent = Math.floor(Math.random() * 25) + 35;
      setMotionPercent(simPercent);
      setIsMotionTriggered(true);

      // Overlay bounding box
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      overlayCtx.strokeStyle = '#ef4444';
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeRect(posX, posY, 80, 90);
      overlayCtx.fillStyle = '#ef4444';
      overlayCtx.font = 'bold 12px monospace';
      overlayCtx.fillText(`SIMULATED INTRUDER [${simPercent}%]`, posX, posY - 6);

      const now = Date.now();
      if (now - lastDetectionTimeRef.current > 3000) {
        lastDetectionTimeRef.current = now;
        const snap = cvCanvas.toDataURL('image/jpeg', 0.8);
        setLastCaptureUrl(snap);
        onMotionDetected(snap, simPercent);
      }

      simTimer = requestAnimationFrame(runSimulation);
    };

    simTimer = requestAnimationFrame(runSimulation);

    return () => {
      if (simTimer) cancelAnimationFrame(simTimer);
    };
  }, [useSimulatedFeed, onMotionDetected]);

  // Capture current high-res snapshot
  const captureSnapshot = (score: number) => {
    let snapUrl = '';
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = videoRef.current.videoWidth;
      snapCanvas.height = videoRef.current.videoHeight;
      const snapCtx = snapCanvas.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
        // Add watermark
        snapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        snapCtx.fillRect(10, snapCanvas.height - 35, 420, 25);
        snapCtx.fillStyle = '#38bdf8';
        snapCtx.font = '14px monospace';
        snapCtx.fillText(`IOE SECURITY SNAPSHOT: ${new Date().toLocaleString()} (CV: ${score}%)`, 16, snapCanvas.height - 18);
        snapUrl = snapCanvas.toDataURL('image/jpeg', 0.85);
      }
    } else if (canvasRef.current) {
      snapUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    }

    if (snapUrl) {
      setLastCaptureUrl(snapUrl);
      onMotionDetected(snapUrl, score);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Panel Header */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>Intelligent Camera & CV Vision</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isStreaming 
                  ? useSimulatedFeed 
                    ? 'bg-blue-900/60 text-blue-300 border border-blue-600/50' 
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/50' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isStreaming ? (useSimulatedFeed ? 'SIMULATED STREAM' : 'LIVE WEBCAM') : 'OFFLINE'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Frame differencing optical motion detector with automatic incident capture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStreaming ? (
            <>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Webcam</span>
              </button>
              <button
                onClick={startSimulatedFeed}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                title="Use test video if webcam is unavailable"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Sim Stream</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => captureSnapshot(motionPercent)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                title="Manual snapshot"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Snapshot</span>
              </button>
              <button
                onClick={stopStream}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition shadow"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera Video Viewport */}
      <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden border-b border-slate-800">
        {/* Hidden video element for media stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${useSimulatedFeed ? 'hidden' : 'block'}`}
        />

        {/* Downsampled CV processing canvas (hidden from view, used for computation or sim) */}
        <canvas
          ref={canvasRef}
          width={useSimulatedFeed ? 640 : 120}
          height={useSimulatedFeed ? 480 : 90}
          className={`${useSimulatedFeed ? 'w-full h-full object-cover block' : 'hidden'}`}
        />

        {/* Real-time Bounding Box & HUD Canvas Overlay */}
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Watermark HUD */}
        {isStreaming && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="bg-black/70 backdrop-blur-sm border border-slate-700 text-slate-200 text-[11px] font-mono px-2 py-0.5 rounded">
              REC • {useSimulatedFeed ? 'SIM-CAM-01' : 'WEBCAM-01'} • 640x480
            </span>
          </div>
        )}

        {/* Motion Trigger Indicator Banner */}
        {isStreaming && isMotionTriggered && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-rose-950/85 border border-rose-500/80 rounded-lg py-1.5 px-3 flex items-center justify-between text-xs text-rose-200 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>OPTICAL MOTION DETECTED ({motionPercent}% CHANGE)</span>
            </div>
            <span className="text-[10px] font-mono text-rose-300">
              {isArmed ? 'ARMED: LOGGED & AUDITED' : 'DISARMED: AUDIT ONLY'}
            </span>
          </div>
        )}

        {/* Offline Placeholder */}
        {!isStreaming && (
          <div className="p-6 text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-slate-300 font-semibold text-sm mb-1">Surveillance Camera Standby</p>
            <p className="text-slate-500 text-xs mb-4">
              Connect your USB webcam or built-in camera to enable real-time computer vision motion tracking.
            </p>
            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
              >
                Enable Camera
              </button>
              <button
                onClick={startSimulatedFeed}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Test Sim Video
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CV Controls & Motion Sensitivity */}
      <div className="p-3 bg-slate-950/40 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">CV Motion Sensitivity:</span>
            <span className="font-mono text-cyan-400">{60 - sensitivity} pts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Current Delta:</span>
            <span className={`font-mono font-bold ${motionPercent > 15 ? 'text-rose-400' : 'text-slate-300'}`}>
              {motionPercent}%
            </span>
          </div>
        </div>

        {/* Delta Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
          <div
            className={`h-full transition-all duration-100 ${
              motionPercent > 25 ? 'bg-rose-500' : motionPercent > 10 ? 'bg-amber-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(100, motionPercent * 2)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>High Sensitivity</span>
          <input
            type="range"
            min="10"
            max="50"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-1/2 accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
          />
          <span>Low Sensitivity</span>
        </div>
      </div>
    </div>
  );
};
