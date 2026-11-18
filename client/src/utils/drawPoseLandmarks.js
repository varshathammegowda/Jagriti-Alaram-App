const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

const isVisible = point => point && (point.visibility ?? point.presence ?? 1) >= 0.45;

export default function drawPoseLandmarks(canvas, video, landmarks) {
  if (!canvas || !video) return;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(bounds.width * ratio);
  const height = Math.round(bounds.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  if (!landmarks?.length || !video.videoWidth || !video.videoHeight) return;

  // Match object-fit: cover, then mirror with CSS along with the selfie video.
  const scale = Math.max(bounds.width / video.videoWidth, bounds.height / video.videoHeight);
  const offsetX = (bounds.width - video.videoWidth * scale) / 2;
  const offsetY = (bounds.height - video.videoHeight * scale) / 2;
  const pointAt = index => {
    const point = landmarks[index];
    if (!isVisible(point)) return null;
    return { x: offsetX + point.x * video.videoWidth * scale, y: offsetY + point.y * video.videoHeight * scale };
  };

  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(57, 225, 190, 0.92)';
  for (const [start, end] of CONNECTIONS) {
    const a = pointAt(start), b = pointAt(end);
    if (!a || !b) continue;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }

  landmarks.forEach((point, index) => {
    if (!isVisible(point)) return;
    const mapped = pointAt(index);
    if (!mapped) return;
    context.beginPath();
    context.arc(mapped.x, mapped.y, index <= 10 ? 2.5 : 3.5, 0, Math.PI * 2);
    context.fillStyle = '#f8fffe';
    context.fill();
    context.lineWidth = 1.5;
    context.strokeStyle = '#148dff';
    context.stroke();
  });
}
