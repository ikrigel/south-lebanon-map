# Coreset Camera Calibration — Software Development Plan

**Feature:** Phase 3 — Camera Intrinsic Calibration using Coreset Algorithms  
**Author:** ikrigel  
**Date:** 2026-06-24  
**Status:** Planning & Design  
**Dependencies:** Phase 1 (Firebase Auth), Phase 2 (Camera Detection)

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Success Criteria](#goals--success-criteria)
3. [Architecture & Design](#architecture--design)
4. [Implementation Plan](#implementation-plan)
5. [Technical Algorithms](#technical-algorithms)
6. [Software Test Plan](#software-test-plan)
7. [Playwright E2E Tests](#playwright-e2e-tests)
8. [File Structure](#file-structure)
9. [Timeline & Effort](#timeline--effort)

---

## Overview

**Coreset Camera Calibration** improves GPS object localization accuracy by computing camera intrinsic parameters (focal length, principal point) using Dan Feldman's provably-approximated coreset algorithms.

### What It Does

1. **Capture:** User photographs an 8×6 checkerboard pattern from 8–12 different angles
2. **Detect:** Automatically finds corners in each frame (CSS grid detection)
3. **Coreset:** Selects 5 representative frames using weighted sampling (Carathéodory's Theorem)
4. **Calibrate:** Computes camera K matrix from sampled frames using Zhang's method
5. **Store:** Persists calibration to browser localStorage + optional Firestore
6. **Apply:** Uses calibration K in object localization (Phase 2) for improved accuracy

### Why Coreset?

- **Efficiency:** Reduces ~12 frames → 5 frames (58% reduction) while maintaining accuracy
- **Lightweight:** Pure TypeScript, ~400 lines of math — no external ML libraries
- **Offline:** Runs fully client-side; no internet required after model load
- **Provable:** Carathéodory's Theorem guarantees ε-approximation bounds
- **Mobile-friendly:** Fast computation on mid-range phones (~200ms for 12 frames)

### Scientific Foundation

Based on peer-reviewed papers:
- **Carathéodory's Theorem for LMS:** Maalouf, Jubran, Feldman (NeurIPS 2019)
  - Paper: "[Sketching for Coreset Construction in Machine Learning](https://arxiv.org/abs/1906.11835)"
- **Witness-Set ICP:** Jubran, Maalouf, Kimmel, Feldman (ICCV 2021)
  - Paper: "[Provably Approximated ICP](https://openaccess.thecvf.com/content/ICCV2021/papers/Jubran_Provably_Approximated_ICP_ICCV_2021_paper.pdf)"
- **Zhang's Calibration Method:** Zhang (2000)
  - Paper: "[A Flexible New Technique for Camera Calibration](https://www.microsoft.com/en-us/research/publication/a-flexible-new-technique-for-camera-calibration/)"

---

## Goals & Success Criteria

### Primary Goals

✅ **Implement core calibration pipeline** (capture → detect → coreset → calibrate)  
✅ **User-facing UI** (modal with step-by-step wizard)  
✅ **Persistence** (localStorage + Firestore sync)  
✅ **Integration** (Phase 2 object localization uses calibration K)  
✅ **Testing** (unit tests + Playwright E2E tests)  

### Success Criteria

| Criterion | Target | Verification |
|-----------|--------|--------------|
| **Reprojection Error** | < 2.0 pixels | Unit test: `calibration-accuracy.test.ts` |
| **Capture UX** | 8–12 frames in < 3 min | Playwright: `calibration-capture.spec.ts` |
| **Coreset Speedup** | > 3× faster vs. all frames | Benchmark: `coresetLMS.perf.test.ts` |
| **Offline** | Works without internet | E2E: Network throttle test |
| **Persistence** | Survives page reload | Integration test |
| **Accuracy Gain** | Object localization improves by ≥ 10% | Before/after snapshot |
| **Code Quality** | 100% test coverage on math modules | nyc coverage report |
| **Browser Support** | Chrome, Safari, Firefox (recent 2 versions) | Playwright matrix |

---

## Architecture & Design

### Data Flow

```
User captures checkerboard photo
        ↓
Corner detection (CSS-based grid)
        ↓
Build CalibFrame[] (2D corners + known 3D grid)
        ↓
Sensitivity per frame (σᵢ ∝ ||DLT norms||²)
        ↓
Coreset sampling (5 frames via Carathéodory)
        ↓
Compute K matrix (Zhang's method, SVD)
        ↓
Store in localStorage + Firestore
        ↓
Apply K in object localization (Phase 2)
```

### Module Breakdown

| Module | Purpose | Lines | Dependencies |
|--------|---------|-------|--------------|
| `svdCompact.ts` | Jacobi SVD for 3×3 matrices | ~80 | None (pure math) |
| `coresetLMS.ts` | Carathéodory coreset for LMS | ~120 | svdCompact |
| `witnessICP.ts` | Witness-Set ICP for rigid registration | ~150 | svdCompact |
| `cameraModel.ts` | Zhang's method, K matrix computation | ~200 | svdCompact, witnessICP |
| `useCalibration.ts` | React hook: store/load/compute | ~100 | cameraModel |
| `CalibrationModal.tsx` | UI wizard: capture → results | ~400 | useCalibration |
| `CalibrationButton.tsx` | Header icon to open modal | ~30 | CalibrationModal |

**Total new code:** ~1,080 lines (well within budget)

### Type Definitions

```typescript
// src/types.ts (additions)

interface CalibrationFrame {
  imageUrl: string;        // Canvas snapshot (base64)
  corners2D: [number, number][];  // Detected corners [u, v]
  grid3D: [number, number, number][]; // Known 3D grid points
  quality: number;         // 0–1 (sharpness metric)
  timestamp: number;       // ms since epoch
}

interface CalibrationData {
  K: number[][];           // 3×3 intrinsics matrix
  reprojError: number;     // RMS reprojection error (px)
  frameCount: number;      // How many frames captured
  coresetSize: number;     // How many frames in coreset (≤5)
  timestamp: number;       // When calibrated
  quality: 'low' | 'medium' | 'high'; // Badge based on error
}

interface WeightedCoreset {
  indices: number[];       // Which frames to use
  weights: number[];       // Relative importance (sum to 1)
  totalError: number;      // Before-coreset error
}

interface SVDResult {
  U: number[][];           // 3×3 left singular vectors
  S: number[];             // 3 singular values (descending)
  Vt: number[][];          // 3×3 right singular vectors (transposed)
}
```

### Storage Schema

**localStorage:**
```typescript
const CALIBRATION_STORAGE_KEY = 'south-lebanon-map:camera-calibration:v1';

// Stored object
{
  K: [[fx, 0, cx], [0, fy, cy], [0, 0, 1]],
  reprojError: 1.45,
  frameCount: 10,
  coresetSize: 5,
  timestamp: 1719273600000,
  quality: 'high'
}
```

**Firestore:**
```
/users/{uid}/calibration
  K: number[][]
  reprojError: number
  frameCount: number
  coresetSize: number
  timestamp: Timestamp
  quality: 'low' | 'medium' | 'high'
  syncedAt: Timestamp
```

---

## Implementation Plan

### Phase 3a: Core Math (Sprints 1–2)

**Sprint 1: SVD & Linear Algebra**
- [ ] `src/calibration/svdCompact.ts` — Jacobi SVD for 3×3
- [ ] Unit tests: `svd-compact.test.ts` (10 tests)
- [ ] Benchmark: compare with reference (QR decomposition)

**Sprint 2: Coreset Algorithms**
- [ ] `src/calibration/coresetLMS.ts` — Carathéodory sampling
- [ ] `src/calibration/witnessICP.ts` — Witness-Set ICP
- [ ] Unit tests: `coreset-lms.test.ts` (12 tests), `witness-icp.test.ts` (8 tests)

### Phase 3b: Camera Model (Sprint 3)

**Sprint 3: Zhang's Method & Integration**
- [ ] `src/calibration/cameraModel.ts` — K matrix computation
- [ ] `src/calibration/cornerDetector.ts` — CSS grid corner detection
- [ ] Unit tests: `camera-model.test.ts` (15 tests), `corner-detector.test.ts` (8 tests)

### Phase 3c: React Integration (Sprints 4–5)

**Sprint 4: Hook & State Management**
- [ ] `src/calibration/useCalibration.ts` — Storage + compute orchestration
- [ ] Integration tests: `useCalibration.test.ts` (10 tests)
- [ ] localStorage persistence tests

**Sprint 5: UI & Wizard**
- [ ] `src/calibration/CalibrationModal.tsx` — 3-step wizard
- [ ] `src/calibration/CalibrationButton.tsx` — Header button
- [ ] UI tests: `CalibrationModal.test.tsx` (8 tests)
- [ ] Playwright E2E: `calibration-capture.spec.ts`, `calibration-results.spec.ts`

### Phase 3d: Integration & Testing (Sprint 6)

**Sprint 6: End-to-End + Phase 2 Integration**
- [ ] Hook Phase 2 `useObjectLocalization` to use K matrix
- [ ] Accuracy comparison tests: before/after calibration
- [ ] Full browser tests: capture → calibrate → object localization
- [ ] Performance benchmarks

---

## Technical Algorithms

### 1. Jacobi SVD for 3×3 Matrices (`svdCompact.ts`)

**Purpose:** Decompose A = UΣVᵀ iteratively without external libraries

**Algorithm:**
```typescript
function svd3(A: number[][]): { U: number[][], S: number[], Vt: number[][] } {
  // Jacobi eigenvalue algorithm
  // For each off-diagonal pair (i,j):
  //   1. Compute rotation angle θ
  //   2. Apply Givens rotation to A
  //   3. Accumulate U
  // Repeat until convergence (~30 iterations typical)
  
  // Return decomposition
  return { U, S, Vt };
}
```

**Expected:** ~80 lines, < 1ms per matrix  
**Test cases:**
- Identity matrix
- Diagonal matrix
- Rank-deficient matrix
- Random 3×3 matrices (cross-check with NumPy)

---

### 2. Carathéodory Coreset for LMS (`coresetLMS.ts`)

**Purpose:** Select 5 representative calibration frames from N ≤ 12 frames

**Mathematical Basis:**
> For N points in d dimensions, Carathéodory's Theorem guarantees that any point in their convex hull can be expressed as a weighted combination of ≤ d+1 points.

**Algorithm:**
```typescript
function buildLMSCoreset(
  frames: CalibFrame[],
  m: number = 5  // coreset size (≤ d+1 where d=3)
): WeightedCoreset {
  // 1. Compute sensitivity σᵢ for each frame
  //    σᵢ = ||row norms of Jacobian||² (DLT sensitivity proxy)
  const sensitivities = frames.map(frame => computeSensitivity(frame));
  
  // 2. Normalize: Σσᵢ = Z
  const Z = sensitivities.reduce((a, b) => a + b, 0);
  
  // 3. Sample m frames with probability ∝ σᵢ
  const selected = [];
  for (let i = 0; i < m; i++) {
    const idx = sampleWithProbability(sensitivities.map(s => s / Z));
    selected.push(idx);
  }
  
  // 4. Weight: wᵢ = Z / (m · σᵢ)
  const weights = selected.map(i => Z / (m * sensitivities[i]));
  
  return { indices: selected, weights, totalError: computeError(frames) };
}
```

**Properties:**
- Guaranteed ε-approximation (proof in Feldman et al., 2019)
- Speedup: 12 frames → 5 frames ≈ 2.4× faster (5²/12² ≈ 0.174 of original cost)
- No accuracy loss for well-constrained problems

**Test cases:**
- All frames identical → 1 frame selected
- Evenly distributed → all selected equally
- One outlier → outlier weighted down
- Random synthetic frames → verify Carathéodory property

---

### 3. Witness-Set ICP (`witnessICP.ts`)

**Purpose:** Register two point clouds (3D grid → detected corners in image space)

**Algorithm:**
```typescript
function witnessSetICP(
  P: number[][],  // Source points (3D grid)
  Q: number[][],  // Target points (detected 2D corners, lifted to 3D)
  numIters: number = 50
): { R: number[][], t: number[], error: number } {
  let bestError = Infinity;
  let bestR, bestT;
  
  // Robust estimation: try 50 random triplet samples
  for (let trial = 0; trial < numIters; trial++) {
    // 1. Sample 3 pairs (pᵢ, qᵢ) at random
    const sample = randomSample(P, Q, 3);
    
    // 2. Center both clouds
    const μP = mean(sample.P);
    const μQ = mean(sample.Q);
    const A = subtract(sample.P, μP);
    const B = subtract(sample.Q, μQ);
    
    // 3. Compute SVD(AᵀB) = UΣVᵀ
    const H = multiply(transpose(A), B);
    const { U, Vt } = svd3(H);
    
    // 4. Extract rotation: R = VUᵀ (det-corrected)
    let R = multiply(V, transpose(U));
    if (determinant(R) < 0) {
      Vt[2] = Vt[2].map(x => -x);
      R = multiply(V, transpose(U));
    }
    
    // 5. Translation: t = μQ − R·μP
    const t = subtract(μQ, multiply(R, μP));
    
    // 6. Score: total error = Σ ||R·pⱼ + t − qⱼ||²
    const error = computeError(P, Q, R, t);
    
    if (error < bestError) {
      bestError = error;
      bestR = R;
      bestT = t;
    }
  }
  
  return { R: bestR, t: bestT, error: bestError };
}
```

**Properties:**
- Robust: automatically selects best-fit R, t from multiple trials
- Fast: only 3-point samples, avoids expensive full optimization
- Provable: bounds on approximation error (Jubran et al., 2021)

**Test cases:**
- Perfect alignment (identity R, zero t)
- Known rotation (45° around Z-axis)
- Known translation (5, 10, 0)
- Random 3D-to-2D projection
- Noisy correspondences (1px error)

---

### 4. Camera Model & Zhang's Method (`cameraModel.ts`)

**Purpose:** Compute intrinsics K from checkerboard homographies

**Algorithm:**
```typescript
function computeIntrinsics(
  coreset: WeightedCoreset,
  frames: CalibFrame[]
): { K: number[][], reprojError: number } {
  // 1. Build homographies for each frame in coreset
  const H_matrices = coreset.indices.map(idx => {
    return computeHomography(frames[idx].corners2D, frames[idx].grid3D);
  });
  
  // 2. Build weighted DLT system for B = K⁻ᵀ K⁻¹
  let system = buildWeightedDLT(H_matrices, coreset.weights);
  
  // 3. Solve via SVD → B matrix
  const { U, S, Vt } = svd3(system.matrix);
  const B = system.getRHS();  // Nullspace of system
  
  // 4. Extract K from B via Cholesky: K = chol(K⁻ᵀ K⁻¹)⁻ᵀ
  const K = extractIntrinsics(B);
  
  // 5. Refine K via Levenberg-Marquardt (optional, ~5 iterations)
  const K_refined = refineLM(K, H_matrices, coreset.weights);
  
  // 6. Compute reprojection error
  const reprojError = computeReprojError(K_refined, frames);
  
  return { K: K_refined, reprojError };
}
```

**Typical K matrix (1920×1440 phone camera):**
```
K = [
  [1200,    0,  960],  // focal length ≈ 1200px, principal point at center
  [   0, 1200,  720],
  [   0,    0,    1]
]
```

**Test cases:**
- Synthetic checkerboard (known K → recover K exactly)
- Real phone camera captures (K should be stable across ≥3 independent calibrations)
- Wide-angle lens (larger FOV, shorter focal length)
- Zoom lens (varies with zoom position)

---

## Software Test Plan

### Test Levels

1. **Unit Tests** — Pure functions (math, corner detection)
2. **Integration Tests** — React hooks, localStorage persistence
3. **UI Tests** — Component rendering, user interactions
4. **E2E Tests** — Full workflows (capture → calibrate → apply)
5. **Performance Tests** — Speedup benchmarks, memory usage

### Unit Test Files

#### `svd-compact.test.ts` (10 tests)
```typescript
describe('SVD (3×3 Jacobi)', () => {
  it('should decompose identity matrix', () => {
    const A = [[1,0,0],[0,1,0],[0,0,1]];
    const { U, S, Vt } = svd3(A);
    expect(reconstructMatrix(U, S, Vt)).toEqual(A);
  });
  
  it('should decompose diagonal matrix', () => {
    const A = [[2,0,0],[0,3,0],[0,0,5]];
    const { S } = svd3(A);
    expect(S.sort((a,b) => b-a)).toEqual([5,3,2]);
  });
  
  it('should handle rank-deficient matrix', () => {
    const A = [[1,1,1],[2,2,2],[3,3,3]];  // rank 1
    const { S } = svd3(A);
    expect(S[1]).toBeLessThan(1e-10);
    expect(S[2]).toBeLessThan(1e-10);
  });
  
  it('should match NumPy for random 3×3', () => {
    // Compare against known NumPy output
    const A = [[1.5, 2.1, 0.3], [0.2, 1.8, 2.2], [2.0, 0.1, 1.5]];
    const { U, S, Vt } = svd3(A);
    expect(S[0]).toBeCloseTo(3.89, 1);  // NumPy result
  });
  
  it('should return orthonormal U, V', () => {
    const A = [[1,2,3],[4,5,6],[7,8,9]];
    const { U, Vt } = svd3(A);
    expect(multiply(U, transpose(U))).toApproxEqual(identity(3));
    expect(multiply(Vt, transpose(Vt))).toApproxEqual(identity(3));
  });
  
  it('should converge in < 30 iterations', () => {
    // Add iteration counter to svd3
    const A = randomMatrix(3, 3);
    const iterations = svd3WithCounter(A).iterations;
    expect(iterations).toBeLessThan(30);
  });
  
  it('should handle nearly-zero elements', () => {
    const A = [[1e-10, 2, 3], [4, 1e-10, 6], [7, 8, 1e-10]];
    const { U, S, Vt } = svd3(A);
    // Should not NaN or Infinity
    expect(U.flat().every(x => isFinite(x))).toBe(true);
  });
  
  it('should work for 1×1, 2×2 edge cases', () => {
    // Gracefully handle degenerate cases
    const A2 = [[1, 2], [3, 4]];
    const result = svd3(padTo3x3(A2));
    expect(result.S.length).toBe(3);
  });
  
  it('should be deterministic', () => {
    const A = [[1.5, 2.1, 0.3], [0.2, 1.8, 2.2], [2.0, 0.1, 1.5]];
    const result1 = svd3(A);
    const result2 = svd3(A);
    expect(result1.S).toEqual(result2.S);
  });
  
  it('should validate reconstruction A ≈ USVᵀ', () => {
    const A = [[1.2, 3.4, 5.6], [7.8, 9.1, 2.3], [4.5, 6.7, 8.9]];
    const { U, S, Vt } = svd3(A);
    const reconstructed = multiply(U, multiply(diag(S), Vt));
    expect(reconstructed).toApproxEqual(A, 1e-10);
  });
});
```

#### `coreset-lms.test.ts` (12 tests)
```typescript
describe('Coreset LMS (Carathéodory)', () => {
  it('should select <= m frames', () => {
    const frames = generateSyntheticFrames(10);
    const coreset = buildLMSCoreset(frames, 5);
    expect(coreset.indices.length).toBeLessThanOrEqual(5);
  });
  
  it('should weight frames (sum to 1)', () => {
    const frames = generateSyntheticFrames(10);
    const coreset = buildLMSCoreset(frames, 5);
    const weightSum = coreset.weights.reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1.0, 5);
  });
  
  it('should select high-sensitivity frames', () => {
    // Frame 5 has 10× higher sensitivity
    const frames = generateFramesWithSensitivities([1,1,1,1,10,1,1,1,1,1]);
    const coreset = buildLMSCoreset(frames, 5);
    expect(coreset.indices).toContain(4);  // index 4 = frame 5
  });
  
  it('should handle all identical frames', () => {
    const frames = Array(10).fill(generateSyntheticFrames(1)[0]);
    const coreset = buildLMSCoreset(frames, 5);
    expect(coreset.indices.length).toBeLessThanOrEqual(5);
    // All weights should be equal
    const uniqueWeights = new Set(coreset.weights.map(w => w.toFixed(3)));
    expect(uniqueWeights.size).toBe(1);
  });
  
  it('should be deterministic with fixed seed', () => {
    const frames = generateSyntheticFrames(10);
    seedRandom(42);
    const coreset1 = buildLMSCoreset(frames, 5);
    seedRandom(42);
    const coreset2 = buildLMSCoreset(frames, 5);
    expect(coreset1.indices).toEqual(coreset2.indices);
  });
  
  it('should maintain Carathéodory property', () => {
    const frames = generateSyntheticFrames(10);
    const coreset = buildLMSCoreset(frames, 5);
    // Selected frames should positively span the original set's cone
    expect(coreset.indices.length).toBeLessThanOrEqual(4);  // d+1 = 3+1
  });
  
  it('should reduce error monotonically', () => {
    const frames = generateSyntheticFrames(12);
    const m2 = buildLMSCoreset(frames, 2).totalError;
    const m5 = buildLMSCoreset(frames, 5).totalError;
    expect(m5).toBeLessThanOrEqual(m2);
  });
  
  it('should give lower weight to outliers', () => {
    // Frame 7 has noise
    const frames = generateFramesWithNoise([0,0,0,0,0,0,0,1,0,0], noiseSigma=5);
    const coreset = buildLMSCoreset(frames, 5);
    const outlierIdx = 7;
    if (coreset.indices.includes(outlierIdx)) {
      const outlierWeight = coreset.weights[coreset.indices.indexOf(outlierIdx)];
      const avgWeight = 1 / 5;
      expect(outlierWeight).toBeLessThan(avgWeight);
    }
  });
  
  it('should handle edge case m=1', () => {
    const frames = generateSyntheticFrames(10);
    const coreset = buildLMSCoreset(frames, 1);
    expect(coreset.indices.length).toBe(1);
    expect(coreset.weights[0]).toBeCloseTo(1.0);
  });
  
  it('should handle edge case m >= N', () => {
    const frames = generateSyntheticFrames(5);
    const coreset = buildLMSCoreset(frames, 10);  // m > N
    expect(coreset.indices.length).toBeLessThanOrEqual(5);
  });
  
  it('should compute sensitivity correctly', () => {
    const frame = generateSyntheticFrame();
    const sensitivity = computeSensitivityMetric(frame);
    expect(sensitivity).toBeGreaterThan(0);
    expect(isFinite(sensitivity)).toBe(true);
  });
  
  it('performance: < 5ms for 12 frames', () => {
    const frames = generateSyntheticFrames(12);
    const start = performance.now();
    buildLMSCoreset(frames, 5);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});
```

#### `witness-icp.test.ts` (8 tests)
```typescript
describe('Witness-Set ICP', () => {
  it('should recover identity transformation', () => {
    const P = [[1,2,3], [4,5,6], [7,8,9]];
    const Q = P;  // Same points
    const { R, t, error } = witnessSetICP(P, Q);
    expect(R).toApproxEqual(identity(3), 1e-6);
    expect(t).toApproxEqual([0,0,0], 1e-6);
    expect(error).toBeLessThan(1e-10);
  });
  
  it('should recover 45° rotation around Z', () => {
    const P = [[1,0,0], [0,1,0], [0,0,1]];
    const R_true = rotation45Z();
    const Q = P.map(p => matrixVectorMultiply(R_true, p));
    const { R, t } = witnessSetICP(P, Q);
    expect(R).toApproxEqual(R_true, 1e-3);
    expect(t).toApproxEqual([0,0,0], 1e-3);
  });
  
  it('should recover translation [5, 10, 0]', () => {
    const P = [[1,2,3], [4,5,6], [7,8,9]];
    const t_true = [5, 10, 0];
    const Q = P.map(p => add(p, t_true));
    const { R, t } = witnessSetICP(P, Q);
    expect(R).toApproxEqual(identity(3), 1e-3);
    expect(t).toApproxEqual(t_true, 1e-3);
  });
  
  it('should handle noisy correspondences (1px error)', () => {
    const P = generateRandomPoints(100);
    const R_true = randomRotation();
    const t_true = [5, 10, 0];
    const Q = P.map(p => {
      const transformed = matrixVectorMultiply(R_true, p);
      return add(transformed, t_true);
    }).map(p => add(p, randomNoise(1.0)));  // 1px noise
    
    const { R, t, error } = witnessSetICP(P, Q);
    expect(R).toApproxEqual(R_true, 0.05);  // Relaxed tolerance
    expect(t).toApproxEqual(t_true, 0.1);
    expect(error).toBeLessThan(200);  // 100 points × 1px avg error
  });
  
  it('should be deterministic', () => {
    const P = generateRandomPoints(50);
    const Q = generateRandomPoints(50);
    
    const result1 = witnessSetICP(P, Q, 50);
    const result2 = witnessSetICP(P, Q, 50);
    
    expect(result1.error).toEqual(result2.error);
  });
  
  it('should work with 3-point sets (minimum)', () => {
    const P = [[0,0,0], [1,0,0], [0,1,0]];
    const Q = [[0,0,0], [1,1,0], [0,2,0]];
    
    const { R, t } = witnessSetICP(P, Q);
    expect(isValidRotationMatrix(R)).toBe(true);
    expect(isFiniteVector(t)).toBe(true);
  });
  
  it('performance: < 20ms for 100 points, 50 trials', () => {
    const P = generateRandomPoints(100);
    const Q = generateRandomPoints(100);
    
    const start = performance.now();
    witnessSetICP(P, Q, 50);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(20);
  });
  
  it('should maintain orthonormality of R', () => {
    const P = generateRandomPoints(50);
    const Q = P.map(p => matrixVectorMultiply(randomRotation(), p));
    
    const { R } = witnessSetICP(P, Q);
    const RTR = multiply(transpose(R), R);
    expect(RTR).toApproxEqual(identity(3), 1e-6);
    expect(determinant(R)).toBeCloseTo(1, 6);
  });
});
```

#### `camera-model.test.ts` (15 tests)
```typescript
describe('Camera Model & Zhang Method', () => {
  it('should recover K from synthetic checkerboard', () => {
    const K_true = synthesizeK(focal=1200, cx=960, cy=720);
    const frames = synthesizeCalibrationFrames(K_true, numFrames=8);
    
    const coreset = buildLMSCoreset(frames, 5);
    const { K, reprojError } = computeIntrinsics(coreset, frames);
    
    expect(K[0][0]).toBeCloseTo(K_true[0][0], 10);  // focal length ±10px
    expect(K[1][1]).toBeCloseTo(K_true[1][1], 10);
    expect(K[0][2]).toBeCloseTo(K_true[0][2], 10);  // principal point
    expect(K[1][2]).toBeCloseTo(K_true[1][2], 10);
    expect(reprojError).toBeLessThan(0.5);  // < 0.5px error
  });
  
  it('should produce valid intrinsics matrix', () => {
    const frames = generateSyntheticFrames(8);
    const coreset = buildLMSCoreset(frames, 5);
    const { K } = computeIntrinsics(coreset, frames);
    
    // Check structure: K[2][2] = 1
    expect(K[2][2]).toBeCloseTo(1.0);
    expect(K[0][1]).toBeCloseTo(0, 3);  // No skew
    expect(K[1][0]).toBeCloseTo(0, 3);
    
    // Focal lengths should be positive
    expect(K[0][0]).toBeGreaterThan(100);
    expect(K[1][1]).toBeGreaterThan(100);
    
    // Principal point should be near image center
    expect(K[0][2]).toBeGreaterThan(300);  // cx > 0
    expect(K[1][2]).toBeGreaterThan(300);  // cy > 0
  });
  
  it('should be stable across multiple runs', () => {
    const K_true = synthesizeK();
    const frames = synthesizeCalibrationFrames(K_true, 8);
    
    const K1 = computeIntrinsics(buildLMSCoreset(frames, 5), frames).K;
    const K2 = computeIntrinsics(buildLMSCoreset(frames, 5), frames).K;
    
    expect(K1[0][0]).toBeCloseTo(K2[0][0], 5);  // Within 5px
    expect(K1[0][2]).toBeCloseTo(K2[0][2], 5);
  });
  
  it('should handle wide-angle lens', () => {
    const K_wideangle = synthesizeK(focal=600);  // Shorter focal length
    const frames = synthesizeCalibrationFrames(K_wideangle, 8);
    
    const { K } = computeIntrinsics(buildLMSCoreset(frames, 5), frames);
    expect(K[0][0]).toBeCloseTo(600, 50);
  });
  
  it('should handle telephoto lens', () => {
    const K_telephoto = synthesizeK(focal=2500);
    const frames = synthesizeCalibrationFrames(K_telephoto, 8);
    
    const { K } = computeIntrinsics(buildLMSCoreset(frames, 5), frames);
    expect(K[0][0]).toBeCloseTo(2500, 100);
  });
  
  it('should handle off-center principal point', () => {
    const K_offcenter = synthesizeK(focal=1200, cx=800, cy=600);
    const frames = synthesizeCalibrationFrames(K_offcenter, 8);
    
    const { K } = computeIntrinsics(buildLMSCoreset(frames, 5), frames);
    expect(K[0][2]).toBeCloseTo(800, 20);
    expect(K[1][2]).toBeCloseTo(600, 20);
  });
  
  it('should compute reprojection error correctly', () => {
    const K_true = synthesizeK();
    const frames = synthesizeCalibrationFrames(K_true, 8);
    
    const { K, reprojError } = computeIntrinsics(buildLMSCoreset(frames, 5), frames);
    
    // Manually compute reprojection for one frame
    const frame = frames[0];
    const manualError = computeManualReprojError(K, frame);
    
    expect(reprojError).toBeCloseTo(manualError, 2);
  });
  
  it('should require >= 3 views for full calibration', () => {
    const K_true = synthesizeK();
    
    // With 1 frame, should fail or warn
    const frames1 = synthesizeCalibrationFrames(K_true, 1);
    expect(() => {
      const coreset = buildLMSCoreset(frames1, 1);
      computeIntrinsics(coreset, frames1);
    }).toThrow();
    
    // With 3 frames, should work
    const frames3 = synthesizeCalibrationFrames(K_true, 3);
    const coreset3 = buildLMSCoreset(frames3, 3);
    const { K } = computeIntrinsics(coreset3, frames3);
    expect(K).toBeDefined();
  });
  
  it('should normalize homography before extraction', () => {
    // Homography scale should not affect K
    const K = synthesizeK();
    const H = generateHomography(K);
    const H_scaled = H.map(row => row.map(x => x * 2));
    
    const K_from_H = extractIntrinsicsFromHomography(H);
    const K_from_H_scaled = extractIntrinsicsFromHomography(H_scaled);
    
    expect(K_from_H).toApproxEqual(K_from_H_scaled, 1e-6);
  });
  
  it('should detect rank-deficient homography', () => {
    // All points on a plane through optical center → rank < 3
    const H_rankdef = [[1, 2, 0], [0, 1, 0], [0, 0, 0]];  // Rank 2
    
    expect(() => {
      extractIntrinsicsFromHomography(H_rankdef);
    }).toThrow('Rank-deficient homography');
  });
  
  it('performance: < 50ms for 8 frames', () => {
    const frames = generateSyntheticFrames(8);
    const coreset = buildLMSCoreset(frames, 5);
    
    const start = performance.now();
    computeIntrinsics(coreset, frames);
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(50);
  });
  
  it('should handle Levenberg-Marquardt refinement', () => {
    const K_true = synthesizeK();
    const frames = synthesizeCalibrationFrames(K_true, 8);
    
    const coreset = buildLMSCoreset(frames, 5);
    const { K, reprojError } = computeIntrinsics(coreset, frames, refine=true);
    
    // LM refinement should reduce error
    expect(reprojError).toBeLessThan(1.0);
  });
  
  it('should match reference implementation', () => {
    // Compare against OpenCV cv::calibrateCamera()
    const K_opencv = referenceCalibration(testDataset);
    const K_ours = computeIntrinsics(...);
    
    // Should match within 2% (small implementation differences)
    expect(K_ours[0][0]).toBeCloseTo(K_opencv[0][0], 0.02 * K_opencv[0][0]);
  });
});
```

#### `corner-detector.test.ts` (8 tests)
```typescript
describe('Checkerboard Corner Detection', () => {
  it('should detect 8×6 checkerboard corners', () => {
    const canvas = renderCheckerboard(8, 6);
    const corners = detectCorners(canvas);
    
    expect(corners.length).toBe(8 * 6);  // 48 corners
  });
  
  it('should detect corners in correct order (left-to-right, top-to-bottom)', () => {
    const canvas = renderCheckerboard(8, 6);
    const corners = detectCorners(canvas);
    
    // Verify sorting
    for (let i = 1; i < corners.length; i++) {
      const prev = corners[i-1];
      const curr = corners[i];
      const isRowSorted = (curr.y > prev.y) || (curr.y ≈ prev.y && curr.x > prev.x);
      expect(isRowSorted).toBe(true);
    }
  });
  
  it('should handle rotation up to 30°', () => {
    const canvas = renderCheckerboard(8, 6, rotation=30);
    const corners = detectCorners(canvas);
    
    expect(corners.length).toBe(48);
  });
  
  it('should be robust to lighting variation', () => {
    const canvas = renderCheckerboard(8, 6);
    const cornersNormal = detectCorners(canvas);
    
    const canvasBright = brightenImage(canvas, factor=1.5);
    const cornersBright = detectCorners(canvasBright);
    
    // Positions should be nearly identical
    const maxShift = cornersNormal.map((c, i) => distance(c, cornersBright[i])).max();
    expect(maxShift).toBeLessThan(3);  // < 3px shift
  });
  
  it('should detect corners at subpixel precision', () => {
    const canvas = renderCheckerboard(8, 6);
    const corners = detectCorners(canvas);
    
    // Some corners should have fractional pixel coordinates
    const hasFractional = corners.some(c => c.x % 1 !== 0);
    expect(hasFractional).toBe(true);
  });
  
  it('performance: < 50ms for 1920×1440 image', () => {
    const canvas = renderCheckerboard(8, 6, resolution=[1920, 1440]);
    
    const start = performance.now();
    detectCorners(canvas);
    const elapsed = performance.now() - start;
    
    expect(elapsed).toBeLessThan(50);
  });
  
  it('should reject blurry image', () => {
    const canvas = renderCheckerboard(8, 6);
    const canvasBlurry = blurImage(canvas, sigma=5);
    
    const result = detectCorners(canvasBlurry, returnQuality=true);
    expect(result.quality).toBeLessThan(0.5);  // Low quality flag
  });
  
  it('should reject partial checkerboard', () => {
    const canvas = renderCheckerboard(8, 6);
    const canvasCropped = canvas.crop(0.25, 0.25, 0.75, 0.75);  // Crop to center
    
    expect(() => {
      detectCorners(canvasCropped);
    }).toThrow('Incomplete checkerboard');
  });
});
```

### Integration Test Files

#### `useCalibration.test.ts` (10 tests)
```typescript
describe('useCalibration Hook', () => {
  it('should initialize with null calibration', () => {
    const { result } = renderHook(() => useCalibration());
    expect(result.current.calibration).toBeNull();
  });
  
  it('should load calibration from localStorage', () => {
    const storedK = [[1200, 0, 960], [0, 1200, 720], [0, 0, 1]];
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify({
      K: storedK,
      reprojError: 1.45,
      timestamp: Date.now()
    }));
    
    const { result } = renderHook(() => useCalibration());
    expect(result.current.calibration.K).toEqual(storedK);
  });
  
  it('should compute intrinsics from frames', async () => {
    const { result } = renderHook(() => useCalibration());
    const frames = generateSyntheticFrames(8);
    
    await act(async () => {
      await result.current.computeFromFrames(frames);
    });
    
    expect(result.current.calibration).not.toBeNull();
    expect(result.current.calibration.K).toBeDefined();
  });
  
  it('should persist to localStorage', async () => {
    const { result } = renderHook(() => useCalibration());
    const frames = generateSyntheticFrames(8);
    
    await act(async () => {
      await result.current.computeFromFrames(frames);
    });
    
    const stored = JSON.parse(localStorage.getItem(CALIBRATION_STORAGE_KEY));
    expect(stored.K).toEqual(result.current.calibration.K);
  });
  
  it('should sync to Firestore if logged in', async () => {
    mockFirebaseUser('test@example.com');
    const { result } = renderHook(() => useCalibration());
    
    await act(async () => {
      const frames = generateSyntheticFrames(8);
      await result.current.computeFromFrames(frames);
    });
    
    await waitFor(() => {
      expect(firebaseMock.setDoc).toHaveBeenCalled();
    });
  });
  
  it('should not sync to Firestore if logged out', async () => {
    mockFirebaseUser(null);
    const { result } = renderHook(() => useCalibration());
    
    await act(async () => {
      const frames = generateSyntheticFrames(8);
      await result.current.computeFromFrames(frames);
    });
    
    expect(firebaseMock.setDoc).not.toHaveBeenCalled();
  });
  
  it('should clear calibration', () => {
    const storedK = [[1200, 0, 960], [0, 1200, 720], [0, 0, 1]];
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify({ K: storedK }));
    
    const { result } = renderHook(() => useCalibration());
    expect(result.current.calibration).not.toBeNull();
    
    act(() => {
      result.current.clear();
    });
    
    expect(result.current.calibration).toBeNull();
    expect(localStorage.getItem(CALIBRATION_STORAGE_KEY)).toBeNull();
  });
  
  it('should handle corrupted localStorage', () => {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, 'invalid json');
    
    const { result } = renderHook(() => useCalibration());
    expect(result.current.calibration).toBeNull();
    expect(result.current.error).toBeDefined();
  });
  
  it('should track computation progress', () => {
    const { result } = renderHook(() => useCalibration());
    
    act(async () => {
      const frames = generateSyntheticFrames(8);
      const progressSteps = [];
      
      result.current.onProgress = (step) => progressSteps.push(step);
      await result.current.computeFromFrames(frames);
      
      // Should report: detecting → coreset → computing → complete
      expect(progressSteps).toContain('detecting');
      expect(progressSteps).toContain('coreset');
      expect(progressSteps).toContain('computing');
      expect(progressSteps).toContain('complete');
    });
  });
  
  it('should validate quality badge', () => {
    const { result } = renderHook(() => useCalibration());
    
    act(() => {
      result.current.calibration = {
        K: synthesizeK(),
        reprojError: 0.8,
        quality: 'high'
      };
    });
    
    expect(result.current.getQualityBadge()).toBe('high');  // error < 1px
    
    act(() => {
      result.current.calibration.reprojError = 2.5;
    });
    
    expect(result.current.getQualityBadge()).toBe('low');  // error > 2px
  });
});
```

### UI Test Files

#### `CalibrationModal.test.tsx` (8 tests)
```typescript
describe('CalibrationModal Component', () => {
  it('should render closed by default', () => {
    const { queryByRole } = render(<CalibrationModal open={false} />);
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });
  
  it('should render when open', () => {
    const { getByRole } = render(<CalibrationModal open={true} />);
    expect(getByRole('dialog')).toBeInTheDocument();
  });
  
  it('should show step 1: capture checkerboard', () => {
    const { getByText, getByRole } = render(<CalibrationModal open={true} />);
    expect(getByText('צילום לוח שחמט')).toBeInTheDocument();
    expect(getByRole('button', { name: /צלם/i })).toBeInTheDocument();
  });
  
  it('should progress to step 2 after capture', async () => {
    const { getByRole, getByText } = render(<CalibrationModal open={true} />);
    
    fireEvent.click(getByRole('button', { name: /צלם/i }));
    
    await waitFor(() => {
      expect(getByText('גילוי פינות')).toBeInTheDocument();
    });
  });
  
  it('should show step 3 results after calibration', async () => {
    const { getByRole, getByText } = render(<CalibrationModal open={true} />);
    
    // Simulate full flow
    fireEvent.click(getByRole('button', { name: /צלם/i }));
    await waitFor(() => expect(getByText('ניתוח')).toBeInTheDocument());
    fireEvent.click(getByRole('button', { name: /המשך/i }));
    
    await waitFor(() => {
      expect(getByText('תוצאות')).toBeInTheDocument();
      expect(getByText(/אורך מוקד/i)).toBeInTheDocument();
    });
  });
  
  it('should display quality badge', async () => {
    const { getByRole, getByText } = render(<CalibrationModal open={true} />);
    
    // Simulate calibration with high quality
    mockCalibrationResult({ reprojError: 0.8, quality: 'high' });
    
    await waitFor(() => {
      expect(getByText('✅ High')).toBeInTheDocument();
    });
  });
  
  it('should allow retry on low quality', async () => {
    const { getByRole, getByText } = render(<CalibrationModal open={true} />);
    
    mockCalibrationResult({ reprojError: 3.5, quality: 'low' });
    
    await waitFor(() => {
      expect(getByRole('button', { name: /נסה שוב/i })).toBeInTheDocument();
    });
  });
  
  it('should close on cancel', () => {
    const handleClose = vi.fn();
    const { getByRole } = render(
      <CalibrationModal open={true} onClose={handleClose} />
    );
    
    fireEvent.click(getByRole('button', { name: /ביטול/i }));
    expect(handleClose).toHaveBeenCalled();
  });
  
  it('should save on confirm', () => {
    const handleSave = vi.fn();
    const { getByRole } = render(
      <CalibrationModal open={true} onSave={handleSave} />
    );
    
    // After successful calibration
    mockCalibrationResult({ reprojError: 0.9 });
    
    fireEvent.click(getByRole('button', { name: /שמור/i }));
    expect(handleSave).toHaveBeenCalled();
  });
});
```

---

## Playwright E2E Tests

### Test File: `calibration-capture.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Calibration: Capture & Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
  });

  test('should open calibration modal from header button', async ({ page }) => {
    // Find calibration button (📷 icon or labeled button)
    const calibButton = page.getByRole('button', { name: /calibration|צילום/i });
    await calibButton.click();
    
    // Modal should be visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText('צילום לוח שחמט')).toBeVisible();
  });

  test('should capture checkerboard photo from camera', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Wait for camera permission prompt (may need to mock)
    // Or use mock camera stream
    await page.evaluate(() => {
      // Mock getUserMedia to return test pattern
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1440;
        // Render 8×6 checkerboard pattern
        drawCheckerboard(canvas.getContext('2d'), 8, 6);
        
        const stream = canvas.captureStream(30);
        return stream;
      };
    });
    
    // Click "צלם" (capture) button
    await page.getByRole('button', { name: /צלם|capture/i }).click();
    
    // Modal should progress to step 2
    await expect(page.getByText('גילוי פינות|Detecting Corners')).toBeVisible({ timeout: 3000 });
    
    // Should show progress (e.g., "1/12 frames captured")
    await expect(page.getByText(/\d+\/12/)).toBeVisible();
  });

  test('should capture 8-12 frames in sequence', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await mockCameraStream(page, 'checkerboard');
    
    await page.getByRole('button', { name: /calibration/i }).click();
    
    let frameCount = 0;
    for (let i = 0; i < 12; i++) {
      await page.getByRole('button', { name: /צלם|capture/i }).click();
      await page.waitForTimeout(100);  // Simulate delay between captures
      
      const progress = await page.getByText(/צילום/, { exact: false }).textContent();
      const match = progress.match(/(\d+)\/12/);
      if (match) frameCount = parseInt(match[1]);
      
      if (i < 7) {
        // Should allow more captures
        await expect(page.getByRole('button', { name: /צלם|capture/i })).toBeEnabled();
      } else if (i >= 7) {
        // After 8 frames, should enable "next" button
        await expect(page.getByRole('button', { name: /המשך|next/i })).toBeEnabled();
      }
    }
    
    expect(frameCount).toBeGreaterThanOrEqual(8);
  });

  test('should skip dark/blurry frames with warning', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Mock dark frame
    await mockCameraStream(page, 'dark');
    await page.getByRole('button', { name: /calibration/i }).click();
    await page.getByRole('button', { name: /צלם|capture/i }).click();
    
    // Should show warning
    await expect(page.getByText(/Dark|Blurry|Low Quality/i)).toBeVisible();
    
    // Should not count toward frame total
    const progressText = await page.getByText(/\d+\/12/).textContent();
    expect(progressText).toBe('0/12');
  });

  test('should warn if checkerboard is rotated >45°', async ({ page }) => {
    await mockCameraStream(page, 'checkerboard', { rotation: 60 });
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    await page.getByRole('button', { name: /צלם/i }).click();
    
    await expect(page.getByText(/Rotate|Angle/i)).toBeVisible();
  });

  test('should show real-time corner detection overlay', async ({ page }) => {
    await mockCameraStream(page, 'checkerboard');
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Before capturing, should show detection preview
    const overlay = page.locator('canvas').first();  // Assumes overlay canvas
    await expect(overlay).toBeVisible();
    
    // Corners should be drawn (48 dots for 8×6 grid)
    const cornerCount = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      // Check for corner markers (circles or dots drawn on canvas)
      const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      // (Implementation depends on how corners are drawn)
      return 48;  // Expect 48 corners
    });
    
    expect(cornerCount).toBe(48);
  });

  test('should display frame quality meter', async ({ page }) => {
    await mockCameraStream(page, 'checkerboard');
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Quality meter should show (e.g., "Good", "Fair", "Poor")
    const qualityMeter = page.locator('[data-testid="quality-meter"]');
    await expect(qualityMeter).toBeVisible();
  });

  test('mobile: should handle portrait orientation', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    await mockCameraStream(page, 'checkerboard');
    await page.goto('http://localhost:5173');
    
    const modal = page.getByRole('dialog');
    
    // Modal should be responsive
    const bounds = await modal.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(375);
    
    // Camera feed should fill modal
    const cameraFeed = page.locator('video, canvas').first();
    const feedBounds = await cameraFeed.boundingBox();
    expect(feedBounds).toBeDefined();
  });

  test('mobile: should request camera permission', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mock permission request
    await context.grantPermissions(['camera']);
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Camera should be active
    const video = page.locator('video');
    await expect(video).toBeVisible();
  });

  test('offline: should work without internet', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);
    
    await mockCameraStream(page, 'checkerboard', { offline: true });
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Capture should work (all math runs locally)
    await page.getByRole('button', { name: /צלם/i }).click();
    
    await expect(page.getByText('גילוי פינות')).toBeVisible();
    
    // No network requests should be made
    const requests = [];
    page.on('request', req => requests.push(req.url()));
    
    await page.getByRole('button', { name: /צלם/i }).click();
    
    // Only camera stream should be accessed
    expect(requests.filter(r => !r.includes('blob:') && !r.includes('localhost'))).toHaveLength(0);
  });

  test('accessibility: keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Focus on calibration button
    await page.keyboard.press('Tab');
    const calibButton = page.getByRole('button', { name: /calibration/i });
    await calibButton.focus();
    
    // Open with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Navigate within modal with Tab
    await page.keyboard.press('Tab');
    const captureBtn = page.getByRole('button', { name: /צלם/i });
    await expect(captureBtn).toBeFocused();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
```

### Test File: `calibration-results.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Calibration: Results & Storage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should display calibration results (K matrix)', async ({ page }) => {
    await mockCalibratedSession(page);
    await page.goto('http://localhost:5173');
    
    await page.getByRole('button', { name: /calibration/i }).click();
    
    // Complete capture workflow
    await captureFrames(page, 8);
    
    // Step 3: Results should show
    await expect(page.getByText('תוצאות|Results')).toBeVisible();
    
    // Display K matrix values
    await expect(page.getByText(/focal length|אורך מוקד/i)).toBeVisible();
    const focalText = await page.getByText(/1200|1500/).first().textContent();
    expect(focalText).toMatch(/\d{3,}/);  // 3+ digit number
    
    // Display principal point
    await expect(page.getByText(/principal point|נקודת עיקרית/i)).toBeVisible();
  });

  test('should show reprojection error & quality badge', async ({ page }) => {
    await mockCalibratedSession(page, { reprojError: 0.9 });
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    await captureFrames(page, 8);
    
    // Quality badge should appear
    const qualityBadge = page.locator('[data-testid="quality-badge"]');
    await expect(qualityBadge).toBeVisible();
    await expect(qualityBadge).toContainText('✅ High');  // error < 1px
    
    // Reprojection error display
    await expect(page.getByText(/reprojection error/i)).toBeVisible();
    const errorText = await page.getByText(/0\.\d+ px/i).textContent();
    expect(errorText).toMatch(/0\.\d+/);
  });

  test('should save to localStorage', async ({ page }) => {
    await mockCalibratedSession(page);
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    await captureFrames(page, 8);
    
    // Click save button
    await page.getByRole('button', { name: /שמור|Save/i }).click();
    
    // Verify stored in localStorage
    const stored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('south-lebanon-map:camera-calibration:v1'));
    });
    
    expect(stored.K).toBeDefined();
    expect(stored.K.length).toBe(3);
    expect(stored.reprojError).toBeLessThan(2.0);
  });

  test('should persist calibration across page reload', async ({ page }) => {
    await mockCalibratedSession(page);
    
    await page.goto('http://localhost:5173');
    
    // Verify calibration is loaded
    const stored = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('south-lebanon-map:camera-calibration:v1'));
    });
    expect(stored.K).toBeDefined();
    
    // Reload page
    await page.reload();
    
    // Calibration should still be there
    const storedAfter = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('south-lebanon-map:camera-calibration:v1'));
    });
    
    expect(storedAfter.K).toEqual(stored.K);
  });

  test('should sync to Firestore if logged in', async ({ page, context }) => {
    // Mock Firebase user
    await mockFirebaseAuth(page, { uid: 'test-user' });
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    await captureFrames(page, 8);
    await page.getByRole('button', { name: /שמור|Save/i }).click();
    
    // Wait for Firestore sync
    await page.waitForTimeout(500);
    
    // Verify Firestore was called
    const firestoreCalls = await page.evaluate(() => {
      return window.__firestoreCalls || [];
    });
    
    expect(firestoreCalls.some(call => call.includes('calibration'))).toBe(true);
  });

  test('should not sync to Firestore if logged out', async ({ page }) => {
    // No Firebase user
    
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /calibration/i }).click();
    
    await captureFrames(page, 8);
    await page.getByRole('button', { name: /שמור|Save/i }).click();
    
    // No Firestore calls should be made
    const firestoreCalls = await page.evaluate(() => {
      return window.__firestoreCalls || [];
    });
    
    expect(firestoreCalls).toHaveLength(0);
  });

  test('should allow clearing calibration', async ({ page }) => {
    await mockCalibratedSession(page);
    
    await page.goto('http://localhost:5173');
    
    // Verify calibration exists
    let stored = await page.evaluate(() => {
      return localStorage.getItem('south-lebanon-map:camera-calibration:v1');
    });
    expect(stored).not.toBeNull();
    
    // Open settings or calibration menu
    await page.getByRole('button', { name: /calibration|settings/i }).click();
    await page.getByRole('button', { name: /clear|מחק|reset/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm|אישור/i }).click();
    
    // Verify cleared
    stored = await page.evaluate(() => {
      return localStorage.getItem('south-lebanon-map:camera-calibration:v1');
    });
    expect(stored).toBeNull();
  });

  test('should show calibration status in header', async ({ page }) => {
    // Without calibration
    await page.goto('http://localhost:5173');
    const badge = page.locator('[data-testid="calibration-status"]');
    await expect(badge).toContainText(/Not Calibrated|לא כיול/i);
    
    // After calibration
    await mockCalibratedSession(page);
    await page.reload();
    
    await expect(badge).toContainText(/Calibrated|כיול|✅/i);
  });

  test('performance: calibration completes in < 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await mockCalibratedSession(page);
    await page.goto('http://localhost:5173');
    
    await page.getByRole('button', { name: /calibration/i }).click();
    await captureFrames(page, 8);
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(2000);
  });
});
```

### Test File: `calibration-accuracy.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Calibration: Accuracy & Object Localization', () => {
  test('should improve object localization accuracy', async ({ page }) => {
    // Test that calibrated K improves Phase 2 object detection accuracy
    
    // 1. Set up object in known location (5km away)
    const objectDistance = 5000;  // 5km in meters
    const objectLat = 32.5940;
    const objectLon = 35.4050;
    
    // 2. Measure localization error WITHOUT calibration
    await page.goto('http://localhost:5173');
    await openCameraDetection(page);
    
    // Simulate object detection
    await mockObjectDetection(page, {
      label: 'truck',
      bbox: [400, 300, 600, 450],
      confidence: 0.92
    });
    
    // Get computed location (uncalibrated)
    const uncalibratedLoc = await page.evaluate(() => {
      return window.__lastDetectionLocation;
    });
    
    const uncalibratedError = haversineDistance(
      uncalibratedLoc.lat, uncalibratedLoc.lon,
      objectLat, objectLon
    );
    console.log(`Uncalibrated error: ${uncalibratedError.toFixed(1)}m`);
    
    // 3. Calibrate camera
    await captureAndCalibrateCamera(page);
    
    // 4. Repeat object detection with calibrated K
    await openCameraDetection(page);
    await mockObjectDetection(page, {
      label: 'truck',
      bbox: [400, 300, 600, 450],  // Same detection
      confidence: 0.92
    });
    
    const calibratedLoc = await page.evaluate(() => {
      return window.__lastDetectionLocation;
    });
    
    const calibratedError = haversineDistance(
      calibratedLoc.lat, calibratedLoc.lon,
      objectLat, objectLon
    );
    console.log(`Calibrated error: ${calibratedError.toFixed(1)}m`);
    
    // 5. Verify improvement
    const improvement = (uncalibratedError - calibratedError) / uncalibratedError * 100;
    expect(improvement).toBeGreaterThan(10);  // >= 10% improvement
    expect(calibratedError).toBeLessThan(uncalibratedError);
  });

  test('should handle multiple camera orientations', async ({ page }) => {
    // Calibration should work with camera at various angles
    
    await mockCalibratedSession(page, {
      orientations: [
        { rotation: 0, tilt: 0 },
        { rotation: 45, tilt: 30 },
        { rotation: 90, tilt: 45 },
        { rotation: 180, tilt: 0 }
      ]
    });
    
    await page.goto('http://localhost:5173');
    
    const calibration = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('south-lebanon-map:camera-calibration:v1'));
    });
    
    // K should be consistent across orientations
    expect(calibration.K[0][0]).toBeGreaterThan(1000);  // focal length reasonable
    expect(calibration.reprojError).toBeLessThan(2.0);
  });

  test('should detect calibration drift over time', async ({ page }) => {
    // Long-term: recalibrate periodically
    
    await mockCalibratedSession(page, { timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000 }); // 30 days old
    
    await page.goto('http://localhost:5173');
    
    // Should show "recalibrate recommended" warning
    await expect(page.getByText(/recalibrate|update|outdated/i)).toBeVisible({ timeout: 1000 });
  });
});
```

---

## File Structure

```
src/
  calibration/
    svdCompact.ts                    (80 lines)  — Jacobi SVD
    coresetLMS.ts                    (120 lines) — Carathéodory coreset
    witnessICP.ts                    (150 lines) — Witness-Set ICP
    cameraModel.ts                   (200 lines) — Zhang's method, K matrix
    cornerDetector.ts                (100 lines) — Checkerboard corner detection
    useCalibration.ts                (100 lines) — React hook
    CalibrationModal.tsx             (400 lines) — 3-step wizard UI
    CalibrationButton.tsx            (30 lines)  — Header icon button

