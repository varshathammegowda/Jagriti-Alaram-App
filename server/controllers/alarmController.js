import Alarm from '../models/Alarm.js';
import AlarmActivity from '../models/AlarmActivity.js';
import { sanitizeChallenges, sanitizePhysicalActivities } from '../utils/challenges.js';

export async function list(req, res) {
  res.json({ success: true, data: await Alarm.find({ userId: req.user.id }).sort({ time: 1 }) });
}

export async function get(req, res) {
  const item = await Alarm.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ success: false, message: 'Alarm not found' });
  res.json({ success: true, data: item });
}

export async function create(req, res) {
  const payload = { ...req.body, userId: req.user.id };
  if (req.body.challenges !== undefined) payload.challenges = sanitizeChallenges(req.body.challenges);
  if (req.body.physicalActivities !== undefined) payload.physicalActivities = sanitizePhysicalActivities(req.body.physicalActivities);
  const item = await Alarm.create(payload);
  res.status(201).json({ success: true, data: item });
}

export async function update(req, res) {
  const { time, label, repeat, enabled, sound, vibration, snoozeDuration, mission } = req.body;
  const update = {};
  for (const [key, value] of Object.entries({ time, label, repeat, enabled, sound, vibration, snoozeDuration, mission })) if (value !== undefined) update[key] = value;
  if (req.body.challenges !== undefined) update.challenges = sanitizeChallenges(req.body.challenges);
  if (req.body.physicalActivities !== undefined) update.physicalActivities = sanitizePhysicalActivities(req.body.physicalActivities);
  const item = await Alarm.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $set: update }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: 'Alarm not found' });
  res.json({ success: true, data: item });
}

export async function remove(req, res) {
  const item = await Alarm.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ success: false, message: 'Alarm not found' });
  res.json({ success: true, data: { id: item._id } });
}

export async function toggle(req, res) {
  const item = await Alarm.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ success: false, message: 'Alarm not found' });
  item.enabled = !item.enabled;
  await item.save();
  res.json({ success: true, data: item });
}

export async function activity(req, res) {
  const { status = 'completed', snoozes = 0, scheduledTime, sessionId } = req.body;
  if (!['completed', 'snoozed', 'missed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid alarm activity status' });
  const alarm = await Alarm.findOne({ _id: req.params.id, userId: req.user.id });
  if (!alarm) return res.status(404).json({ success: false, message: 'Alarm not found' });
  if (status === 'completed') {
    const savedChallenges = alarm.challenges?.length ? alarm.challenges : alarm.mission?.enabled ? [{ type: alarm.mission.type }] : [];
    const expected = [...savedChallenges.map(challenge => challenge.type), ...(alarm.physicalActivities || []).map(item => item.type)];
    if (expected.length) {
      if (!sessionId) return res.status(400).json({ success: false, message: 'Wake-up challenges must be completed before the alarm can be dismissed' });
      const results = await AlarmActivity.find({ userId: req.user.id, alarmId: alarm._id, sessionId, status: 'challenge-completed' }).select('challengeType');
      const completed = new Set(results.map(result => result.challengeType));
      if (expected.some(type => !completed.has(type))) return res.status(400).json({ success: false, message: 'Complete every selected wake-up challenge before dismissing this alarm' });
    }
  }
  const row = await AlarmActivity.create({ userId: req.user.id, alarmId: alarm._id, sessionId, status, snoozes, scheduledTime: scheduledTime || new Date(), triggeredAt: new Date(), stoppedAt: new Date(), date: new Date() });
  res.status(201).json({ success: true, data: row });
}

const RESULT_TYPES = new Set(['squat', 'pushup', 'jumping-jack', 'walk', 'dance', 'speak', 'custom', 'math', 'memory']);
const RESULT_UNITS = new Set(['reps', 'steps', 'seconds', 'challenge']);

export async function challengeResult(req, res) {
  const alarm = await Alarm.findOne({ _id: req.params.id, userId: req.user.id });
  if (!alarm) return res.status(404).json({ success: false, message: 'Alarm not found' });
  const { challengeType, target, actualValue, unit = 'challenge', duration = 0, startedAt, metadata = {}, sessionId, score } = req.body;
  const actual = Number(actualValue), goal = Number(target);
  if (!RESULT_TYPES.has(challengeType) || !RESULT_UNITS.has(unit) || !sessionId || !Number.isFinite(actual) || actual < 0 || !Number.isFinite(goal) || goal <= 0 || actual < goal)
    return res.status(400).json({ success: false, message: 'Challenge result does not meet its target' });

  const physical = (alarm.physicalActivities || []).find(item => item.type === challengeType);
  const configured = (alarm.challenges?.length ? alarm.challenges : alarm.mission?.enabled ? [{ type: alarm.mission.type, duration: alarm.mission.duration }] : []).find(item => item.type === challengeType);
  const configuredTarget = physical?.target ?? (challengeType === 'walk' ? configured?.steps : ['math', 'memory'].includes(challengeType) ? 1 : configured?.duration);
  if (configuredTarget == null || goal !== configuredTarget) return res.status(400).json({ success: false, message: 'This challenge is not configured for the alarm or its target does not match' });
  const expectedUnit = physical ? 'reps' : challengeType === 'walk' ? 'steps' : ['dance', 'speak', 'custom'].includes(challengeType) ? 'seconds' : 'challenge';
  if (unit !== expectedUnit) return res.status(400).json({ success: false, message: 'Challenge result unit does not match its configured type' });
  const prior = await AlarmActivity.findOne({ userId: req.user.id, alarmId: alarm._id, sessionId, status: 'challenge-completed', challengeType });
  if (prior) {
    if (prior.target === goal && prior.actualValue === actual) return res.status(200).json({ success: true, data: prior });
    return res.status(409).json({ success: false, message: 'A result for this challenge is already recorded in this alarm session' });
  }
  const detectionMethod = String(metadata?.detectionMethod || '').slice(0, 60);
  const row = await AlarmActivity.create({
    userId: req.user.id, alarmId: alarm._id, sessionId, status: 'challenge-completed', challengeType,
    target: goal, actualValue: actual, unit, score: challengeType === 'dance' ? Math.max(0, Math.min(100, Math.round(Number(score) || 0))) : Math.min(100, Math.round(actual / goal * 100)),
    duration: Math.max(0, Math.min(3600, Number(duration) || 0)), metadata: { detectionMethod },
    startedAt: startedAt && Number.isFinite(Date.parse(startedAt)) ? new Date(startedAt) : undefined,
    completedAt: new Date(), date: new Date()
  });
  res.status(201).json({ success: true, data: row });
}
