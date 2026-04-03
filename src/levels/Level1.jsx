import { useRef, useState, useEffect, useCallback } from 'react';
import { curveY, discriminant, isSmooth } from '../utils/ecc';
import { drawGrid, drawCurve, drawPoint } from '../hooks/useECCCanvas';
import { LevelLayout, LoreBox, SectionTitle, SliderRow, Hint } from '../components/UI';

export default function Level1() {
  const canvasRef = useRef(null);
  const [a, setA] = useState(-2);
  const [b, setB] = useState(2);
  const infoRef = useRef({ W: 0, H: 0, ox: 0, oy: 0, scale: 1 });

  const toScreen = useCallback((x, y) => {
    const { ox, oy, scale } = infoRef.current;
    return [ox + x * scale, oy - y * scale];
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const info = infoRef.current;
    const { W, H } = info;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a1822';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, info);
    drawCurve(ctx, info, toScreen, a, b);

    // Equation watermark
    ctx.fillStyle = 'rgba(200,168,75,0.18)';
    ctx.font = '12px Cinzel, serif';
    ctx.fillText(`y² = x³ ${a >= 0 ? '+' : ''}${a}x ${b >= 0 ? '+' : ''}${b}`, 14, H - 14);
  }, [a, b, toScreen]);

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
      infoRef.current = { W, H, ox: W / 2, oy: H / 2, scale: Math.min(W, H) * 0.17 };
      redraw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  const disc = discriminant(a, b);
  const smooth = isSmooth(a, b);

  return (
    <LevelLayout
      canvasSlot={<canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />}
      sideSlot={<>
        <LoreBox>
          <strong>Captain's log:</strong> Our enemies hide treasure coordinates on an elliptic curve. Any point (x, y) satisfying this equation is a valid hiding spot.
        </LoreBox>

        <div>
          <SectionTitle>The Equation</SectionTitle>
          <div style={{ background: 'var(--sea-mid)', border: '1px solid var(--gold-dim)', borderRadius: 8, padding: '12px 16px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)', textAlign: 'center', letterSpacing: 0.5 }}>
            y² = x³ {a >= 0 ? '+' : ''}{a}x {b >= 0 ? '+' : ''}{b}
          </div>
        </div>

        <div>
          <SectionTitle>Tune the Curve</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SliderRow label="a" min={-5} max={2} value={a} onChange={setA} />
            <SliderRow label="b" min={-3} max={4} value={b} onChange={setB} />
          </div>
        </div>

        <div>
          <SectionTitle>Discriminant Check</SectionTitle>
          <div style={{
            background: smooth ? 'rgba(39,174,96,0.08)' : 'rgba(192,57,43,0.08)',
            border: `1px solid ${smooth ? 'rgba(39,174,96,0.3)' : 'rgba(192,57,43,0.3)'}`,
            borderLeft: `3px solid ${smooth ? 'var(--green)' : 'var(--red)'}`,
            borderRadius: '0 6px 6px 0',
            padding: '9px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: smooth ? 'var(--green)' : '#e74c3c',
          }}>
            Δ = -16(4a³ + 27b²) = {disc.toFixed(0)}<br />
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              {smooth ? '✓ Non-singular — valid for ECC' : '✗ Singular curve — NOT valid for crypto!'}
            </span>
          </div>
        </div>

        <div>
          <SectionTitle>What Makes It Special</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#8a9a9a', lineHeight: 1.5 }}>
            <div>→ Symmetric about the x-axis (y² means ±y both work)</div>
            <div>→ At most 3 roots (cubic in x)</div>
            <div>→ Smooth = no cusps, no self-intersections</div>
            <div>→ These properties enable the group law in Level 2 →</div>
          </div>
        </div>

        <Hint>
          Try dragging <strong>a</strong> to −4 and <strong>b</strong> to 0 to see the curve split into two components. When Δ = 0, the curve degenerates — game over for crypto.
        </Hint>
      </>}
    />
  );
}
