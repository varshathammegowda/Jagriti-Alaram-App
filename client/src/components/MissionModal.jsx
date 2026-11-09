import { useState } from 'react';
import { X, Check } from 'lucide-react';
import DanceChallenge from './DanceChallenge';
import PhysicalActivityChallenge from './PhysicalActivityChallenge';
import StepChallenge from './StepChallenge';
import SpeakChallenge from './SpeakChallenge';
import CustomChallenge from './CustomChallenge';

function MathMission({ onDone }) {
  const [a] = useState(17 + Math.floor(Math.random() * 30));
  const [b] = useState(10 + Math.floor(Math.random() * 30));
  const [answer, setAnswer] = useState('');
  return <form onSubmit={event => { event.preventDefault(); if (Number(answer) === a + b) onDone(); else setAnswer(''); }}><p className="mission-problem">{a} + {b} = ?</p><input autoFocus type="number" value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Your answer"/><button className="btn primary full">Check answer</button></form>;
}

function MemoryMission({ onDone }) {
  const [sequence] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1).join(''));
  const [answer, setAnswer] = useState('');
  const [shown, setShown] = useState(false);
  return shown ? <form onSubmit={event => { event.preventDefault(); if (answer === sequence) onDone(); else setAnswer(''); }}><p>Enter the sequence you saw.</p><input autoFocus value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Sequence"/><button className="btn primary full">Check sequence</button></form> : <div><p className="mission-problem tracking-widest">{sequence}</p><button className="btn primary full" onClick={() => setShown(true)}>I memorized it</button></div>;
}

export default function MissionModal({ type = 'math', duration = 60, steps, label, activity, onClose, onComplete, stepLabel, submissionError }) {
  let content;
  if (type === 'dance') content = <DanceChallenge duration={duration} onComplete={onComplete}/>;
  else if (type === 'physical') content = <PhysicalActivityChallenge activity={activity} onComplete={onComplete}/>;
  else if (type === 'walk') content = <StepChallenge steps={steps} onComplete={onComplete}/>;
  else if (type === 'speak') content = <SpeakChallenge duration={duration} onComplete={onComplete}/>;
  else if (type === 'custom') content = <CustomChallenge label={label} duration={duration} onComplete={onComplete}/>;
  else content = <>
    <div className="mission-icon"><Check size={21}/></div>
    <p className="eyebrow">{stepLabel || 'MISSION TO STOP'}</p>
    <h2>One small challenge.</h2>
    <p className="muted">Complete this to continue your wake-up routine.</p>
    {type === 'memory'
      ? <MemoryMission onDone={() => onComplete({ challengeType: 'memory', target: 1, actualValue: 1, unit: 'challenge', duration: 0, metadata: { detectionMethod: 'memory-prompt' } })}/>
      : <MathMission onDone={() => onComplete({ challengeType: 'math', target: 1, actualValue: 1, unit: 'challenge', duration: 0, metadata: { detectionMethod: 'math-prompt' } })}/>}
  </>;
  return <div className="overlay"><section className={`modal ${type === 'dance' || type === 'physical' ? 'dance-modal' : ''}`}><button className="icon-btn close" onClick={onClose}><X size={18}/></button>{stepLabel && type !== 'math' && type !== 'memory' && <p className="eyebrow dance-step-label">{stepLabel}</p>}{content}{submissionError && <div className="form-error" role="alert">{submissionError} The alarm will keep ringing until this result is recorded.</div>}</section></div>;
}
