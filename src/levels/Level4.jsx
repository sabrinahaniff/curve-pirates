import { useState, useEffect, useRef } from 'react';
import { fpPointAdd, fpScalarMul, getAllCurvePoints, pointOrder, bruteForceLog } from '../utils/ecc';
import { LevelLayout, LoreBox, SectionTitle, Hint } from '../components/UI';

const A = -1, B = 1;

export default function Level4() {
  const [p, setP] = useState(23);
  const [secretK, setSecretK] = useState(7);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [found, setFound] = useState(false);
  const [bruteRunning, setBruteRunning] = useState(false);
  const [bruteStep, setBruteStep] = useState(0);
  const [timeMs, setTimeMs] = useState(null);
  const bruteRef = useRef(null);

  const allPts = getAllCurvePoints(A, B, p);
  const G = allPts[0] || null;
  const { result: publicKey } = G ? fpScalarMul(secretK, G, A, p) : { result: null };

  function handleGuess() {
    const g = parseInt(guess);
    if (isNaN(g)) return;
    setAttempts(a => a + 1);
    const { result } = fpScalarMul(g, G, A, p);
    if (result && publicKey && result[0] === publicKey[0] && result[1] === publicKey[1]) {
      setFound(true);
    }
  }

  function reset() {
    setGuess(''); setAttempts(0); setFound(false);
    setBruteStep(0); setTimeMs(null);
    if (bruteRef.current) clearInterval(bruteRef.current);
    setBruteRunning(false);
  }

  function startBrute() {
    if (!G || !publicKey) return;
    setBruteRunning(true);
    setBruteStep(0);
    setFound(false);
    const start = performance.now();
    let k = 1;
    let current = [...G];

    bruteRef.current = setInterval(() => {
      if (!current) { clearInterval(bruteRef.current); setBruteRunning(false); return; }
      setBruteStep(k);
      if (current[0] === publicKey[0] && current[1] === publicKey[1]) {
        setFound(true);
        setTimeMs(performance.now() - start);
        clearInterval(bruteRef.current);
        setBruteRunning(false);
        return;
      }
      current = fpPointAdd(current, G, A, p);
      k++;
      if (k > 500) { clearInterval(bruteRef.current); setBruteRunning(false); }
    }, 40);
  }

  useEffect(() => () => { if (bruteRef.current) clearInterval(bruteRef.current); }, []);

  const order = G ? pointOrder(G, A, p, 300) : null;

  // Bit size comparison
  const realBits = 256;
  const realOps = '2^128'; // BSGS complexity ,sqrt(n)

  return (
    <LevelLayout
      canvasSlot={
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, height: '100%', overflowY: 'auto' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gold)', letterSpacing: 1, marginBottom: 16 }}>THE DISCRETE LOG PROBLEM</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--parchment)', lineHeight: 2 }}>
              <div>G = <span style={{ color: '#e8c87a' }}>{G ? `(${G[0]}, ${G[1]})` : '-'}</span></div>
              <div>Public key = k·G = <span style={{ color: '#2ecc71' }}>{publicKey ? `(${publicKey[0]}, ${publicKey[1]})` : '-'}</span></div>
              <div style={{ color: 'var(--ink-muted)' }}>Find k = <span style={{ color: found ? '#2ecc71' : '#e74c3c' }}>???</span></div>
            </div>
          </div>

          {/* Brute force visualizer */}
          <div style={{ background: 'var(--sea-card)', border: '1px solid var(--sea-border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.5, color: 'var(--ink-muted)', marginBottom: 12 }}>
              BRUTE FORCE ATTACK
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, minHeight: 80 }}>
              {Array.from({ length: Math.min(order || 30, 30) }, (_, i) => {
                const n = i + 1;
                const isTarget = n === secretK;
                const isPassed = bruteStep >= n;
                const isCurrent = bruteStep === n;
                return (
                  <div key={n} style={{
                    width: 36, height: 36, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    background: found && isTarget ? '#27ae60' : isCurrent ? '#c8a84b' : isPassed ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.05)',
                    color: found && isTarget ? 'white' : isCurrent ? 'var(--ink)' : isPassed ? 'var(--gold)' : '#4a5a6a',
                    border: `1px solid ${found && isTarget ? '#2ecc71' : isPassed ? 'rgba(200,168,75,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.1s',
                    fontWeight: isTarget ? 700 : 400,
                  }}>
                    {n}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-sm" onClick={startBrute} disabled={bruteRunning}>
                {bruteRunning ? '⟳ Scanning...' : '▶ Start Brute Force'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={reset}>Reset</button>
              {found && timeMs !== null && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#2ecc71' }}>
                  Found k={secretK} in {timeMs.toFixed(1)}ms ({bruteStep} steps)
                </span>
              )}
            </div>
          </div>

          {/* Manual guess */}
          <div style={{ background: 'var(--sea-card)', border: '1px solid var(--sea-border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.5, color: 'var(--ink-muted)', marginBottom: 12 }}>
              TRY IT YOURSELF
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number" value={guess} onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuess()}
                placeholder="Guess k..."
                style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--sea-light)', borderRadius: 6, padding: '8px 12px', color: 'var(--parchment)', fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none' }}
              />
              <button className="btn btn-sm" onClick={handleGuess}>Try</button>
            </div>
            {attempts > 0 && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: found ? '#2ecc71' : '#e74c3c' }}>
                {found ? `✓ Correct! k = ${secretK}. ${attempts} attempt${attempts > 1 ? 's' : ''}.` : `✗ Wrong. ${attempts} attempt${attempts > 1 ? 's' : ''} so far.`}
              </div>
            )}
          </div>

          {/* Real-world scale */}
          <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.5, color: '#e74c3c', marginBottom: 10 }}>
              WHY THIS IS HARD IN THE REAL WORLD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#8a9a9a' }}>
              <div>This toy: p ≈ {p} → brute force in milliseconds</div>
              <div>secp256k1: p ≈ 2²⁵⁶ → ~2¹²⁸ operations to brute force</div>
              <div>Best known attack (BSGS): still ~{realOps} ops</div>
              <div style={{ color: '#e74c3c', marginTop: 4 }}>At 10⁹ ops/sec: longer than the age of the universe ♾</div>
            </div>
          </div>
        </div>
      }
      sideSlot={<>
        <LoreBox>
          <strong>The wall:</strong> Given G and k·G, find k. Easy in one direction, computationally impossible in reverse. This asymmetry IS cryptography.
        </LoreBox>

        <div>
          <SectionTitle>Toy Curve</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', minWidth: 16 }}>p</span>
              <input type="range" min={11} max={31} step={2} value={p} onChange={e => { setP(Number(e.target.value)); reset(); }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--gold-light)', minWidth: 24 }}>{p}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--red)', minWidth: 16 }}>k</span>
              <input type="range" min={2} max={Math.min(order || 20, 29)} value={Math.min(secretK, order || 20)} onChange={e => { setSecretK(Number(e.target.value)); reset(); }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#e74c3c', minWidth: 24 }}>{secretK} 🔒</span>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-muted)' }}>
            Points on curve: {allPts.length} · Order of G: {order ?? '?'}
          </div>
        </div>

        <div>
          <SectionTitle>The Problem</SectionTitle>
          <div style={{ fontSize: 13, color: '#8a9a9a', lineHeight: 1.7 }}>
            <div>Forward: <span style={{ color: '#2ecc71' }}>easy</span></div>
            <div style={{ paddingLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--parchment)', marginBottom: 6 }}>k, G → k·G</div>
            <div>Backward: <span style={{ color: '#e74c3c' }}>hard</span></div>
            <div style={{ paddingLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--parchment)' }}>k·G, G → k = ???</div>
          </div>
        </div>

        <div>
          <SectionTitle>Known Attacks</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#6a7a8a', lineHeight: 1.5 }}>
            <div>Brute force: O(n)</div>
            <div>Baby-step Giant-step: O(√n)</div>
            <div>Pollard's ρ: O(√n), less memory</div>
            <div style={{ color: 'var(--gold)', marginTop: 4 }}>None are polynomial time. ECC relies on this.</div>
          </div>
        </div>

        <Hint>Notice: you can <em>verify</em> any guess instantly (just compute k·G), but finding the right k requires trying them all.</Hint>
      </>}
    />
  );
}
