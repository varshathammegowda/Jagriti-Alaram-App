export const POSE_THRESHOLDS = {
  visibility: 0.62,
  squatDownAngle: 112,
  squatStandAngle: 158,
  pushupDownAngle: 98,
  pushupUpAngle: 154,
  jumpingJackApartFeet: 0.25,
  jumpingJackTogetherFeet: 0.16,
  jumpingJackHandsUp: 0.03,
  jumpingJackHandsDown: 0.16,
  minimumCycleMs: 650,
  maximumCycleMs: 10000
};

const pointVisible = (pose, index) => Boolean(pose?.[index] && (pose[index].visibility ?? 1) >= POSE_THRESHOLDS.visibility);
const angle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  return Math.abs(((radians * 180 / Math.PI) + 360) % 360 > 180 ? ((radians * 180 / Math.PI) + 360) % 360 - 360 : ((radians * 180 / Math.PI) + 360) % 360);
};

export function getPoseQuality(pose) {
  const required = [11,12,13,14,15,16,23,24,25,26,27,28];
  return required.filter(index => pointVisible(pose, index)).length >= 10;
}

const averageAngles = (pose, triplets) => {
  const values = triplets.filter(([i, j, k]) => pointVisible(pose, i) && pointVisible(pose, j) && pointVisible(pose, k)).map(([i, j, k]) => angle(pose[i], pose[j], pose[k]));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

export function getMovementState(type, pose) {
  if (!getPoseQuality(pose)) return null;
  if (type === 'squat') {
    const knee = averageAngles(pose, [[23,25,27], [24,26,28]]);
    return knee == null ? null : knee < POSE_THRESHOLDS.squatDownAngle ? 'down' : knee > POSE_THRESHOLDS.squatStandAngle ? 'up' : 'transition';
  }
  if (type === 'pushup') {
    const elbows = averageAngles(pose, [[11,13,15], [12,14,16]]);
    const straightBody = Math.abs((pose[11].y + pose[12].y) / 2 - (pose[23].y + pose[24].y) / 2) < 0.24;
    if (elbows == null || !straightBody) return 'invalid';
    return elbows < POSE_THRESHOLDS.pushupDownAngle ? 'down' : elbows > POSE_THRESHOLDS.pushupUpAngle ? 'up' : 'transition';
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
  if (!current || current === 'invalid') return { ...previous, phase: null };
  if (previous.phase === 'up' && current === 'down') return { phase: 'down', phaseStartedAt: now, count: previous.count };
  if (previous.phase === 'down' && current === 'up') {
    const elapsed = now - previous.phaseStartedAt;
    if (elapsed >= POSE_THRESHOLDS.minimumCycleMs && elapsed <= POSE_THRESHOLDS.maximumCycleMs) return { phase: 'up', phaseStartedAt: now, count: previous.count + 1 };
    return { phase: 'up', phaseStartedAt: now, count: previous.count };
  }
  if (!previous.phase && (current === 'up' || current === 'together')) return { phase: current, phaseStartedAt: now, count: previous.count };
  if (previous.phase === 'together' && current === 'apart') return { phase: 'apart', phaseStartedAt: now, count: previous.count };
  if (previous.phase === 'apart' && current === 'together') {
    const elapsed = now - previous.phaseStartedAt;
    return { phase: 'together', phaseStartedAt: now, count: elapsed >= POSE_THRESHOLDS.minimumCycleMs && elapsed <= POSE_THRESHOLDS.maximumCycleMs ? previous.count + 1 : previous.count };
  }
  return previous;
}