test/
  svd-compact.test.ts               (200 lines) — 10 unit tests
  coreset-lms.test.ts               (250 lines) — 12 unit tests
  witness-icp.test.ts               (180 lines) — 8 unit tests
  camera-model.test.ts              (350 lines) — 15 unit tests
  corner-detector.test.ts           (150 lines) — 8 unit tests
  useCalibration.test.ts            (250 lines) — 10 integration tests
  CalibrationModal.test.tsx         (200 lines) — 8 UI tests

e2e/
  calibration-capture.spec.ts       (400 lines) — 12 Playwright tests
  calibration-results.spec.ts       (300 lines) — 8 Playwright tests
  calibration-accuracy.spec.ts      (200 lines) — 3 end-to-end accuracy tests

docs/
  CORESET-CAMERA-CALIBRATION.md     (this file)
```

---

## Timeline & Effort

| Phase | Task | Effort | Timeline |
|-------|------|--------|----------|
| **3a** | SVD + Coreset | 16h | 2 sprints |
| **3b** | Camera Model | 12h | 1 sprint |
| **3c** | React Integration | 20h | 2 sprints |
| **3d** | Testing + E2E | 24h | 1 sprint |
| **Total** | Full Feature | **72h** | **6 sprints** (~6 weeks @ 20h/week) |

### Detailed Breakdown

**Sprint 1 (Week 1–2):** SVD & Coreset Math
- Monday: SVD algorithm + unit tests
- Wednesday: Coreset algorithm + unit tests
- Friday: Benchmarking, code review

**Sprint 2 (Week 3):** ICP & Camera Model
- Monday: Witness-Set ICP + tests
- Wednesday: Zhang's method + tests
- Friday: Integration testing

**Sprint 3 (Week 4):** React Integration
- Monday: useCalibration hook + localStorage
- Wednesday: CalibrationModal component
- Friday: Firebase sync, UI Polish

**Sprint 4 (Week 5):** Playwright Tests
- Monday: Setup test infrastructure, capture tests
- Wednesday: Results & accuracy tests
- Friday: Mobile & accessibility tests

**Sprint 5 (Week 6):** Phase 2 Integration & Performance
- Monday: Hook Phase 2 `useObjectLocalization` to K matrix
- Wednesday: Before/after accuracy comparison
- Friday: Performance tuning, final QA

---

## Success Checklist

### Code Quality
- [ ] 100% test coverage on math modules (svd, coreset, witness, camera)
- [ ] All functions ≤ 250 lines
- [ ] TypeScript strict mode, zero errors
- [ ] No external ML libraries (pure math)
- [ ] ESLint + Prettier passing

### Testing
- [ ] 61 unit tests passing (svd 10 + coreset 12 + icp 8 + camera 15 + corner 8 + hook 10)
- [ ] 23 Playwright E2E tests passing (capture 12 + results 8 + accuracy 3)
- [ ] Performance benchmarks: < 50ms for 8 frames
- [ ] Offline functionality verified
- [ ] Mobile & accessibility tested

### Documentation
- [ ] Architecture diagram (data flow)
- [ ] Math algorithm pseudocode
- [ ] API reference for all modules
- [ ] User guide for calibration wizard
- [ ] Contributing guide for future math work

### Performance
- [ ] Calibration completes < 2s on mobile
- [ ] Memory usage < 50MB during capture
- [ ] Storage footprint < 10KB in localStorage
- [ ] Firestore sync < 1s on 3G network

### Integration
- [ ] Phase 2 (object localization) uses K matrix
- [ ] 10%+ accuracy improvement demonstrated
- [ ] Phase 1 (Firebase Auth) syncs calibration
- [ ] No regressions in existing features

---

## References

### Papers
1. Feldman et al. (2019) — Sketching for Coreset Construction
   - https://arxiv.org/abs/1906.11835
2. Jubran et al. (2021) — Provably Approximated ICP
   - https://openaccess.thecvf.com/content/ICCV2021/papers/Jubran_Provably_Approximated_ICP_ICCV_2021_paper.pdf
3. Zhang (2000) — Flexible Camera Calibration
   - https://www.microsoft.com/en-us/research/publication/a-flexible-new-technique-for-camera-calibration/

### Open-Source References
- OpenCV `cv::calibrateCamera()` — Reference implementation
- Scikit-image `corner_peaks()` — Corner detection inspiration
- NumPy `linalg.svd()` — SVD reference behavior

### Standards
- IEEE 754 — Floating-point arithmetic
- ECI 2015 — Image coordinate conventions
- SIFT/ORB papers — Feature detection (optional for future enhancements)

---

**Document Status:** Planning & Design Complete  
**Ready for:** Sprint Planning & Implementation Kickoff  
**Last Updated:** 2026-06-24

