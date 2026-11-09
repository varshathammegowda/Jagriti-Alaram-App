import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Music2, Volume2 } from 'lucide-react';
import { createAlarm, getAlarms, updateAlarm } from '../services/alarmService';
import PhysicalActivityConfig from '../components/PhysicalActivityConfig';

const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const challengeOptions = [
  { type: 'walk', title: 'Walk', detail: 'Count steps using your device motion sensor.' },
  { type: 'dance', title: 'Dance', detail: 'Dance along with the automatic Jagriti track.' },
  { type: 'speak', title: 'Speaking', detail: 'Speak for your selected active duration.' },
  { type: 'custom', title: 'Custom', detail: 'Set your own activity and a timer.' },
  { type: 'math', title: 'Math', detail: 'Solve a quick math problem.' },
  { type: 'memory', title: 'Memory', detail: 'Remember and repeat a short sequence.' }
];
const blank = { time: '06:30', label: 'Wake up', repeat: [], sound: 'Sunrise', vibration: true, snoozeDuration: 5, mission: { enabled: false, type: 'math' }, challenges: [], physicalActivities: [], enabled: true };

export default function AlarmForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAlarms().then(r => {
      const alarm = r.data.data.find(item => item._id === id);
      if (!alarm) { setError('This alarm could not be found.'); return; }
      const challenges = alarm.challenges?.length ? alarm.challenges : alarm.mission?.enabled ? [{ type: alarm.mission.type, duration: alarm.mission.duration || 60 }] : [];
      setForm({ ...blank, ...alarm, repeat: alarm.repeat || [], challenges, physicalActivities: alarm.physicalActivities || [], mission: { enabled: challenges.length > 0, type: challenges[0]?.type || 'math' } });
    }).catch(() => setError('Unable to load this alarm.'));
  }, [id]);

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggleDay = day => set('repeat', form.repeat.includes(day) ? form.repeat.filter(x => x !== day) : [...form.repeat.filter(x => x !== 'Every day'), day]);
  const toggleChallenge = type => {
    const exists = form.challenges.some(item => item.type === type);
    if (!exists && form.challenges.length >= 5) return;
    const challenges = exists ? form.challenges.filter(item => item.type !== type) : [...form.challenges, { type, duration: type === 'speak' ? 60 : 60, steps: 15, label: 'Custom activity' }];
    set('challenges', challenges);
    set('mission', { enabled: challenges.length > 0, type: challenges[0]?.type || 'math' });
  };
  const updateChallenge = (type, values) => set('challenges', form.challenges.map(item => item.type === type ? { ...item, ...values } : item));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    const challenges = form.challenges.slice(0, 5);
    const payload = { ...form, challenges, physicalActivities: form.physicalActivities, mission: { enabled: challenges.length > 0, type: challenges[0]?.type || 'math', duration: challenges[0]?.duration || 60 } };
    try { if (id) await updateAlarm(id, payload); else await createAlarm(payload); nav('/alarms'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to save this alarm.'); }
    finally { setBusy(false); }
  };

  return <div className="page form-page">
    <button className="back-link" onClick={() => nav('/alarms')}><ArrowLeft size={16}/> Back to alarms</button>
    <header className="page-header"><div><p className="eyebrow">MAKE IT YOURS</p><h1>{id ? 'Edit alarm' : 'Create an alarm'}</h1><p className="muted">Set a time that helps your day start well.</p></div></header>
    {error && <div className="form-error">{error}</div>}
    <form className="editor-layout" onSubmit={submit}>
      <div className="surface editor-main">
        <div className="time-picker"><input type="time" value={form.time} onChange={e => set('time', e.target.value)} required/><div className="time-caption">Your alarm time</div></div>
        <label className="field-label">Alarm label<input value={form.label} maxLength="80" onChange={e => set('label', e.target.value)} placeholder="Wake up" required/></label>
        <div className="field-label">Repeat<div className="repeat-options"><button type="button" className={`repeat-pill ${!form.repeat.length ? 'selected' : ''}`} onClick={() => set('repeat', [])}>Once</button><button type="button" className={`repeat-pill ${form.repeat.includes('Every day') ? 'selected' : ''}`} onClick={() => set('repeat', form.repeat.includes('Every day') ? [] : ['Every day'])}>Every day</button></div><div className="day-select">{week.map(day => <button type="button" key={day} className={form.repeat.includes(day) ? 'selected' : ''} onClick={() => toggleDay(day)}>{day.slice(0, 3)}</button>)}</div></div>
        <div className="field-label">Sound<div className="sound-options">{['Sunrise', 'Gentle', 'Classic', 'Digital', 'Nature'].map((sound, i) => <button type="button" key={sound} className={`sound-choice ${form.sound === sound ? 'selected' : ''}`} onClick={() => set('sound', sound)}><span>{['☀', '♫', '◉', '⌁', '♧'][i]}</span>{sound}{form.sound === sound && <Check size={14}/>}</button>)}</div></div>
        <div className="field-row"><label className="field-label">Snooze duration<select value={form.snoozeDuration} onChange={e => set('snoozeDuration', Number(e.target.value))}>{[5, 10, 15].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></label><label className="setting-toggle"><span><b>Vibration</b><small>Vibrate while ringing</small></span><input type="checkbox" checked={form.vibration} onChange={e => set('vibration', e.target.checked)}/></label></div>
        <PhysicalActivityConfig value={form.physicalActivities} onChange={value => set('physicalActivities', value)}/>
        <section className="challenge-builder"><div className="challenge-builder-heading"><div><p className="eyebrow">WAKE-UP ROUTINE</p><h2>Other challenges <small>Optional · choose any</small></h2></div><span className="challenge-count">{form.challenges.length}/5</span></div><div className="challenge-options">{challengeOptions.map(option => { const selected = form.challenges.some(item => item.type === option.type); return <button type="button" key={option.type} className={`challenge-option ${selected ? 'selected' : ''}`} onClick={() => toggleChallenge(option.type)}><span className="challenge-check">{selected && <Check size={13}/>}</span><span><b>{option.title}</b><small>{option.detail}</small></span></button>; })}</div>
          {form.challenges.map(challenge => <div className="challenge-config" key={challenge.type}><b>{challengeOptions.find(option => option.type === challenge.type)?.title} settings</b>
            {challenge.type === 'dance' && <><label className="field-label">Duration<select value={[30, 60, 120].includes(challenge.duration) ? challenge.duration : 'custom'} onChange={e => e.target.value === 'custom' ? updateChallenge('dance', { duration: 90 }) : updateChallenge('dance', { duration: Number(e.target.value) })}><option value="30">30 seconds</option><option value="60">1 minute</option><option value="120">2 minutes</option><option value="custom">Custom</option></select></label>{![30, 60, 120].includes(challenge.duration) && <label className="field-label">Custom duration (seconds)<input type="number" min="15" max="600" value={challenge.duration} onChange={e => updateChallenge('dance', { duration: Number(e.target.value) })}/></label>}<div className="fixed-track"><Music2 size={17}/><span><b>Jagriti Dance Track</b><small>A surprise workout track will play when your alarm rings.</small></span></div></>}
            {challenge.type === 'walk' && <label className="field-label">Step target<input type="number" min="1" max="500" value={challenge.steps} onChange={e => updateChallenge('walk', { steps: Number(e.target.value) })}/></label>}
            {challenge.type === 'speak' && <label className="field-label">Speaking duration<select value={challenge.duration} onChange={e => updateChallenge('speak', { duration: Number(e.target.value) })}><option value="30">30 seconds</option><option value="60">1 minute</option><option value="180">3 minutes</option><option value="300">5 minutes</option></select></label>}
            {challenge.type === 'custom' && <><label className="field-label">Activity name<input maxLength="80" value={challenge.label || ''} onChange={e => updateChallenge('custom', { label: e.target.value })} placeholder="Stretch, drink water…"/></label><label className="field-label">Timer<select value={challenge.duration} onChange={e => updateChallenge('custom', { duration: Number(e.target.value) })}><option value="30">30 seconds</option><option value="60">1 minute</option><option value="180">3 minutes</option><option value="300">5 minutes</option></select></label></>}
          </div>)}
        </section>
        <div className="editor-actions"><button type="button" className="btn secondary" onClick={() => nav('/alarms')}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Save alarm'}</button></div>
      </div>
      <aside className="surface editor-aside"><div className="aside-icon"><Volume2 size={20}/></div><h3>A softer start.</h3><p>Choosing a consistent wake-up time helps your body find its rhythm.</p><div className="aside-divider"/><p className="aside-small">Your browser needs to stay open for web alarms to ring.</p></aside>
    </form>
  </div>;
}
