export const POSE_THRESHOLDS = {
  visibility: 0.62,
  pushupVisibility: 0.42,
  squatDownAngle: 112,
  squatStandAngle: 158,
  // Broad hysteresis bands accommodate camera angle and landmark noise.
  pushupDownAngle: 100,
  pushupUpAngle: 150,
  pushupArmAgreement: 48,
  pushupAlignmentRatio: 0.52,
  pushupShoulderTravel: 0.025,
  jumpingJackApartFeet: 0.25,
  jumpingJackTogetherFeet: 0.16,
  jumpingJackHandsUp: 0.03,
  jumpingJackHandsDown: 0.16,
  minimumCycleMs: 350,
  maximumCycleMs: 12000
};

const confidence = point => Math.min(point?.visibility ?? point?.presence ?? 1, point?.presence ?? point?.visibility ?? 1);
const pointVisible = (pose, index, threshold = POSE_THRESHOLDS.visibility) => Boolean(pose?.[index] && confidence(pose[index]) >= threshold);
const angle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  const degrees = Math.abs(((radians * 180 / Math.PI) + 540) % 360 - 180);
  return degrees;
};

const PUSHUP_LANDMARKS = [11, 12, 13, 14, 15, 16, 23, 24];

export function inspectPushupPose(pose) {
  const missing = PUSHUP_LANDMARKS.filter(index => !pointVisible(pose, index, POSE_THRESHOLDS.pushupVisibility));
  const arms = [[11, 13, 15], [12, 14, 16]].map(([shoulder, elbow, wrist]) => {
    const valid = [shoulder, elbow, wrist].every(index => pointVisible(pose, index, POSE_THRESHOLDS.pushupVisibility));
    return { angle: valid ? angle(pose[shoulder], pose[elbow], pose[wrist]) : null,
      confidence: valid ? Math.min(...[shoulder, elbow, wrist].map(index => confidence(pose[index]))) : 0 };
  });
  const available = arms.filter(arm => arm.angle != null).sort((a, b) => b.confidence - a.confidence);
  const shoulder = [11, 12].filter(index => pointVisible(pose, index, POSE_THRESHOLDS.pushupVisibility));
  const hip = [23, 24].filter(index => pointVisible(pose, index, POSE_THRESHOLDS.pushupVisibility));
  const torsoAligned = shoulder.length && hip.length
    ? (() => {
      const s = shoulder.reduce((p, i) => ({ x: p.x + pose[i].x / shoulder.length, y: p.y + pose[i].y / shoulder.length }), { x: 0, y: 0 });
      const h = hip.reduce((p, i) => ({ x: p.x + pose[i].x / hip.length, y: p.y + pose[i].y / hip.length }), { x: 0, y: 0 });
      const length = Math.hypot(s.x - h.x, s.y - h.y);
      return length > 0.08 && Math.abs(s.y - h.y) / length <= POSE_THRESHOLDS.pushupAlignmentRatio;
    })() : false;
  const enough = available.length > 0 && shoulder.length > 0 && hip.length > 0;
  let state = null;
  if (enough && torsoAligned) {
    const chosen = available[0];
    const bilateral = available.length === 2 && Math.abs(available[0].angle - available[1].angle) <= POSE_THRESHOLDS.pushupArmAgreement;
    // When both arms are reliable, require agreement. One lower-confidence arm is ignored.
    const accepted = available.length === 1 || bilateral || available[1].confidence < 0.58;
    if (accepted) state = chosen.angle <= POSE_THRESHOLDS.pushupDownAngle ? 'down' : chosen.angle >= POSE_THRESHOLDS.pushupUpAngle ? 'up' : 'transition';
  }
  const center = shoulder.length ? shoulder.reduce((p, i) => ({ x: p.x + pose[i].x / shoulder.length, y: p.y + pose[i].y / shoulder.length }), { x: 0, y: 0 }) : null;
  return { state, missing, angles: arms.map(arm => arm.angle), confidence: available[0]?.confidence ?? 0, aligned: torsoAligned, enough, shoulder: center };
}

export function getPoseQuality(pose, type) {
  if (type === 'pushup') return inspectPushupPose(pose).enough;
  const required = [11,12,13,14,15,16,23,24,25,26,27,28];
  return required.filter(index => pointVisible(pose, index)).length >= 10;
}

