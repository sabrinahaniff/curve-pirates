# Curve Pirates

> An interactive ECC (Elliptic Curve Cryptography) playground disguised as a pirate game.
<img width="1467" height="806" alt="image" src="https://github.com/user-attachments/assets/04635eec-a9ce-4303-a3f8-98883b6fef4b" />

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

<img width="1457" height="801" alt="image" src="https://github.com/user-attachments/assets/349d0e84-64ba-4d57-bc87-1535de50fde1" />
<img width="1465" height="808" alt="image" src="https://github.com/user-attachments/assets/6069f8b1-dfa0-42f3-8304-02dffbe4344f" />
<img width="1457" height="793" alt="image" src="https://github.com/user-attachments/assets/5368d4a3-4bec-4a01-9ae7-c408449af0dc" />



## The math

All ECC operations are implemented from scratch in `src/utils/ecc.js`, no crypto libraries. 

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

Mainly built for my understanding for ECC.
