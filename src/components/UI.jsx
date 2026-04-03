import { useState } from 'react';

// ── Top nav ───────────────────────────────────────────────────────────────────
export function TopNav({ currentLevel, onNavigate }) {
  const levels = [
    { id: 1, name: 'The Curve' },
    { id: 2, name: 'Point Addition' },
    { id: 3, name: 'Scalar Mult' },
    { id: 4, name: 'Discrete Log' },
    { id: 5, name: 'ECDH' },
    { id: 6, name: 'ECDSA' },
  ];

  return (
    <header style={{
      background: 'var(--sea-card)',
      borderBottom: '2px solid var(--gold-dim)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: '52px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>☠</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}>
          Curve Pirates
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--ink-muted)', letterSpacing: 1, paddingTop: 2 }}>
          · ECC PLAYGROUND
        </span>
      </div>
      <nav style={{ display: 'flex', gap: 2 }}>
        {levels.map(l => (
          <button
            key={l.id}
            onClick={() => onNavigate(l.id)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              padding: '6px 12px',
              background: currentLevel === l.id ? 'rgba(200,168,75,0.15)' : 'transparent',
              border: 'none',
              borderBottom: currentLevel === l.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: currentLevel === l.id ? 'var(--gold)' : '#6a7a8a',
              cursor: 'pointer',
              transition: 'color 0.15s',
              height: '52px',
            }}
          >
            <span style={{ opacity: 0.5, marginRight: 4 }}>{l.id}.</span>{l.name}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ── Two-pane layout ───────────────────────────────────────────────────────────
export function LevelLayout({ canvasSlot, sideSlot }) {
  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', background: '#0a1822' }}>
        {canvasSlot}
      </div>
      <aside style={{
        width: 320,
        flexShrink: 0,
        background: 'var(--sea-card)',
        borderLeft: '1px solid var(--sea-border)',
        overflowY: 'auto',
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        {sideSlot}
      </aside>
    </div>
  );
}

// ── Lore box ──────────────────────────────────────────────────────────────────
export function LoreBox({ children }) {
  return <div className="lore">{children}</div>;
}

// ── Hint box ─────────────────────────────────────────────────────────────────
export function Hint({ children }) {
  return <div className="hint">{children}</div>;
}

// ── Section title ─────────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

// ── Slider row ────────────────────────────────────────────────────────────────
export function SliderRow({ label, min, max, step = 1, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--gold)', minWidth: 24 }}>
        {label}
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold-light)', minWidth: 28, textAlign: 'right', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

// ── Formula block ─────────────────────────────────────────────────────────────
export function Formula({ lines }) {
  return (
    <div className="formula">
      {lines.map((line, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\{(.+?)\}/g, '<span class="hl">$1</span>') }} />
      ))}
    </div>
  );
}

// ── Point row display ────────────────────────────────────────────────────────
export function PointRow({ color, label, coords }) {
  const fmt = coords ? `(${coords[0].toFixed(2)}, ${coords[1].toFixed(2)})` : '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color, minWidth: 36 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--parchment)' }}>{fmt}</span>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--sea-border)', marginBottom: 14 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.8px',
          padding: '7px 14px',
          background: 'transparent',
          border: 'none',
          borderBottom: active === t.id ? '2px solid var(--gold)' : '2px solid transparent',
          marginBottom: -1,
          color: active === t.id ? 'var(--gold)' : '#6a7a8a',
          cursor: 'pointer',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
