// ─── ECC Math Utilities ───────────────────────────────────────────────────────
// Pure functions. No side effects. All the real math lives here.

// ── Real-number curve ─────────────────────────────────────────────────────────

export function isOnCurve(x, y, a, b) {
  return Math.abs(y * y - (x * x * x + a * x + b)) < 1e-6;
}

export function curveY(x, a, b) {
  const r = x * x * x + a * x + b;
  if (r < 0) return null;
  return Math.sqrt(r);
}

export function discriminant(a, b) {
  return -16 * (4 * a * a * a + 27 * b * b);
}

export function isSmooth(a, b) {
  return Math.abs(discriminant(a, b)) > 1e-6;
}

// Real-number point addition (returns null for point at infinity)
export function pointAdd(P, Q, a) {
  if (!P) return Q;
  if (!Q) return P;

  const [px, py] = P;
  const [qx, qy] = Q;

  // P + (-P) = infinity
  if (Math.abs(px - qx) < 1e-10 && Math.abs(py + qy) < 1e-10) return null;

  let s;
  if (Math.abs(px - qx) < 1e-10 && Math.abs(py - qy) < 1e-10) {
    // Point doubling
    if (Math.abs(py) < 1e-10) return null;
    s = (3 * px * px + a) / (2 * py);
  } else {
    if (Math.abs(px - qx) < 1e-10) return null;
    s = (qy - py) / (qx - px);
  }

  const rx = s * s - px - qx;
  const ry = s * (px - rx) - py;
  return [rx, ry];
}

// Scalar multiplication over reals (for visualisation only, small k)
export function scalarMul(k, G, a) {
  if (k === 0 || !G) return null;
  let result = null;
  let addend = G;
  let n = Math.abs(k);
  const steps = [];
  while (n > 0) {
    if (n & 1) {
      steps.push({ type: 'add', current: result, addend });
      result = pointAdd(result, addend, a);
    }
    steps.push({ type: 'double', point: addend });
    addend = pointAdd(addend, addend, a);
    n >>= 1;
  }
  return { result, steps };
}

// ── Finite field (mod p) ──────────────────────────────────────────────────────

export function modp(n, p) {
  return ((n % p) + p) % p;
}

export function modInverse(a, p) {
  // Extended Euclidean
  let [old_r, r] = [a, p];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return modp(old_s, p);
}

export function fpPointAdd(P, Q, a, p) {
  if (!P) return Q;
  if (!Q) return P;

  const [px, py] = P;
  const [qx, qy] = Q;

  if (px === qx && modp(py + qy, p) === 0) return null; // infinity

  let s;
  if (px === qx && py === qy) {
    if (py === 0) return null;
    const num = modp(3 * px * px + a, p);
    const den = modp(2 * py, p);
    s = modp(num * modInverse(den, p), p);
  } else {
    if (px === qx) return null;
    const num = modp(qy - py, p);
    const den = modp(qx - px, p);
    s = modp(num * modInverse(den, p), p);
  }

  const rx = modp(s * s - px - qx, p);
  const ry = modp(s * (px - rx) - py, p);
  return [rx, ry];
}

export function fpScalarMul(k, G, a, p) {
  if (k === 0 || !G) return null;
  let result = null;
  let addend = [...G];
  let n = k;
  const trail = []; // all intermediate kG points

  while (n > 0) {
    if (n & 1) result = fpPointAdd(result, addend, a, p);
    if (result) trail.push([...result]);
    addend = fpPointAdd(addend, addend, a, p);
    n >>= 1;
  }
  return { result, trail };
}

export function getAllCurvePoints(a, b, p) {
  const pts = [];
  for (let x = 0; x < p; x++) {
    const rhs = modp(x * x * x + a * x + b, p);
    for (let y = 0; y < p; y++) {
      if (modp(y * y, p) === rhs) pts.push([x, y]);
    }
  }
  return pts;
}

// Order of a point (how many times you add before getting back to G)
export function pointOrder(G, a, p, maxIter = 500) {
  if (!G) return 0;
  let P = [...G];
  for (let k = 1; k <= maxIter; k++) {
    if (!P) return k;
    P = fpPointAdd(P, G, a, p);
    if (!P) return k + 1;
  }
  return null; // didn't find it
}

// Brute-force discrete log: find k such that k*G = T
export function bruteForceLog(T, G, a, p, maxIter = 500) {
  if (!T || !G) return null;
  let P = [...G];
  for (let k = 1; k <= maxIter; k++) {
    if (P && P[0] === T[0] && P[1] === T[1]) return k;
    P = fpPointAdd(P, G, a, p);
    if (!P) break;
  }
  return null;
}

// ── ECDH ─────────────────────────────────────────────────────────────────────

export function ecdhKeyExchange(alicePriv, bobPriv, G, a, p) {
  const alicePub = fpScalarMul(alicePriv, G, a, p).result;
  const bobPub = fpScalarMul(bobPriv, G, a, p).result;
  const aliceShared = alicePub ? fpScalarMul(bobPriv, alicePub, a, p).result : null;
  const bobShared = bobPub ? fpScalarMul(alicePriv, bobPub, a, p).result : null;
  return { alicePub, bobPub, aliceShared, bobShared };
}
