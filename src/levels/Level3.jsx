import { useRef, useState, useEffect, useCallback } from 'react';
import { curveY, fpPointAdd, fpScalarMul, getAllCurvePoints, pointOrder } from '../utils/ecc';
import { drawGrid, drawCurve } from '../hooks/useECCCanvas';
import { LevelLayout, LoreBox, SectionTitle, SliderRow, Hint, Formula } from '../components/UI';

const A = -1, B = 1, P_DEFAULT = 7;

function getPrimes() { return [7, 11, 13, 17, 19, 23]; }

export default function Level3() {
  const canvasRef = useRef(null);
  const infoRef = useRef({ W: 0, H: 0, ox: 0, oy: 0, scale: 1 });

  const [p, setP] = useState(17);
  const [k, setK] = useState(3);
  const [gIdx, setGIdx] = useState(0);
  const [showTrail, setShowTrail] = useState(true);

  const toScreen = useCallback((x, y) => {
    const { ox, oy, scale } = infoRef.current;
    return [ox + x * scale, oy - y * scale];
  }, []);

  // Get a generator point
  const allPts = getAllCurvePoints(A, 1, p);
  const G = allPts[gIdx % Math.max(allPts.length, 1)] || null;
  const { result: kG, trail } = G ? fpScalarMul(k, G, A, p) : { result: null, trail: [] };
  const order = G ? pointOrder(G, A, p, 200) : null;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const info = infoRef.current;
    const { W, H, ox, oy, scale } = info;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1822';
    ctx.fillRect(0, 0, W, H);

    // Grid (finite field style)
    ctx.strokeStyle = 'rgba(200,168,75,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= p; i++) {
      const [sx] = toScreen(i, 0); const [,sy] = toScreen(0, i);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }

    // Axes
    const [axX] = toScreen(0, 0); const [,axY] = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(200,168,75,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, axY); ctx.lineTo(W, axY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(axX, 0); ctx.lineTo(axX, H); ctx.stroke();

    // All curve points (dim)
    allPts.forEach(([x, y]) => {
      const [sx, sy] = toScreen(x, y);
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,168,75,0.2)'; ctx.fill();
    });

    // Trail arrows
    if (showTrail && trail.length > 1) {
      trail.forEach(([x, y], i) => {
        if (i === 0) return;
        const [x0, y0] = trail[i - 1];
        const [sx0, sy0] = toScreen(x0, y0);
        const [sx1, sy1] = toScreen(x, y);
        ctx.beginPath();
        ctx.moveTo(sx0, sy0);
        ctx.lineTo(sx1, sy1);
        const alpha = 0.15 + 0.5 * (i / trail.length);
        ctx.strokeStyle = `rgba(200,168,75,${alpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // kG trail points (gradient color)
    trail.forEach(([x, y], i) => {
      const [sx, sy] = toScreen(x, y);
      const t = i / Math.max(trail.length - 1, 1);
      const r = Math.round(46 + t * (46 - 46));
      ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(26, ${Math.round(130 + t * 60)}, ${Math.round(90 + t * 110)}, ${0.4 + t * 0.4})`;
      ctx.fill();
    });

    // G (generator)
    if (G) {
      const [sx, sy] = toScreen(G[0], G[1]);
      ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c87a'; ctx.fill();
      ctx.strokeStyle = 'var(--ink)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#e8c87a';
      ctx.font = 'bold 12px Cinzel, serif';
      ctx.fillText('G', sx + 10, sy - 4);
    }

    // kG result
    if (kG) {
      const [sx, sy] = toScreen(kG[0], kG[1]);
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71'; ctx.fill();
      ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.fillText(`${k}G`, sx + 11, sy - 5);
    }

    // Axis labels
    ctx.fillStyle = 'rgba(200,168,75,0.3)';
    ctx.font = '9px Cinzel, serif';
    for (let i = 0; i < p; i += Math.max(1, Math.floor(p / 8))) {
      const [sx] = toScreen(i, 0); const [,sy] = toScreen(0, i);
      ctx.fillText(i, sx - 3, axY + 12);
      ctx.fillText(i, axX + 3, sy + 3);
    }
  }, [allPts, G, k, kG, trail, showTrail, toScreen, p]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const W = rect.width, H = rect.height || 500;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const s = Math.min(W, H) / (p + 2);
      infoRef.current = { W, H, ox: s * 0.5, oy: H - s * 0.5, scale: s };
      redraw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    return () => ro.disconnect();
  }, [redraw, p]);

  useEffect(() => { redraw(); }, [redraw]);

  const maxK = order ? order - 1 : 20;

  return (
    <LevelLayout
      canvasSlot={<canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />}
      sideSlot={<>
        <LoreBox>
          <strong>Scalar multiplication:</strong> Compute k·G by adding G to itself k times. This is the one-way function that makes ECC secure.
        </LoreBox>

        <div>
          <SectionTitle>Parameters</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SliderRow label="p" min={7} max={23} step={2} value={p} onChange={v => { setP(v); setK(2); setGIdx(0); }} />
            <SliderRow label="k" min={1} max={Math.min(maxK, 30)} value={Math.min(k, Math.min(maxK, 30))} onChange={setK} />
            <SliderRow label="G" min={0} max={Math.max(allPts.length - 1, 0)} value={gIdx % Math.max(allPts.length, 1)} onChange={setGIdx} />
          </div>
        </div>

        <div>
          <SectionTitle>Result</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <div>G = <span style={{ color: '#e8c87a' }}>{G ? `(${G[0]}, ${G[1]})` : '-'}</span></div>
            <div>{k}·G = <span style={{ color: '#2ecc71' }}>{kG ? `(${kG[0]}, ${kG[1]})` : '∞'}</span></div>
            <div style={{ color: 'var(--ink-muted)', fontSize: 11 }}>Order of G = {order ?? '?'}</div>
          </div>
        </div>

        <div>
          <SectionTitle>Double-and-Add Algorithm</SectionTitle>
          <Formula lines={[
            `k = ${k} = ${k.toString(2)} (binary)`,
            order ? `{${k} steps → ${order} total pts}` : 'order unknown',
          ]} />
          <div style={{ fontSize: 12, color: '#6a8a9a', marginTop: 8, lineHeight: 1.6 }}>
            Binary expansion: instead of k additions, use ~log₂(k) doublings. This is why ECC can use huge k values efficiently.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="trail" checked={showTrail} onChange={e => setShowTrail(e.target.checked)} />
          <label htmlFor="trail" style={{ fontSize: 13, cursor: 'pointer', color: '#8a9a9a' }}>Show trail</label>
        </div>

        <Hint>The yellow dot is G. The green dot is k·G. Try setting k equal to the order - you get back the point at infinity!</Hint>
      </>}
    />
  );
}
