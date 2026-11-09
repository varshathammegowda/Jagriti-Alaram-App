import { Check } from 'lucide-react';

const activities = [
  { type: 'squat', label: 'Squats' },
  { type: 'pushup', label: 'Push-ups' },
  { type: 'jumping-jack', label: 'Jumping Jacks' }
];

export default function PhysicalActivityConfig({ value = [], onChange }) {
  const update = (type, target = 15) => {
    const selected = value.some(item => item.type === type);
    const next = selected ? value.filter(item => item.type !== type) : [...value, { type, target, unit: 'reps' }];
    onChange(activities.flatMap(activity => {
      const item = next.find(entry => entry.type === activity.type);
      return item ? [{ type: activity.type, target: Math.max(1, Number(item.target) || 15), unit: 'reps' }] : [];
    }));
  };
  const updateTarget = (type, target) => onChange(value.map(item => item.type === type ? { ...item, target: Math.min(200, Math.max(1, Number(target) || 1)) } : item));
  return <section className="physical-config"><header><p className="eyebrow">PHYSICAL ACTIVITY</p><h3>Choose exercises <small>15 reps by default</small></h3></header>
    {activities.map(activity => {
      const selected = value.find(item => item.type === activity.type);
      return <div className={`physical-config-row ${selected ? 'selected' : ''}`} key={activity.type}>
        <button type="button" className="physical-choice" aria-pressed={Boolean(selected)} onClick={() => update(activity.type, selected?.target || 15)}><span className="challenge-check">{selected && <Check size={13}/>}</span><b>{activity.label}</b></button>
        {selected && <label className="physical-target">Target <input type="number" min="1" max="200" value={selected.target} onChange={event => updateTarget(activity.type, event.target.value)}/> reps</label>}
      </div>;
    })}
    <p className="physical-hint">Only the exercises you select will be required. Keep your whole body in view of the camera.</p>
  </section>;
}
