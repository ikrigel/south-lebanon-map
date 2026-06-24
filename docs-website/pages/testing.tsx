import Head from 'next/head';

export default function Testing() {
  return (
    <>
      <Head>
        <title>Testing Plan | Coreset Camera Calibration</title>
      </Head>

      <div className="page-content">
        <h1>✅ Testing Strategy</h1>

        <section>
          <h2>Overview: 84 Total Tests</h2>
          <div className="test-breakdown">
            <div className="test-category">
              <h3>61 Unit Tests</h3>
              <p>Math correctness, edge cases, performance</p>
            </div>
            <div className="test-category">
              <h3>23 Playwright E2E Tests</h3>
              <p>Full workflows, mobile, offline, accessibility</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Unit Tests (61)</h2>

          <div className="test-suite">
            <h3>svd-compact.test.ts (10 tests)</h3>
            <ul>
              <li>✓ Decompose identity matrix</li>
              <li>✓ Decompose diagonal matrix</li>
              <li>✓ Handle rank-deficient matrices</li>
              <li>✓ Match NumPy for random 3×3</li>
              <li>✓ Verify orthonormal U, V matrices</li>
              <li>✓ Converge in &lt; 30 iterations</li>
              <li>✓ Handle nearly-zero elements</li>
              <li>✓ Work for 1×1, 2×2 edge cases</li>
              <li>✓ Deterministic output</li>
              <li>✓ Validate reconstruction A ≈ USVᵀ</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>coreset-lms.test.ts (12 tests)</h3>
            <ul>
              <li>✓ Select ≤ m frames</li>
              <li>✓ Weights sum to 1</li>
              <li>✓ Select high-sensitivity frames</li>
              <li>✓ Handle all identical frames</li>
              <li>✓ Deterministic with fixed seed</li>
              <li>✓ Maintain Carathéodory property</li>
              <li>✓ Reduce error monotonically</li>
              <li>✓ Weight outliers down</li>
              <li>✓ Handle edge case m=1</li>
              <li>✓ Handle edge case m ≥ N</li>
              <li>✓ Compute sensitivity correctly</li>
              <li>✓ Performance: &lt; 5ms for 12 frames</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>witness-icp.test.ts (8 tests)</h3>
            <ul>
              <li>✓ Recover identity transformation</li>
              <li>✓ Recover 45° rotation around Z-axis</li>
              <li>✓ Recover translation [5, 10, 0]</li>
              <li>✓ Handle noisy correspondences (1px error)</li>
              <li>✓ Deterministic output</li>
              <li>✓ Work with 3-point sets (minimum)</li>
              <li>✓ Performance: &lt; 20ms for 100 points</li>
              <li>✓ Maintain orthonormality of R</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>camera-model.test.ts (15 tests)</h3>
            <ul>
              <li>✓ Recover K from synthetic checkerboard</li>
              <li>✓ Produce valid intrinsics matrix</li>
              <li>✓ Stable across multiple runs</li>
              <li>✓ Handle wide-angle lens</li>
              <li>✓ Handle telephoto lens</li>
              <li>✓ Handle off-center principal point</li>
              <li>✓ Compute reprojection error correctly</li>
              <li>✓ Require ≥ 3 views for full calibration</li>
              <li>✓ Normalize homography correctly</li>
              <li>✓ Detect rank-deficient homography</li>
              <li>✓ Performance: &lt; 50ms for 8 frames</li>
              <li>✓ Levenberg-Marquardt refinement</li>
              <li>✓ Match reference implementation (OpenCV)</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>corner-detector.test.ts (8 tests)</h3>
            <ul>
              <li>✓ Detect 8×6 checkerboard corners</li>
              <li>✓ Correct corner order (left→right, top→bottom)</li>
              <li>✓ Handle rotation up to 30°</li>
              <li>✓ Robust to lighting variation</li>
              <li>✓ Subpixel precision detection</li>
              <li>✓ Performance: &lt; 50ms for 1920×1440</li>
              <li>✓ Reject blurry image</li>
              <li>✓ Reject partial checkerboard</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>useCalibration.test.ts (10 tests)</h3>
            <ul>
              <li>✓ Initialize with null calibration</li>
              <li>✓ Load calibration from localStorage</li>
              <li>✓ Compute intrinsics from frames</li>
              <li>✓ Persist to localStorage</li>
              <li>✓ Sync to Firestore (logged in)</li>
              <li>✓ Don't sync to Firestore (logged out)</li>
              <li>✓ Clear calibration</li>
              <li>✓ Handle corrupted localStorage</li>
              <li>✓ Track computation progress</li>
              <li>✓ Validate quality badge</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>CalibrationModal.test.tsx (8 tests)</h3>
            <ul>
              <li>✓ Render closed by default</li>
              <li>✓ Render when open</li>
              <li>✓ Show step 1: capture checkerboard</li>
              <li>✓ Progress to step 2 after capture</li>
              <li>✓ Show step 3 results after calibration</li>
              <li>✓ Display quality badge</li>
              <li>✓ Allow retry on low quality</li>
              <li>✓ Close/save workflow</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Playwright E2E Tests (23)</h2>

          <div className="test-suite">
            <h3>calibration-capture.spec.ts (12 tests)</h3>
            <ul>
              <li>✓ Open modal from header button</li>
              <li>✓ Capture checkerboard photo from camera</li>
              <li>✓ Capture 8-12 frames in sequence</li>
              <li>✓ Skip dark/blurry frames with warning</li>
              <li>✓ Warn if checkerboard rotated &gt;45°</li>
              <li>✓ Show real-time corner detection overlay</li>
              <li>✓ Display quality meter</li>
              <li>✓ Mobile: handle portrait orientation</li>
              <li>✓ Mobile: request camera permission</li>
              <li>✓ Offline: work without internet</li>
              <li>✓ Accessibility: keyboard navigation</li>
              <li>✓ Performance: &lt; 3 minutes for 12 frames</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>calibration-results.spec.ts (8 tests)</h3>
            <ul>
              <li>✓ Display calibration results (K matrix)</li>
              <li>✓ Show reprojection error &amp; quality badge</li>
              <li>✓ Save to localStorage</li>
              <li>✓ Persist across page reload</li>
              <li>✓ Sync to Firestore if logged in</li>
              <li>✓ Don't sync if logged out</li>
              <li>✓ Allow clearing calibration</li>
              <li>✓ Performance: &lt; 2 seconds</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>calibration-accuracy.spec.ts (3 tests)</h3>
            <ul>
              <li>✓ Improve object localization accuracy by ≥10%</li>
              <li>✓ Handle multiple camera orientations</li>
              <li>✓ Detect calibration drift over time</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Coverage Metrics</h2>
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Target</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Code Coverage</td>
                <td>100% on math</td>
                <td>NYC coverage report</td>
              </tr>
              <tr>
                <td>Edge Cases</td>
                <td>All 28 cases</td>
                <td>Unit tests + Playwright</td>
              </tr>
              <tr>
                <td>Browser Support</td>
                <td>Chrome, Safari, Firefox</td>
                <td>Playwright matrix</td>
              </tr>
              <tr>
                <td>Performance</td>
                <td>&lt; 2 sec calibration</td>
                <td>Timing assertions</td>
              </tr>
              <tr>
                <td>Accessibility</td>
                <td>WCAG AA compliant</td>
                <td>Keyboard nav tests</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Running Tests</h2>
          <pre>{`# All tests
npm test -- --run

# Single test file
npm test -- --run svd-compact.test.ts

# Watch mode
npm test

# Coverage report
npm test -- --run --coverage`}</pre>
        </section>
      </div>
    </>
  );
}
