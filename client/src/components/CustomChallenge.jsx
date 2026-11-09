import { useEffect, useState } from 'react';

export default function CustomChallenge({ label = 'Custom activity', duration = 60, onComplete }) {
  const [running, setRunning] = useState(false), [left, setLeft] = useState(duration);
  useEffect(() => { setLeft(duration); setRunning(false); }, [duration, label]);
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setLeft(value => {
      if (value <= 1) { window.clearInterval(timer); setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  const complete = left <= 0;
  return <section className="simple-challenge"><p className="eyebrow">CUSTOM CHALLENGE</p><h2>{label}</h2><p className="custom-timer">{Math.floor(left / 60)}:{String(left % 60).padStart(2,'0')}</p><p>Complete your custom activity until the timer finishes.</p>{complete ? <button className="btn primary full" onClick={() => onComplete({ challengeType: 'custom', target: duration, actualValue: duration, unit: 'seconds', duration, metadata: { detectionMethod: 'timed-activity' } })}>Complete activity</button> : <button className="btn primary full" onClick={() => setRunning(true)} disabled={running}>{running ? 'Timer running…' : 'Start timer'}</button>}</section>;
}
