import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

export default function SpeakChallenge({ duration = 60, onComplete }) {
  const [running, setRunning] = useState(false), [speaking, setSpeaking] = useState(false), [active, setActive] = useState(0), [error, setError] = useState('');
  const recognition = useRef(null), start = useRef(0), speechStart = useRef(0), activeRef = useRef(0), interval = useRef(0);
  const goal = Math.max(15, Number(duration) || 60);
  const begin = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('Speech detection is not supported in this browser. Try current Chrome or Edge.'); return; }
    try {
      const engine = new Recognition(); engine.continuous = true; engine.interimResults = true;
      engine.onstart = () => { start.current = Date.now(); setRunning(true); setError(''); interval.current = window.setInterval(() => setActive(Math.floor(activeRef.current)), 250); };
      engine.onspeechstart = () => { speechStart.current = Date.now(); setSpeaking(true); };
      engine.onspeechend = () => { if (speechStart.current) activeRef.current += (Date.now() - speechStart.current) / 1000; speechStart.current = 0; setSpeaking(false); setActive(Math.floor(activeRef.current)); };
      engine.onerror = event => { if (event.error !== 'no-speech') setError('Microphone access or speech detection failed. Check browser permission.'); };
      engine.onend = () => { setRunning(false); window.clearInterval(interval.current); };
      recognition.current = engine; engine.start();
    } catch { setError('Could not start speech detection. Check microphone permission and try again.'); }
  };
  useEffect(() => () => { window.clearInterval(interval.current); recognition.current?.stop(); }, []);
  useEffect(() => {
    if (!running || !speaking) return undefined;
    const timer = window.setInterval(() => {
      const total = activeRef.current + (Date.now() - speechStart.current) / 1000;
      setActive(Math.floor(total));
      if (total >= goal) { activeRef.current = goal; if (speechStart.current) activeRef.current = goal; speechStart.current = 0; setSpeaking(false); setRunning(false); recognition.current?.stop(); }
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, speaking, goal]);
  const done = active >= goal && !running;
  return <section className="simple-challenge"><Mic size={28}/><p className="eyebrow">SPEAKING CHALLENGE</p><h2>{Math.min(goal, active)} / {goal} seconds speaking</h2><div className="rep-progress"><i style={{ width: `${Math.min(100, active / goal * 100)}%` }}/></div><p>{speaking ? 'Speech detected. Keep going.' : 'Allow microphone access, then speak naturally. Jagriti stores speaking time only, not your words. Speech recognition is browser-managed and may use the browser provider’s service.'}</p>{error && <div className="form-error">{error}</div>}{done ? <button className="btn primary full" onClick={() => onComplete({ challengeType: 'speak', target: goal, actualValue: active, unit: 'seconds', duration: Math.round((Date.now() - start.current) / 1000), startedAt: new Date(start.current).toISOString(), metadata: { detectionMethod: 'browser-speech-recognition' } })}>Complete speaking challenge</button> : <button className="btn primary full" onClick={begin} disabled={running}>{running ? 'Listening…' : 'Start speaking challenge'}</button>}</section>;
}