const averageAngles = (pose, triplets) => {
  const values = triplets.filter(([i, j, k]) => pointVisible(pose, i) && pointVisible(pose, j) && pointVisible(pose, k)).map(([i, j, k]) => angle(pose[i], pose[j], pose[k]));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

export function getMovementState(type, pose, options = {}) {
  if (type === 'pushup') return inspectPushupPose(pose);
  if (!getPoseQuality(pose)) return null;
  if (type === 'squat') {
    const knee = averageAngles(pose, [[23,25,27], [24,26,28]]);
    return knee == null ? null : knee < POSE_THRESHOLDS.squatDownAngle ? 'down' : knee > POSE_THRESHOLDS.squatStandAngle ? 'up' : 'transition';
  }
  if (type === 'jumping-jack') {
    const feetApart = Math.abs(pose[27].x - pose[28].x) > POSE_THRESHOLDS.jumpingJackApartFeet;
    const feetTogether = Math.abs(pose[27].x - pose[28].x) < POSE_THRESHOLDS.jumpingJackTogetherFeet;
    const handsAboveShoulders = pose[15].y < pose[11].y - POSE_THRESHOLDS.jumpingJackHandsUp && pose[16].y < pose[12].y - POSE_THRESHOLDS.jumpingJackHandsUp;
    const armsDown = pose[15].y > pose[23].y - POSE_THRESHOLDS.jumpingJackHandsDown && pose[16].y > pose[24].y - POSE_THRESHOLDS.jumpingJackHandsDown;
    if (feetApart && handsAboveShoulders) return 'apart';
    if (feetTogether && armsDown) return 'together';
    return 'transition';
  }
  return null;
}

export function advanceRepState(previous, current, now) {
  if (current && typeof current === 'object') {
    const { state, shoulder, angles, confidence: score, missing, aligned } = current;
    const prior = previous.smooth || [];
    const smooth = [...prior, { state, shoulder, angles, score, missing, aligned }].slice(-3);
    const valid = smooth.filter(item => item.state && item.state !== 'transition');
    const stableState = valid.length >= 2 && valid.slice(-2).every(item => item.state === valid.at(-1).state) ? valid.at(-1).state : 'transition';
    const data = smooth.at(-1);
    const base = { ...previous, smooth, angles, confidence: score, missing, aligned, stableState, shoulder };
    if (!stableState || stableState === 'transition') return base;
    if (!previous.phase && stableState === 'up') return { ...base, phase: 'up', phaseStartedAt: now, upShoulder: shoulder };
    if (previous.phase === 'up' && stableState === 'down') return { ...base, phase: 'down', phaseStartedAt: now, downShoulder: shoulder };
    if (previous.phase === 'down' && stableState === 'up') {
      const elapsed = now - previous.phaseStartedAt;
      const travel = previous.downShoulder && shoulder ? Math.abs(shoulder.y - previous.downShoulder.y) : 0;
      const validCycle = elapsed >= POSE_THRESHOLDS.minimumCycleMs && elapsed <= POSE_THRESHOLDS.maximumCycleMs && travel >= POSE_THRESHOLDS.pushupShoulderTravel;
      return { ...base, phase: 'up', phaseStartedAt: now, upShoulder: shoulder, count: previous.count + (validCycle ? 1 : 0) };
    }
    return base;
  }
  if (!current || current === 'invalid') return { ...previous, phase: null };
  if (previous.phase === 'up' && current === 'down') return { ...previous, phase: 'down', phaseStartedAt: now };
  if (previous.phase === 'down' && current === 'up') {
    const elapsed = now - previous.phaseStartedAt;
    return { ...previous, phase: 'up', phaseStartedAt: now, count: previous.count + (elapsed >= POSE_THRESHOLDS.minimumCycleMs && elapsed <= POSE_THRESHOLDS.maximumCycleMs ? 1 : 0) };
  }
  if (!previous.phase && (current === 'up' || current === 'together')) return { ...previous, phase: current, phaseStartedAt: now };
  if (previous.phase === 'together' && current === 'apart') return { ...previous, phase: 'apart', phaseStartedAt: now };
  if (previous.phase === 'apart' && current === 'together') {
    const elapsed = now - previous.phaseStartedAt;
    return { ...previous, phase: 'together', phaseStartedAt: now, count: previous.count + (elapsed >= POSE_THRESHOLDS.minimumCycleMs && elapsed <= POSE_THRESHOLDS.maximumCycleMs ? 1 : 0) };
  }
  return previous;
}
