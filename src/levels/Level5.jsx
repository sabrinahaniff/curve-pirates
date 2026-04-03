import { useState } from 'react';
import { fpScalarMul, getAllCurvePoints } from '../utils/ecc';
import { LevelLayout, LoreBox, SectionTitle, Hint, Formula } from '../components/UI';

const A = -1, B = 1, P = 23;

export default function Level5() {
  const [alicePriv, setAlicePriv] = useState(6);
  const [bobPriv, setBobPriv] = useState(9);
  const [step, setStep] = useState(0);

  const allPts = getAllCurvePoints(A, B, P);
  const G = allPts[0];

  const alicePub = G ? fpScalarMul(alicePriv, G, A, P).result : null;
  const bobPub   = G ? fpScalarMul(bobPriv,   G, A, P).result : null;
  const aliceShared = bobPub  ? fpScalarMul(alicePriv, bobPub,  A, P).result : null;
  const bobShared   = alicePub ? fpScalarMul(bobPriv,  alicePub, A, P).result : null;

  const match = aliceShared && bobShared &&
    aliceShared[0] === bobShared[0] && aliceShared[1] === bobShared[1];

  const steps = [
    {
      title: 'Public parameters',
      desc: 'Alice and Bob agree on a curve E and generator point G. This is public.',
      highlight: 'G',
    },
    {
      title: 'Alice picks private key',
      desc: `Alice secretly picks a = ${alicePriv}. Nobody else knows this.`,
      highlight: 'alice-priv',
    },
    {
      title: 'Bob picks private key',
      desc: `Bob secretly picks b = ${bobPriv}. Nobody else knows this.`,
      highlight: 'bob-priv',
    },
    {
      title: 'Alice publishes A = a·G',
      desc: 'Alice computes her public key and publishes it. Safe, reversing it requires solving ECDLP.',
      highlight: 'alice-pub',
    },
    {
      title: 'Bob publishes B = b·G',
      desc: 'Bob does the same.',
      highlight: 'bob-pub',
    },
    {
      title: 'Shared secret',
      desc: `Alice computes a·B = a·(b·G). Bob computes b·A = b·(a·G). Both equal ab·G! 🎉`,
      highlight: 'shared',
    },
  ];

  const fmt = pt => pt ? `(${pt[0]}, ${pt[1]})` : '∞';

  return (
    <LevelLayout
      canvasSlot={
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {steps.map((s, i) => (
              <div key={i} onClick={() => setStep(i)} style={{
                flex: 1, height: 4, borderRadius: 2, cursor: 'pointer',
                background: i <= step ? 'var(--gold)' : 'rgba(200,168,75,0.15)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          {/* Current step callout */}
          <div style={{ background: 'var(--sea-card)', border: '1px solid var(--sea-border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', marginBottom: 8 }}>
              STEP {step + 1} / {steps.length} · {steps[step].title.toUpperCase()}
            </div>
            <div style={{ fontSize: 15, color: 'var(--parchment)', lineHeight: 1.6 }}>{steps[step].desc}</div>
          </div>

          {/* The exchange diagram */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 0, alignItems: 'start' }}>
            {/* Alice */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#e8c87a', textAlign: 'center', paddingBottom: 6, borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                Alice 🏴‍☠️
              </div>
              <KeyBox label="Private key (secret)" value={`a = ${alicePriv}`} color="#8e44ad" visible={step >= 1} secret />
              <KeyBox label="Public key A = a·G" value={fmt(alicePub)} color="#3498db" visible={step >= 3} />
              <KeyBox label="Receives B from Bob" value={fmt(bobPub)} color="#2980b9" visible={step >= 5} dim />
              <KeyBox label="Computes a·B" value={fmt(aliceShared)} color="#2ecc71" visible={step >= 5} highlight={match} />
            </div>

            {/* Middle channel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', paddingTop: 38 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: 'var(--ink-muted)', letterSpacing: 1 }}>PUBLIC</div>
              {step >= 0 && <Arrow label="G" />}
              {step >= 3 && <Arrow label="A" />}
              {step >= 4 && <Arrow label="B" flipped />}
            </div>

            {/* Bob */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#e8c87a', textAlign: 'center', paddingBottom: 6, borderBottom: '1px solid rgba(200,168,75,0.2)' }}>
                Bob 🗺️
              </div>
              <KeyBox label="Private key (secret)" value={`b = ${bobPriv}`} color="#8e44ad" visible={step >= 2} secret />
              <KeyBox label="Public key B = b·G" value={fmt(bobPub)} color="#3498db" visible={step >= 4} />
              <KeyBox label="Receives A from Alice" value={fmt(alicePub)} color="#2980b9" visible={step >= 5} dim />
              <KeyBox label="Computes b·A" value={fmt(bobShared)} color="#2ecc71" visible={step >= 5} highlight={match} />
            </div>
          </div>

          {/* Match result */}
          {step >= 5 && match && (
            <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 10, padding: 16, textAlign: 'center', animation: 'fadeIn 0.4s' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#2ecc71', marginBottom: 4 }}>
                ✓ SHARED SECRET ESTABLISHED
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--parchment)' }}>
                ab·G = {fmt(aliceShared)}
              </div>
              <div style={{ fontSize: 13, color: '#6a8a6a', marginTop: 6 }}>
                An eavesdropper sees G, A, B but can't compute the shared secret without solving ECDLP.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← Previous</button>
            <button className="btn btn-sm" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next →</button>
          </div>
        </div>
      }
      sideSlot={<>
        <LoreBox>
          <strong>The miracle:</strong> Two pirates publicly negotiate a secret that nobody eavesdropping can reconstruct. Zero prior contact needed.
        </LoreBox>

        <div>
          <SectionTitle>Private Keys</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#8e44ad', minWidth: 40 }}>Alice a</span>
              <input type="range" min={2} max={20} value={alicePriv} onChange={e => setAlicePriv(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#8e44ad', minWidth: 20 }}>{alicePriv}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#e67e22', minWidth: 40 }}>Bob b</span>
              <input type="range" min={2} max={20} value={bobPriv} onChange={e => setBobPriv(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#e67e22', minWidth: 20 }}>{bobPriv}</span>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>The Math</SectionTitle>
          <Formula lines={[
            'A = {a·G}  (Alice public)',
            'B = {b·G}  (Bob public)',
            'Alice: {a·B} = a·b·G',
            'Bob:   {b·A} = b·a·G',
            '→ Same point! ✓',
          ]} />
        </div>

        <div>
          <SectionTitle>What the Eavesdropper Sees</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#e74c3c' }}>
            <div>G = {fmt(G)}</div>
            <div>A = {fmt(alicePub)}</div>
            <div>B = {fmt(bobPub)}</div>
            <div style={{ color: 'var(--ink-muted)', marginTop: 4, fontSize: 11 }}>They'd need a and b to compute ab·G. That's ECDLP.</div>
          </div>
        </div>

        <Hint>Change Alice or Bob's private key, the shared secret updates automatically. Both always agree.</Hint>
      </>}
    />
  );
}

function KeyBox({ label, value, color, visible, secret, dim, highlight }) {
  return (
    <div style={{
      background: visible ? (highlight ? 'rgba(39,174,96,0.12)' : 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.02)',
      border: `1px solid ${visible ? (highlight ? 'rgba(39,174,96,0.4)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)'}`,
      borderRadius: 8,
      padding: '10px 12px',
      transition: 'all 0.3s',
      opacity: visible ? (dim ? 0.7 : 1) : 0.3,
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 4 }}>
        {label} {secret && visible && '🔒'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: visible ? color : '#3a4a5a' }}>
        {visible ? value : '???'}
      </div>
    </div>
  );
}

function Arrow({ label, flipped }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, margin: '4px 0' }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-display)', color: 'var(--gold)', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, color: 'rgba(200,168,75,0.5)' }}>{flipped ? '←' : '→'}</div>
    </div>
  );
}
