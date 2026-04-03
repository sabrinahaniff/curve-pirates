import { useState, useCallback } from 'react';
import { fpScalarMul, fpPointAdd, getAllCurvePoints, pointOrder, modInverse, modp } from '../utils/ecc';
import { LevelLayout, LoreBox, SectionTitle, Hint, Formula } from '../components/UI';

const A = -1, B = 1, P = 23;

// Simple hash: sum of char codes mod order
function simHash(msg, n) {
  let h = 0;
  for (const c of msg) h = (h * 31 + c.charCodeAt(0)) % n;
  return Math.max(1, h);
}

export default function Level6() {
  const [message, setMessage] = useState('treasure at x=7');
  const [privKey, setPrivKey] = useState(7);
  const [nonce, setNonce] = useState(11); // k in ECDSA (ephemeral)
  const [verifyMsg, setVerifyMsg] = useState('treasure at x=7');
  const [tampered, setTampered] = useState(false);

  const allPts = getAllCurvePoints(A, B, P);
  const G = allPts[0];
  const n = pointOrder(G, A, P, 300) || 1;

  // Public key
  const pubKey = G ? fpScalarMul(privKey, G, A, P).result : null;

  // Sign
  const h = simHash(message, n);
  const R_pt = G ? fpScalarMul(nonce, G, A, P).result : null;
  const r = R_pt ? modp(R_pt[0], n) : 0;
  const kInv = r > 0 ? modInverse(modp(nonce, n), n) : 0;
  const s = r > 0 ? modp(kInv * (h + privKey * r), n) : 0;

  // Verify
  const hv = simHash(tampered ? verifyMsg + '!' : verifyMsg, n);
  const sInv = s > 0 ? modInverse(s, n) : 0;
  const u1 = modp(hv * sInv, n);
  const u2 = modp(r * sInv, n);
  const u1G = G && u1 > 0 ? fpScalarMul(u1, G, A, P).result : null;
  const u2Q = pubKey && u2 > 0 ? fpScalarMul(u2, pubKey, A, P).result : null;
  const V_pt = u1G && u2Q ? fpPointAdd(u1G, u2Q, A, P) : null;
  const valid = V_pt && r > 0 && V_pt[0] === r;

  const fmt = pt => pt ? `(${pt[0]}, ${pt[1]})` : '∞';

  return (
    <LevelLayout
      canvasSlot={
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%', overflowY: 'auto' }}>

          {/* Signing */}
          <div style={{ background: 'var(--sea-card)', border: '1px solid var(--sea-border)', borderRadius: 10, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 2, color: '#8e44ad', marginBottom: 14 }}>
              ✍ SIGN (Alice's side)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-display)', color: 'var(--ink-muted)', letterSpacing: 1 }}>MESSAGE</label>
                <input value={message} onChange={e => setMessage(e.target.value)}
                  style={{ width: '100%', marginTop: 4, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--sea-light)', borderRadius: 6, padding: '8px 12px', color: 'var(--parchment)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <Stat label="Private key (d)" value={privKey} color="#8e44ad" />
                <Stat label="Nonce (k)" value={nonce} color="#e67e22" />
                <Stat label="Hash h(m)" value={h} color="#3498db" />
                <Stat label="r = (k·G).x mod n" value={r} color="#e74c3c" />
                <Stat label="s = k⁻¹(h + dr) mod n" value={s} color="#e74c3c" />
                <Stat label="Signature" value={s > 0 ? `(${r}, ${s})` : '—'} color="var(--gold)" />
              </div>
            </div>
          </div>

          {/* Verification */}
          <div style={{ background: 'var(--sea-card)', border: '1px solid var(--sea-border)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 2, color: '#27ae60' }}>
                🔍 VERIFY (Bob's side)
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#e74c3c' }}>
                <input type="checkbox" checked={tampered} onChange={e => setTampered(e.target.checked)} />
                Tamper with message
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, color: tampered ? '#e74c3c' : 'var(--parchment)', border: `1px solid ${tampered ? 'rgba(231,76,60,0.3)' : 'transparent'}` }}>
                "{tampered ? verifyMsg + '!' : verifyMsg}"
                {tampered && <span style={{ marginLeft: 8, color: '#e74c3c' }}>← TAMPERED</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <Stat label="Public key Q" value={fmt(pubKey)} color="#3498db" />
                <Stat label="Signature (r, s)" value={`(${r}, ${s})`} color="var(--gold)" />
                <Stat label="Hash h(m)" value={hv} color="#3498db" dim={tampered} />
                <Stat label="u₁ = h·s⁻¹" value={u1} color="#9b59b6" />
                <Stat label="u₂ = r·s⁻¹" value={u2} color="#9b59b6" />
                <Stat label="V = u₁G + u₂Q" value={fmt(V_pt)} color={valid ? '#2ecc71' : '#e74c3c'} />
              </div>

              {/* Verdict */}
              <div style={{
                marginTop: 4,
                padding: '12px 16px',
                borderRadius: 8,
                background: valid ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)',
                border: `1px solid ${valid ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: valid ? '#2ecc71' : '#e74c3c',
                textAlign: 'center',
              }}>
                {valid
                  ? '✓ VALID SIGNATURE — message is authentic'
                  : '✗ INVALID SIGNATURE — message was tampered or wrong key'}
              </div>
            </div>
          </div>

          {/* Nonce warning */}
          <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#e74c3c', letterSpacing: 1, marginBottom: 6 }}>
              ⚠ THE NONCE IS CRITICAL
            </div>
            <div style={{ fontSize: 13, color: '#8a7a7a', lineHeight: 1.6 }}>
              If you reuse the same nonce k for two different messages, an attacker can recover your private key. This is exactly how Sony's PlayStation 3 was cracked in 2010.
            </div>
          </div>
        </div>
      }
      sideSlot={<>
        <LoreBox>
          <strong>ECDSA:</strong> Prove you signed a message with your private key. Anyone with your public key can verify — but only you could have produced it.
        </LoreBox>

        <div>
          <SectionTitle>Your Keys</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#8e44ad', minWidth: 40 }}>priv d</span>
              <input type="range" min={2} max={n - 1} value={Math.min(privKey, n - 1)} onChange={e => setPrivKey(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#8e44ad', minWidth: 20 }}>{privKey}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: '#e67e22', minWidth: 40 }}>nonce k</span>
              <input type="range" min={2} max={n - 1} value={Math.min(nonce, n - 1)} onChange={e => setNonce(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#e67e22', minWidth: 20 }}>{nonce}</span>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Signing</SectionTitle>
          <Formula lines={[
            '1. Choose random {k}',
            '2. R = {k·G},  r = R.x mod n',
            '3. s = {k⁻¹(h + d·r)} mod n',
            '4. Signature = {(r, s)}',
          ]} />
        </div>

        <div>
          <SectionTitle>Verifying</SectionTitle>
          <Formula lines={[
            '1. u₁ = {h·s⁻¹} mod n',
            '2. u₂ = {r·s⁻¹} mod n',
            '3. V = {u₁·G + u₂·Q}',
            '4. Valid if {V.x = r}',
          ]} />
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#4a6a7a' }}>
          <div>n (group order) = {n}</div>
          <div>Pub key Q = {fmt(pubKey)}</div>
        </div>

        <Hint>Toggle "tamper with message" — the verification instantly fails. The signature binds the content, key, and nonce together mathematically.</Hint>
      </>}
    />
  );
}

function Stat({ label, value, color, dim }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px', opacity: dim ? 0.5 : 1 }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-display)', letterSpacing: 1, color: 'var(--ink-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
