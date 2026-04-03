# ☠ Curve Pirates

> An interactive ECC (Elliptic Curve Cryptography) playground disguised as a pirate game.

Live at: [curve-pirates.vercel.app](https://curve-pirates.vercel.app) *(deploy to update)*

## What it teaches

Each level is a standalone interactive module:

| Level | Concept | What you do |
|---|---|---|
| 1 | Elliptic Curves | Morph the curve with sliders, watch the discriminant |
| 2 | Point Addition | Drag P and Q, see the secant + reflection live |
| 3 | Scalar Multiplication | Animate k·G over a finite field, explore group order |
| 4 | Discrete Log | Brute-force attack a toy curve, feel the wall |
| 5 | ECDH | Step through a full key exchange, adjust both parties |
| 6 | ECDSA | Sign messages, tamper with them, watch verification fail |

## The math

All ECC operations are implemented from scratch in `src/utils/ecc.js` — no crypto libraries. This is intentional: reading the source is part of the learning.

Covers:
- Real-number point addition and doubling
- Modular arithmetic + modular inverse (extended Euclidean)
- Finite field scalar multiplication (double-and-add)
- ECDH key exchange
- ECDSA signing and verification

## Stack

- React + Vite
- Canvas API for curve visualization
- Zero dependencies beyond React

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

Or push to GitHub and connect the repo on [vercel.com](https://vercel.com).

---

Built as a study tool for CIS4520 (Introduction to Cryptography).
