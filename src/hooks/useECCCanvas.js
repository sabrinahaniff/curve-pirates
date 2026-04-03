import { useRef, useEffect, useCallback } from 'react';

export function useECCCanvas(drawFn, deps = []) {
  const canvasRef = useRef(null);
  const infoRef = useRef({ W: 0, H: 0, ox: 0, oy: 0, scale: 1 });

  const getInfo = () => infoRef.current;

  const toScreen = useCallback((x, y) => {
    const { ox, oy, scale } = infoRef.current;
    return [ox + x * scale, oy - y * scale];
  }, []);

  const fromScreen = useCallback((sx, sy) => {
    const { ox, oy, scale } = infoRef.current;
    return [(sx - ox) / scale, (oy - sy) / scale];
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { W, H } = infoRef.current;
    ctx.clearRect(0, 0, W, H);
    // Sea background
    ctx.fillStyle = '#0a1822';
    ctx.fillRect(0, 0, W, H);
    drawFn(ctx, infoRef.current, toScreen, fromScreen);
  }, [drawFn, toScreen, fromScreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const W = rect.width;
      const H = rect.height || 480;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const scale = Math.min(W, H) * 0.17;
      infoRef.current = { W, H, ox: W / 2, oy: H / 2, scale };
      redraw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    return () => ro.disconnect();
  }, [redraw]);

  // redraw when deps change
  useEffect(() => { redraw(); }, [redraw, ...deps]);

  return { canvasRef, getInfo, toScreen, fromScreen, redraw };
}

// ── Drawing helpers ────────────────────────────────────────────────────────────

export function drawGrid(ctx, { W, H, ox, oy, scale }) {
  ctx.strokeStyle = 'rgba(200,168,75,0.12)';
  ctx.lineWidth = 0.5;
  const step = scale;
  for (let x = ox % step; x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = oy % step; y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Axes
  ctx.strokeStyle = 'rgba(200,168,75,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();

  // Labels
  ctx.fillStyle = 'rgba(200,168,75,0.4)';
  ctx.font = '11px Cinzel, serif';
  ctx.fillText('x', W - 14, oy - 5);
  ctx.fillText('y', ox + 6, 13);
  ctx.font = '9px Cinzel, serif';
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    ctx.fillText(i, ox + i * scale - 4, oy + 13);
    ctx.fillText(i, ox + 4, oy - i * scale + 3);
  }
}

export function drawCurve(ctx, { ox, W }, toScreen, a, b, color = '#c8a84b') {
  const xMin = -ox / (W * 0.17) - 1;
  const xMax = (W - ox) / (W * 0.17) + 1;
  // re-derive scale from canvas info
  const scaleApprox = W * 0.17;
  const xMinR = (-ox) / scaleApprox - 0.1;
  const xMaxR = (W - ox) / scaleApprox + 0.1;
  const step = (xMaxR - xMinR) / 1000;

  for (const sign of [1, -1]) {
    ctx.beginPath();
    let started = false;
    for (let x = xMinR; x <= xMaxR; x += step) {
      const r = x * x * x + a * x + b;
      if (r >= 0) {
        const y = sign * Math.sqrt(r);
        const [sx, sy] = toScreen(x, y);
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      } else {
        started = false;
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawPoint(ctx, sx, sy, color, label, radius = 7) {
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.fillText(label, sx + radius + 4, sy - 4);
  }
}
