import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Music2, Play } from 'lucide-react';
import '../dance.css';

const MUSIC_SRC = '/audio/jagriti-dance-track.wav';
const MODEL_SRC = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_SRC = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const fmt = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
const visible = point => point && (point.visibility ?? 1) > 0.45;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function DanceChallenge({ duration = 60, onComplete }) {
  const videoRef = useRef(null), audioRef = useRef(null), streamRef = useRef(null), landmarkerRef = useRef(null), rafRef = useRef(0);
  const previousRef = useRef(null), activeRef = useRef(0), lastFrameRef = useRef(0), lastMoveRef = useRef(0), trackedRef = useRef(0), movingRef = useRef(0);
  const [state, setState] = useState('ready');
  const [remaining, setRemaining] = useState(duration);
  const [metrics, setMetrics] = useState({ body: false, arms: false, legs: false, moving: false });
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const startedAtRef = useRef(null);
  const completed = state === 'complete';

  const release = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current?.close(); landmarkerRef.current = null;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);
  useEffect(() => release, [release]);

  const start = async () => {
    setError(''); setState('starting');
    try {
      await audioRef.current?.play();
      startedAtRef.current = new Date().toISOString();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_SRC);
      const options = { baseOptions: { modelAssetPath: MODEL_SRC, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 };
      try { landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, options); }
      catch { landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } }); }
      lastFrameRef.current = performance.now(); lastMoveRef.current = performance.now();
      const analyze = now => {
        if (!videoRef.current || !landmarkerRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(analyze); return; }
        const elapsed = Math.min(0.15, Math.max(0, (now - lastFrameRef.current) / 1000)); lastFrameRef.current = now;
        const result = landmarkerRef.current.detectForVideo(videoRef.current, now), pose = result.landmarks?.[0]; let bodyPresent = false;
        if (pose) {
          const points = [11,12,13,14,15,16,23,24,25,26,27,28].map(i => pose[i]);
          const body = points.filter(visible).length >= 8; bodyPresent = body;
          const old = previousRef.current;
          const armMove = body && old && [13,14,15,16].some(i => visible(pose[i]) && visible(old[i]) && distance(pose[i], old[i]) > 0.006);
          const legMove = body && old && [25,26,27,28].some(i => visible(pose[i]) && visible(old[i]) && distance(pose[i], old[i]) > 0.006);
          const hipMove = body && old && [23,24].some(i => visible(pose[i]) && visible(old[i]) && distance(pose[i], old[i]) > 0.005);
          const moving = Boolean(armMove || legMove || hipMove);
          setMetrics({ body, arms: Boolean(armMove), legs: Boolean(legMove), moving });
          if (body) { trackedRef.current += elapsed; if (moving) { activeRef.current += elapsed; movingRef.current += elapsed; lastMoveRef.current = now; } }
          previousRef.current = pose;
        } else { previousRef.current = null; setMetrics({ body: false, arms: false, legs: false, moving: false }); }
        const left = Math.max(0, duration - activeRef.current); setRemaining(left);
        const isActive = bodyPresent && now - lastMoveRef.current <= 2000;
        if (left <= 0) {
          const movementScore = trackedRef.current ? Math.round(Math.min(1, movingRef.current / trackedRef.current) * 100) : 0;
          setScore(movementScore); setState('complete'); release(); return;
        }
        setState(isActive ? 'active' : 'paused');
        rafRef.current = requestAnimationFrame(analyze);
      };
      rafRef.current = requestAnimationFrame(analyze);
    } catch (e) {
      release(); setState('ready');
      setError(e.name === 'NotAllowedError' ? 'Allow camera access to start the dance challenge.' : 'Could not start the camera or pose detector. Check camera permission and your internet connection, then try again.');
    }
  };

  return <section className="dance-challenge">
    <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />
    <div className="dance-heading"><div className="dance-mark">💃</div><p className="eyebrow">DANCE CHALLENGE</p><h2>{completed ? 'Dance complete!' : state === 'ready' || state === 'starting' ? 'Get up and dance!' : 'Keep dancing!'}</h2><p>{completed ? 'You stayed active for the full challenge.' : 'Move your arms, legs, or body to keep the timer moving.'}</p></div>
    <div className="dance-stage"><video ref={videoRef} muted playsInline className={state === 'ready' || state === 'starting' ? 'camera-preview hidden' : 'camera-preview'} /><div className="dance-stage-overlay"><div className="dance-time">{fmt(completed ? duration : remaining)}</div><div className="dance-track-label"><Music2 size={15}/> Music {state === 'active' || state === 'paused' ? 'is playing' : 'ready'} · Jagriti Dance Track</div></div></div>
    <div className="dance-metrics"><span><Camera size={15}/> Camera: <b>{state === 'active' || state === 'paused' ? 'ON' : 'Ready'}</b></span><span>Body: <b>{metrics.body ? 'Detected' : 'Waiting...'}</b></span><span>Arms: <b>{metrics.arms ? 'Moving' : 'Waiting...'}</b></span><span>Legs: <b>{metrics.legs ? 'Moving' : 'Waiting...'}</b></span></div>
    <div className="dance-progress"><div><span>Active movement</span><b>{Math.round((duration - remaining) / duration * 100)}%</b></div><div className="dance-progress-track"><i style={{ width: `${Math.max(0, Math.min(100, (duration - remaining) / duration * 100))}%` }}/></div><small>{metrics.moving ? 'Movement detected ✓' : state === 'active' || state === 'paused' ? 'Move to continue your active time' : 'Movement Detection: Waiting...'}</small></div>
    {error && <div className="form-error">{error}</div>}
    {completed ? <div className="dance-complete"><p>🎉 DANCE COMPLETE!</p><span>You danced for {fmt(duration)}</span><span>Movement Score: {score}%</span><button className="btn primary full" onClick={() => onComplete({ challengeType: 'dance', target: duration, actualValue: duration, unit: 'seconds', duration: Math.round((Date.now() - Date.parse(startedAtRef.current)) / 1000), score, startedAt: startedAtRef.current, metadata: { detectionMethod: 'mediapipe-pose-activity' } })}><Check size={16}/> Complete challenge</button></div> : state === 'ready' || error ? <button className="btn primary full dance-start" onClick={start}><Play size={16}/> START DANCE</button> : <button className="btn primary full dance-start" disabled>{state === 'starting' ? 'Starting camera…' : state === 'paused' ? 'Move to continue active time' : 'KEEP DANCING!'}</button>}
    <p className="dance-privacy">Camera frames are analyzed on this device and are not uploaded. Pose detection needs an internet connection to load its model.</p>
  </section>;
}
