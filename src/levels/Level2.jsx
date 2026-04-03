import { useRef, useState, useEffect, useCallback } from 'react';
import { curveY, pointAdd } from '../utils/ecc';
import { drawGrid, drawCurve, drawPoint } from '../hooks/useECCCanvas';
import { LevelLayout, LoreBox, SectionTitle, PointRow, Formula, Hint } from '../components/UI';

const A = -2, B = 2;

export default function Level2() {
  const canvasRef = useRef(null);
  const infoRef = useRef({ W: 0, H: 0, ox: 0, oy: 0, scale: 1 });
  const draggingRef = useRef(null);

  const [Px, setPx] = useState(1.6);
  const [Qx, setQx] = useState(-1.1);
  const state = useRef({ Px: 1.6, Qx: -1.1 });

  const toScreen = useCallback((x, y) => {
    const { ox, oy, scale } = infoRef.current;
    return [ox + x * scale, oy - y * scale];
  }, []);

  const fromScreen = useCallback((sx) => {
    const { ox, scale } = infoRef.current;
    return (sx - ox) / scale;
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
    drawCurve(ctx, info, toScreen, A, B);

    const px = state.current.Px, qx = state.current.Qx;
    const py = curveY(px, A, B);
    const qy = curveY(qx, A, B);
    if (py === null || qy === null) return;

    const P = [px, py], Q = [qx, qy];
    const R = pointAdd(P, Q, A);

    // Draw secant / tangent line
    const isDoubling = Math.abs(px - qx) < 0.01;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(200,168,75,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ext = 3.5;
    if (isDoubling) {
      const s = (3 * px * px + A) / (2 * py);
      const [lx1, ly1] = toScreen(px - ext, py - s * ext);
      const [lx2, ly2] = toScreen(px + ext, py + s * ext);
      ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2);
    } else {
      const s = (qy - py) / (qx - px);
      const [lx1, ly1] = toScreen(px - ext, py - s * ext);
      const [lx2, ly2] = toScreen(qx + ext, qy + s * ext);
      ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2);
    }
    ctx.stroke();
    ctx.restore();

    if (R) {
      // Draw reflection line
      const [srx, sry] = toScreen(R[0], R[1]);
      const [srx2, sry2] = toScreen(R[0], -R[1]);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(46,204,113,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(srx, sry); ctx.lineTo(srx2, sry2);
      ctx.stroke(); ctx.restore();

      // R' (third intersection, before reflection)
      drawPoint(ctx, srx, sry, 'rgba(46,204,113,0.4)', '', 5);
      // R = P + Q
      drawPoint(ctx, srx2, sry2, '#2ecc71', 'R', 8);
    }

    // P & Q
    const [spx, spy] = toScreen(px, py);
    const [sqx, sqy] = toScreen(qx, qy);
    drawPoint(ctx, spx, spy, '#e74c3c', 'P', 8);
    drawPoint(ctx, sqx, sqy, '#3498db', 'Q', 8);
  }, [toScreen]);

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

  const getEventX = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return clientX - rect.left;
  };

  const getClosestPoint = (sx) => {
    const wx = fromScreen(sx);
    const px = state.current.Px, qx = state.current.Qx;
    const py = curveY(px, A, B), qy = curveY(qx, A, B);
    const [spx, spy] = toScreen(px, py ?? 0);
    const [sqx, sqy] = toScreen(qx, qy ?? 0);
    const sy = canvasRef.current.getBoundingClientRect().height / 2; // approx
    if (Math.abs(spx - sx) < 16) return 'P';
    if (Math.abs(sqx - sx) < 16) return 'Q';
    return null;
  };

  const handleMove = useCallback((sx) => {
    if (!draggingRef.current) return;
    const wx = fromScreen(sx);
    if (draggingRef.current === 'P') {
      state.current.Px = wx;
      setPx(wx);
    } else {
      state.current.Qx = wx;
      setQx(wx);
    }
    redraw();
  }, [fromScreen, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDown = (e) => {
      const sx = getEventX(e);
      draggingRef.current = getClosestPoint(sx);
    };
    const onMove = (e) => {
      if (e.touches) e.preventDefault();
      handleMove(getEventX(e));
    };
    const onUp = () => { draggingRef.current = null; };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [handleMove]);

  const py = curveY(Px, A, B);
  const qy = curveY(Qx, A, B);
  const P = py !== null ? [Px, py] : null;
  const Q = qy !== null ? [Qx, qy] : null;
  const R = P && Q ? pointAdd(P, Q, A) : null;
  const Rf = R ? [R[0], -R[1]] : null;

  return (
    <LevelLayout
      canvasSlot={<canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }} />}
      sideSlot={<>
        <LoreBox>
          <strong>The trick:</strong> Draw a line through P and Q. It hits the curve at a 3rd point. Reflect it over the x-axis. That reflection is P + Q.
        </LoreBox>

        <div>
          <SectionTitle>Points</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PointRow color="#e74c3c" label="P" coords={P} />
            <PointRow color="#3498db" label="Q" coords={Q} />
            <PointRow color="#2ecc71" label="P+Q" coords={Rf} />
          </div>
        </div>

        <div>
          <SectionTitle>The Slope Formula</SectionTitle>
          <Formula lines={[
            's = {(yQ − yP) / (xQ − xP)}',
            'xR = {s² − xP − xQ}',
            'yR = {s(xP − xR) − yP}',
          ]} />
        </div>

        <div>
          <SectionTitle>Special Cases</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#8a9a9a', lineHeight: 1.5 }}>
            <div>→ <strong style={{ color: 'var(--gold-light)' }}>P = Q</strong>: use the tangent line (slope via calculus)</div>
            <div>→ <strong style={{ color: 'var(--gold-light)' }}>Vertical line</strong>: hits curve at ∞ (the identity)</div>
            <div>→ <strong style={{ color: 'var(--gold-light)' }}>P + ∞ = P</strong>: ∞ is the zero element</div>
          </div>
        </div>

        <div>
          <SectionTitle>Why This Matters</SectionTitle>
          <div style={{ fontSize: 13, color: '#8a9a9a', lineHeight: 1.6 }}>
            This rule makes the curve a <em style={{ color: 'var(--parchment)' }}>group</em>  closed, associative, has identity, has inverses. That group structure is the entire foundation of ECC.
          </div>
        </div>

        <Hint>Drag the red (P) or blue (Q) dot along the curve. The dashed line is the secant, the green line is the reflection.</Hint>
      </>}
    />
  );
}
