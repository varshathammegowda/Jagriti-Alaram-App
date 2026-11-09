const TYPES = new Set(['math', 'memory', 'dance', 'walk', 'speak', 'custom']);
const DANCE_MUSIC = { id: 'jagriti-dance-track', name: 'Jagriti Dance Track' };
const PHYSICAL_TYPES = new Set(['squat', 'pushup', 'jumping-jack']);

export function sanitizeChallenges(input) {
  if (!Array.isArray(input)) return undefined;
  return input.slice(0, 5).filter(item => item && TYPES.has(item.type)).map(item => ({
    type: item.type,
    duration: item.type === 'walk' ? 60 : Math.min(600, Math.max(15, Number(item.duration) || 60)),
    steps: item.type === 'walk' ? Math.min(500, Math.max(1, Number(item.steps) || 15)) : 15,
    ...(item.type === 'custom' ? { label: String(item.label || 'Custom activity').trim().slice(0, 80) || 'Custom activity' } : {}),
    ...(item.type === 'dance' ? { music: DANCE_MUSIC } : {})
  }));
}

export function sanitizePhysicalActivities(input) {
  if (!Array.isArray(input)) return undefined;
  const seen = new Set();
  return input.filter(item => item && PHYSICAL_TYPES.has(item.type) && !seen.has(item.type) && seen.add(item.type)).slice(0, 3).map(item => ({
    type: item.type,
    target: Math.min(200, Math.max(1, Number(item.target) || 15)),
    unit: 'reps'
  }));
}
