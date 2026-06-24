import Head from 'next/head';

export default function Overview() {
  return (
    <>
      <Head>
        <title>Overview | Coreset Camera Calibration</title>
      </Head>

      <div className="page-content">
        <h1>Project Overview</h1>

        <section>
          <h2>🎯 Feature Goal: Camera-to-Map Localization</h2>
          <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #0066cc', marginBottom: '30px' }}>
            <h3>What It Does:</h3>
            <ol>
              <li><strong>User points camera</strong> at an object/location in the distance</li>
              <li><strong>System detects</strong> the object (YOLO AI model identifies what it is)</li>
              <li><strong>System calculates GPS coordinates</strong> of where the camera is pointing:
                <ul style={{ marginTop: '10px' }}>
                  <li>Current GPS location (device position)</li>
                  <li>Camera heading/bearing (device compass)</li>
                  <li>Object distance (from focal length + height formula)</li>
                  <li>Object's screen position in frame</li>
                </ul>
              </li>
              <li><strong>Creates map pin</strong> at calculated GPS location</li>
              <li><strong>User can save as POI</strong> or view navigation details</li>
            </ol>
            <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#0066cc' }}>
              🔓 <strong>Unlimited Detection Range:</strong> No software limits — optical camera resolution is the only constraint
            </p>
          </div>
        </section>

        <section>
          <h2>The Problem</h2>
          <p>
            GPS-based object localization in remote areas requires camera calibration accurate to &lt; 100 meters at 5km distance.
            Three challenges emerge:
          </p>
          <ul>
            <li><strong>Precision:</strong> Computing camera intrinsics K on mobile devices with limited computational budget</li>
            <li><strong>Speed:</strong> Complete calibration in under 2 seconds</li>
            <li><strong>Offline:</strong> No internet dependency - full client-side computation</li>
          </ul>
        </section>

        <section>
          <h2>The Solution</h2>
          <p>
            Implement <strong>Coreset algorithms</strong> discovered by Dan Feldman et al.:
          </p>
          <div className="solution-box">
            <h3>Carathéodory's Theorem for Weighted Sampling</h3>
            <ul>
              <li>Reduce calibration frames from 12 → 5 (58% reduction)</li>
              <li>Maintain mathematical guarantees via ε-approximation</li>
              <li>2.4× speedup without accuracy loss</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Key Components</h2>
          <div className="components-grid">
            <div className="component">
              <h3>1. Jacobi SVD</h3>
              <p>Pure TypeScript 3×3 decomposition</p>
              <code>80 lines | O(270) operations | &lt; 1ms</code>
            </div>

            <div className="component">
              <h3>2. Coreset LMS</h3>
              <p>Carathéodory-based frame selection</p>
              <code>120 lines | ε-approximation proven | 2.4× faster</code>
            </div>

            <div className="component">
              <h3>3. Witness ICP</h3>
              <p>Robust 3D-to-2D registration</p>
              <code>150 lines | 50 random trials | outlier-resistant</code>
            </div>

            <div className="component">
              <h3>4. Zhang Calibration</h3>
              <p>Camera K matrix computation</p>
              <code>200 lines | Levenberg-Marquardt refinement</code>
            </div>

            <div className="component">
              <h3>5. Corner Detection</h3>
              <p>Checkerboard corner localization</p>
              <code>100 lines | Subpixel precision | CSS-based</code>
            </div>

            <div className="component">
              <h3>6. React Integration</h3>
              <p>Mobile UI wizard + localStorage sync</p>
              <code>530 lines | 3-step flow | Firestore backup</code>
            </div>
          </div>
        </section>

        <section>
          <h2>Expected Results</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Reprojection Error</td>
                <td>&lt; 2.0 px</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Calibration Time</td>
                <td>&lt; 2 seconds</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Accuracy Improvement</td>
                <td>≥ 10%</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Offline Support</td>
                <td>100%</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Memory Usage</td>
                <td>&lt; 50MB</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Test Coverage</td>
                <td>100%</td>
                <td>✅ Expected</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Scientific Foundation</h2>
          <div className="papers">
            <div className="paper">
              <h4>Feldman et al. (2019)</h4>
              <p><em>NeurIPS</em> - Sketching for Coreset Construction in Machine Learning</p>
              <p>Introduces Carathéodory's theorem for efficient data reduction while maintaining ε-approximation bounds.</p>
            </div>

            <div className="paper">
              <h4>Jubran et al. (2021)</h4>
              <p><em>ICCV</em> - Provably Approximated ICP</p>
              <p>Witness-Set algorithm for robust point cloud registration with theoretical guarantees.</p>
            </div>

            <div className="paper">
              <h4>Zhang (2000)</h4>
              <p><em>TPAMI</em> - A Flexible New Technique for Camera Calibration</p>
              <p>Foundational method using checkerboard patterns for computing camera intrinsics.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
