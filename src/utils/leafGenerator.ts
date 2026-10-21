/**
 * Utility to generate high quality visual leaf images with characteristic Konkan mango symptoms
 * on an HTML5 canvas, returning a data URL for testing or mock prediction.
 */
export function generateLeafCanvasDataUrl(presetId: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - subtle farm table / orchard wooden texture
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 400, 400);

  // Draw mango leaf shape
  ctx.save();
  ctx.translate(200, 200);
  ctx.rotate(-Math.PI / 6);

  // Base leaf gradient
  const grad = ctx.createLinearGradient(-150, 0, 150, 0);
  if (presetId === 'dieback') {
    grad.addColorStop(0, '#5a3818');
    grad.addColorStop(0.4, '#8a6232');
    grad.addColorStop(1, '#2d5a27');
  } else if (presetId === 'healthy_alphonso') {
    grad.addColorStop(0, '#1e5128');
    grad.addColorStop(0.5, '#2d7c38');
    grad.addColorStop(1, '#4e9f3d');
  } else {
    grad.addColorStop(0, '#2d5a27');
    grad.addColorStop(0.5, '#3b7a33');
    grad.addColorStop(1, '#539e44');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Elongated lanceolate shape typical of Alphonso mango leaves
  ctx.moveTo(0, -160);
  ctx.bezierCurveTo(70, -100, 75, 80, 0, 160);
  ctx.bezierCurveTo(-75, 80, -70, -100, 0, -160);
  ctx.fill();

  // Leaf border
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1b3b17';
  ctx.stroke();

  // Central midrib vein
  ctx.strokeStyle = presetId === 'dieback' ? '#4a2c10' : '#85a83a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -160);
  ctx.lineTo(0, 160);
  ctx.stroke();

  // Secondary veins
  ctx.lineWidth = 1.5;
  for (let y = -120; y <= 120; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(25, y - 10, 45, y - 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(-25, y - 10, -45, y - 25);
    ctx.stroke();
  }

  // Draw disease symptom lesions
  if (presetId === 'anthracnose') {
    // Irregular necrotic dark brown spots with chlorotic halo
    const spots = [
      { x: -20, y: -40, r: 16 },
      { x: 25, y: -20, r: 22 },
      { x: -10, y: 30, r: 28 },
      { x: 18, y: 70, r: 15 },
      { x: -25, y: 80, r: 18 },
    ];
    for (const spot of spots) {
      // Yellowish halo
      ctx.fillStyle = 'rgba(217, 160, 40, 0.45)';
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r + 6, 0, Math.PI * 2);
      ctx.fill();

      // Dark brown necrotic center
      ctx.fillStyle = '#3a1e0d';
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
      ctx.fill();

      // Inner dead tissue
      ctx.fillStyle = '#1c0f06';
      ctx.beginPath();
      ctx.arc(spot.x + 2, spot.y + 2, spot.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (presetId === 'powdery_mildew') {
    // White talcum-like powdery patches
    const patches = [
      { x: 10, y: -70, r: 30 },
      { x: -20, y: -10, r: 35 },
      { x: 15, y: 40, r: 40 },
    ];
    for (const patch of patches) {
      const radGrad = ctx.createRadialGradient(patch.x, patch.y, 5, patch.x, patch.y, patch.r);
      radGrad.addColorStop(0, 'rgba(245, 245, 245, 0.85)');
      radGrad.addColorStop(0.6, 'rgba(230, 230, 230, 0.55)');
      radGrad.addColorStop(1, 'rgba(200, 200, 200, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (presetId === 'bacterial_canker') {
    // Angular black spots with water-soaked margins
    const cankers = [
      { x: -15, y: -80, w: 14, h: 18 },
      { x: 20, y: -30, w: 22, h: 16 },
      { x: -25, y: 15, w: 20, h: 25 },
      { x: 10, y: 60, w: 28, h: 20 },
    ];
    for (const c of cankers) {
      ctx.fillStyle = 'rgba(163, 134, 44, 0.5)';
      ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
      ctx.fillStyle = '#18120c';
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
  } else if (presetId === 'dieback') {
    // Dried tip
    ctx.fillStyle = 'rgba(74, 44, 16, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -160);
    ctx.quadraticCurveTo(45, -120, 20, -70);
    ctx.lineTo(-20, -70);
    ctx.quadraticCurveTo(-45, -120, 0, -160);
    ctx.fill();
  }

  ctx.restore();

  // Watermark text in corner
  ctx.font = 'bold 12px "Mukta", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('कोकण हापूस पान नमुना', 14, 385);

  return canvas.toDataURL('image/jpeg', 0.85);
}
