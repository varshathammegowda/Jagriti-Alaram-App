import { useEffect, useRef, useState } from 'react';
import { Footprints } from 'lucide-react';

export default function StepChallenge({ steps = 15, onComplete }) {
  const [count, setCount] = useState(0), [error, setError] = useState(''), [running, setRunning] = useState(false);
  const lastPeak = useRef(0), baseline = useRef(null), previousDynamic = useRef(0), start = useRef(0), sent = useRef(false);
  const target = Math.max(1, Number(steps) || 15);
  const begin = async () => {
    const Motion = window.DeviceMotionEvent;
    if (!Motion) { setError('Step counting is not supported by this browser/device. Try a phone browser with motion sensors.'); return; }
    try { if (typeof Motion.requestPermission === 'function' && await Motion.requestPermission() !== 'granted') throw new Error('Allow motion access in browser settings to count steps.'); }
    catch (cause) { setError(cause.message || 'Motion sensor permission was denied.'); return; }
    start.current = Date.now(); sent.current = false; lastPeak.current = 0; baseline.current = null; previousDynamic.current = 0; setCount(0); setError(''); setRunning(true);
  };
  useEffect(() => {
    if (!running) return undefined;
    const onMotion = event => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration || acceleration.x == null) { setError('This device does not provide usable motion sensor data.'); setRunning(false); return; }
      const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z) / 9.81;
      if (baseline.current === null) { baseline.current = magnitude; return; }
      baseline.current = baseline.current * 0.9 + magnitude * 0.1;
      const dynamic = Math.abs(magnitude - baseline.current), now = Date.now();
      if (dynamic > 0.22 && dynamic > previousDynamic.current && now - lastPeak.current > 400) { lastPeak.current = now; setCount(value => Math.min(target, value + 1)); }
      previousDynamic.current = dynamic;
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [running, target]);
  useEffect(() => {
    if (count >= target && !sent.current) { sent.current = true; setRunning(false); }
  }, [count, target]);
  return <section className="simple-challenge"><Footprints size={28}/><p className="eyebrow">WALK CHALLENGE</p><h2>{Math.min(count, target)} / {target} steps</h2><div className="rep-progress"><i style={{ width: `${count / target * 100}%` }}/></div><p>Carry your phone while you walk. Jagriti counts motion peaks locally; it does not upload sensor data.</p>{error && <div className="form-error">{error}</div>}{count >= target ? <button className="btn primary full" onClick={() => onComplete({ challengeType: 'walk', target, actualValue: count, unit: 'steps', duration: Math.round((Date.now() - start.current) / 1000), startedAt: new Date(start.current).toISOString(), metadata: { detectionMethod: 'device-motion' } })}>Complete walk</button> : <button className="btn primary full" disabled={running} onClick={begin}>{running ? 'Walk to count steps…' : 'Start step counting'}</button>}</section>;
}
