import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Camera, Play } from 'lucide-react';
import usePoseDetector from '../hooks/usePoseDetector';
import { advanceRepState, getMovementState, getPoseQuality, inspectPushupPose } from '../utils/poseRepetitions';

const labels = { squat: 'Squats', pushup: 'Push-ups', 'jumping-jack': 'Jumping Jacks' };
const instructions = { squat: 'Stand side-on to the camera. Bend your knees, then return to standing.', pushup: 'Keep your body in a straight line. Lower your chest, then push back up.', 'jumping-jack': 'Start with feet together and arms down. Jump out with arms overhead, then return.' };

export default function PhysicalActivityChallenge({ activity, onComplete }) {
  const [running, setRunning] = useState(false), [count, setCount] = useState(0), [phase, setPhase] = useState('ready'), [quality, setQuality] = useState(false), [error, setError] = useState('');
  const stateRef = useRef({ phase: null, phaseStartedAt: 0, count: 0 }), startRef = useRef(0), sentRef = useRef(false);
  const target = Math.max(1, Number(activity.target) || 15), name = labels[activity.type] || 'Exercise';
  const onPose = useCallback((pose, now) => {
    const pushup = activity.type === 'pushup' ? inspectPushupPose(pose) : null;
    const visible = getPoseQuality(pose, activity.type);
    setQuality(visible);
    if (!visible) {
      if (pushup) stateRef.current = { ...stateRef.current, missing: pushup.missing, angles: pushup.angles, confidence: pushup.confidence, aligned: pushup.aligned };
      setPhase('position'); return;
    }
    const next = advanceRepState(stateRef.current, getMovementState(activity.type, pose), now);
    stateRef.current = next; setCount(next.count); setPhase(next.phase || 'position');
  }, [activity.type]);
  const detector = usePoseDetector(running, onPose);
  useEffect(() => { if (detector.error) { setError(detector.error); setRunning(false); } }, [detector.error]);
  useEffect(() => {
    if (count >= target && !sentRef.current) { sentRef.current = true; setRunning(false); setPhase('complete'); }
  }, [count, target]);
  const start = () => { if (!count) { stateRef.current = { phase: null, phaseStartedAt: 0, count: 0 }; startRef.current = Date.now(); sentRef.current = false; } setError(''); setRunning(true); };
  const finish = () => onComplete({ challengeType: activity.type, target, actualValue: count, unit: 'reps', score: 100, duration: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)), startedAt: new Date(startRef.current).toISOString(), metadata: { detectionMethod: 'mediapipe-pose' } });
  const missingText = stateRef.current.missing?.length ? stateRef.current.missing.map(index => ({ 11: 'left shoulder', 12: 'right shoulder', 13: 'left elbow', 14: 'right elbow', 15: 'left wrist', 16: 'right wrist', 23: 'left hip', 24: 'right hip' })[index]).join(', ') : 'none';
  const pushupStatus = !quality ? `Show your shoulders, elbows, wrists and hips. Missing: ${missingText}.` : stateRef.current.aligned === false ? 'Adjust to a side-on plank position.' : 'Upper body landmarks detected.';

  return <section className="physical-challenge">
    <header className="physical-challenge-heading"><p className="eyebrow">PHYSICAL ACTIVITY CHALLENGE</p><h2>{phase === 'complete' ? `${target} ${name} completed` : name}</h2><p>{activity.type === 'pushup' ? 'Keep your shoulders, elbows, wrists and hips visible. A side view works best.' : 'Place your phone where your full body is visible. Keep your entire body inside the frame.'}</p></header>
    <div className="physical-video-wrap"><video ref={detector.videoRef} muted playsInline className="physical-video"/><canvas ref={detector.canvasRef} className="pose-landmark-overlay" aria-hidden="true"/><div className="pose-status"><Camera size={15}/>{!running ? 'Camera is off' : activity.type === 'pushup' ? pushupStatus : quality ? 'Full body detected' : 'We can’t detect your full body. Move farther away.'}</div></div>
    {running && activity.type === 'pushup' && import.meta.env.DEV && <p className="physical-state">Debug · L {formatAngle(stateRef.current.angles?.[0])}° / R {formatAngle(stateRef.current.angles?.[1])}° · {stateRef.current.stableState || 'waiting'} · confidence {Math.round((stateRef.current.confidence || 0) * 100)}% · missing {missingText} · reps {count}</p>}
    <div className="rep-count"><strong>{Math.min(count, target)} <span>/ {target}</span></strong><small>reps</small></div>
    <div className="rep-progress"><i style={{ width: `${Math.min(100, count / target * 100)}%` }}/></div>
    <p className="physical-instruction">{phase === 'complete' ? 'Great job! You completed the required movement cycle.' : instructions[activity.type]}</p>
    {phase !== 'complete' && <p className="physical-state">{phase === 'down' ? 'Return to the start position to count this rep.' : phase === 'apart' ? 'Return to feet together and arms down.' : running && quality ? 'Ready. Move through a complete repetition.' : activity.type === 'pushup' ? 'Show your shoulders, elbows, wrists and hips to the camera.' : 'Show your full body to the camera.'}</p>}
    {error && <div className="form-error">{error}</div>}
    {phase === 'complete' ? <div className="physical-success"><Check size={21}/><b>{target} {name} complete</b><p>Camera is off. Continue when you’re ready.</p><button className="btn primary full" onClick={finish}>Next challenge</button></div> : !running ? <button className="btn primary full" onClick={start} disabled={detector.status === 'loading'}><Play size={16}/> {detector.status === 'loading' ? 'Loading camera…' : 'Start camera challenge'}</button> : <button className="btn secondary full" onClick={() => setRunning(false)}>Pause challenge</button>}
    {running && detector.status === 'loading' && <p className="physical-state">Loading the on-device pose detector…</p>}
    <p className="dance-privacy">Camera frames are processed on this device and are not uploaded. An internet connection is needed to load MediaPipe.</p>
  </section>;
}

const formatAngle = value => value == null ? '—' : Math.round(value);
