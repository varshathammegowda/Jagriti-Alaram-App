import { useEffect, useRef, useState } from 'react';

const MODEL_SRC = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_SRC = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';

export default function usePoseDetector(enabled, onPose) {
  const videoRef = useRef(null), onPoseRef = useRef(onPose);
  const [status, setStatus] = useState('ready'), [error, setError] = useState('');
  onPoseRef.current = onPose;
  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false, stream, detector, frame = 0, lastDetection = 0;
    const run = async () => {
      setStatus('loading'); setError('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot access a camera. Try a recent mobile browser over HTTPS.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
        const video = videoRef.current; video.srcObject = stream; await video.play();
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(WASM_SRC);
        const options = { baseOptions: { modelAssetPath: MODEL_SRC, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.65, minTrackingConfidence: 0.65 };
        try { detector = await PoseLandmarker.createFromOptions(vision, options); }
        catch { detector = await PoseLandmarker.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
        if (disposed) { detector.close(); return; }
        setStatus('active');
        const tick = now => {
          if (disposed) return;
          if (video.readyState >= 2 && now - lastDetection >= 66) {
            lastDetection = now;
            const landmarks = detector.detectForVideo(video, now).landmarks?.[0] || null;
            onPoseRef.current?.(landmarks, now);
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch (cause) {
        if (disposed) return;
        stream?.getTracks().forEach(track => track.stop());
        detector?.close();
        if (videoRef.current) videoRef.current.srcObject = null;
        const message = cause.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser settings and try again.' : cause.name === 'NotFoundError' ? 'No camera was found on this device.' : cause.message || 'Could not start camera pose detection. Check your internet connection and try again.';
        setError(message); setStatus('error');
      }
    };
    run();
    return () => { disposed = true; cancelAnimationFrame(frame); stream?.getTracks().forEach(track => track.stop()); detector?.close(); if (videoRef.current) videoRef.current.srcObject = null; };
  }, [enabled]);
  return { videoRef, status, error };
}
