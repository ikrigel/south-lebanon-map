import Head from 'next/head';
import Link from 'next/link';

export default function Phase2() {
  return (
    <>
      <Head>
        <title>Phase 2: Camera-to-Map | Coreset Calibration</title>
      </Head>

      <div className="page-content">
        <h1>📷 Phase 2: Camera-to-Map Localization</h1>

        <section>
          <h2>Feature Goal</h2>
          <div className="solution-box">
            <p>User points camera at distant object → System calculates GPS location → Pin drops on map</p>
          </div>
        </section>

        <section>
          <h2>User Workflow</h2>
          <div className="architecture-diagram">
            <div className="stage">
              <h4>1. Open Camera</h4>
              <p>📷 Button in header</p>
            </div>
            <div className="arrow">→</div>
            <div className="stage">
              <h4>2. Point at Object</h4>
              <p>Any distant target (10m-50km)</p>
            </div>
            <div className="arrow">→</div>
            <div className="stage">
              <h4>3. Detect & Confirm</h4>
              <p>YOLOv8 identifies object type</p>
            </div>
            <div className="arrow">→</div>
            <div className="stage">
              <h4>4. Calculate Distance</h4>
              <p>Using focal length + object height</p>
            </div>
            <div className="arrow">→</div>
            <div className="stage">
              <h4>5. Calculate GPS</h4>
              <p>Bearing + distance → lat/lon</p>
            </div>
            <div className="arrow">→</div>
            <div className="stage">
              <h4>6. Pin on Map</h4>
              <p>Create POI & navigate</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Detection Range: Unlimited</h2>
          <p>No software range limit — optical resolution is the only constraint:</p>
          <div className="components-grid">
            <div className="component">
              <h3>Person 👤</h3>
              <p>200-500m with 2MP+ camera</p>
            </div>

            <div className="component">
              <h3>Vehicle 🚗</h3>
              <p>1-5km on standard phone</p>
            </div>

            <div className="component">
              <h3>Building 🏢</h3>
              <p>5-20km depending on size</p>
            </div>

            <div className="component">
              <h3>Terrain 🏔️</h3>
              <p>20-50km for ridges/peaks</p>
            </div>

            <div className="component">
              <h3>Aircraft ✈️</h3>
              <p>5-15km+ if visible</p>
            </div>

            <div className="component">
              <h3>Custom 🎯</h3>
              <p>User-entered distance</p>
            </div>
          </div>
        </section>

        <section>
          <h2>How It Works: Distance Calculation</h2>
          <div className="algorithm-card">
            <div className="algorithm-header">
              <h3>The Formula</h3>
              <p>Calculate distance from camera to target object</p>
            </div>
            <div className="algorithm-body">
              <pre>{`distance = (objectHeightM × focalLengthPx) / objectHeightPx

Where:
  objectHeightM     = Known typical height
                     (person: 1.7m, car: 1.5m, building: 15m)
  focalLengthPx     = Camera intrinsic from calibration K matrix
                     (or default from device FOV)
  objectHeightPx    = Bounding box height in pixels (YOLO)`}</pre>

              <h4>Example:</h4>
              <pre>{`Person at unknown distance:
  - Known height: 1.7m
  - Focal length: 1200px (from K matrix)
  - Bounding box height: 50px (on screen)

  distance = (1.7 × 1200) / 50 = 40.8m ✓`}</pre>

              <h4>Accuracy:</h4>
              <ul>
                <li>✅ With Phase 3 calibration: ±10% error</li>
                <li>⚠️ Without calibration: ±20% error (default FOV)</li>
                <li>📡 Terrain cross-reference: Can refine with known distances</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>GPS Coordinate Calculation</h2>
          <div className="algorithm-card">
            <div className="algorithm-header">
              <h3>Trigonometry: Bearing + Distance → GPS</h3>
              <p>Convert device compass heading to global coordinates</p>
            </div>
            <div className="algorithm-body">
              <pre>{`Given:
  myLat, myLon       = Device GPS location
  bearing            = Device compass heading (0-360°)
  distanceM          = Calculated distance to target

Calculate:
  Δlat = distanceM × cos(bearing) / 111000
  Δlon = distanceM × sin(bearing) / (111000 × cos(myLat_radians))

  targetLat = myLat + Δlat
  targetLon = myLon + Δlon`}</pre>

              <h4>Why 111000?</h4>
              <p>1° latitude ≈ 111 kilometers ≈ 111,000 meters</p>

              <h4>Accuracy Factors:</h4>
              <ul>
                <li>✅ GPS precision: ±5-10m (good conditions)</li>
                <li>✅ Compass accuracy: ±5-15° (device-dependent)</li>
                <li>✅ Distance error: Depends on calibration quality</li>
                <li>⚠️ Total error: ~50-200m at 5km distance</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Object Detection: YOLOv8n (Offline)</h2>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Real-Time AI Detection</h3>
            <p>ONNX Runtime Web + YOLOv8n nano model</p>
            <ul>
              <li>✅ Detects 80 COCO classes (people, vehicles, animals, etc.)</li>
              <li>✅ ~200ms per frame (5 FPS on mobile)</li>
              <li>✅ 6.3MB model size (cached by service worker)</li>
              <li>✅ 100% offline (no internet required)</li>
              <li>✅ Confidence scoring (0-100%)</li>
            </ul>
          </div>

          <h3>Hebrew Category Mapping</h3>
          <table>
            <thead>
              <tr>
                <th>COCO Class</th>
                <th>Hebrew Category</th>
                <th>Known Height</th>
                <th>Examples</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>person</td>
                <td>כוח אדם 🧍</td>
                <td>1.7m</td>
                <td>Soldier, civilian</td>
              </tr>
              <tr>
                <td>car, motorcycle</td>
                <td>רכב 🚗</td>
                <td>1.5m</td>
                <td>Vehicle, motorbike</td>
              </tr>
              <tr>
                <td>truck, bus</td>
                <td>רכב כבד 🚛</td>
                <td>2.5m</td>
                <td>Truck, bus, jeep</td>
              </tr>
              <tr>
                <td>airplane, helicopter</td>
                <td>כלי טיס ✈️</td>
                <td>Unknown</td>
                <td>Aircraft in sky</td>
              </tr>
              <tr>
                <td>boat</td>
                <td>כלי שיט ⛵</td>
                <td>Unknown</td>
                <td>Boat, ship</td>
              </tr>
              <tr>
                <td>building, tower, signs</td>
                <td>תשתית 🏗️</td>
                <td>Unknown</td>
                <td>Structure, building</td>
              </tr>
              <tr>
                <td>Other (80+ classes)</td>
                <td>נוף / אחר 🌄</td>
                <td>Manual input</td>
                <td>Terrain, features</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Smart Features</h2>

          <div className="test-suite">
            <h3>Terrain Cross-Reference</h3>
            <p>If compass bearing points at known terrain feature:</p>
            <ul>
              <li>✅ Auto-suggest feature name + known distance</li>
              <li>✅ User can confirm or override</li>
              <li>✅ Reduces distance formula errors</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>Photo Capture</h3>
            <p>Snap camera frame to JPEG:</p>
            <ul>
              <li>✅ Attached to POI as evidence</li>
              <li>✅ Stored in localStorage (base64)</li>
              <li>✅ Synced to Firestore if logged in</li>
              <li>✅ Useful for field intelligence</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>Save Options</h3>
            <ul>
              <li>📍 <strong>Local only</strong> — Browser localStorage</li>
              <li>☁️ <strong>Cloud only</strong> — Firestore (requires login)</li>
              <li>🔄 <strong>Both</strong> — Automatic cloud sync when online</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Integration with Phase 3: Calibration</h2>
          <p>
            Phase 3 computes camera K matrix (intrinsic parameters) which improves accuracy:
          </p>
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Focal Length</th>
                <th>Distance Error</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Without calibration</td>
                <td>Estimated from FOV</td>
                <td>±20%</td>
              </tr>
              <tr>
                <td>With Phase 3 calibration</td>
                <td>Measured K matrix</td>
                <td>±10%</td>
              </tr>
            </tbody>
          </table>
          <p>
            Result: Phase 2 can work standalone, but Phase 3 makes it <strong>2× more accurate</strong>.
          </p>
        </section>

        <section>
          <h2>Technical Stack</h2>

          <div className="components-grid">
            <div className="component">
              <h3>Frontend</h3>
              <p>React hooks + TypeScript</p>
              <code>useCameraStream, useObjectDetection, useObjectLocalization</code>
            </div>

            <div className="component">
              <h3>AI Model</h3>
              <p>ONNX Runtime Web + YOLOv8n</p>
              <code>6.3MB model, real-time 5 FPS</code>
            </div>

            <div className="component">
              <h3>Geolocation</h3>
              <p>Device GPS + Compass</p>
              <code>Bearing + distance → lat/lon</code>
            </div>

            <div className="component">
              <h3>Storage</h3>
              <p>localStorage + Firestore</p>
              <code>POIs with photos, metadata</code>
            </div>

            <div className="component">
              <h3>Camera</h3>
              <p>getUserMedia API</p>
              <code>Real-time video stream</code>
            </div>

            <div className="component">
              <h3>Map</h3>
              <p>Leaflet.js pins + navigation</p>
              <code>Interactive markers with details</code>
            </div>
          </div>
        </section>

        <section>
          <h2>Testing Plan (Phase 2)</h2>

          <div className="test-suite">
            <h3>Unit Tests (20+)</h3>
            <ul>
              <li>Object detection accuracy (YOLO confidence)</li>
              <li>Distance formula (focal length variants)</li>
              <li>Bearing calculation (compass integration)</li>
              <li>GPS offset (Haversine-variant math)</li>
              <li>Terrain cross-reference matching</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>E2E Tests (Playwright, 15+)</h3>
            <ul>
              <li>Open camera, grant permissions</li>
              <li>Detect objects (real or mock YOLOv8)</li>
              <li>Confirm/edit detection label</li>
              <li>Set object height (manual/auto)</li>
              <li>Capture photo</li>
              <li>Save as POI (local/cloud/both)</li>
              <li>Pin appears on map</li>
              <li>Navigate to POI</li>
              <li>Offline functionality</li>
              <li>Mobile responsive (portrait/landscape)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Success Criteria</h2>
          <table>
            <thead>
              <tr>
                <th>Criteria</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Detection range</td>
                <td>2-50km</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>GPS accuracy</td>
                <td>±100m (at 5km)</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Detection speed</td>
                <td>5 FPS on mobile</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Offline support</td>
                <td>100%</td>
                <td>✅ Expected</td>
              </tr>
              <tr>
                <td>Unit tests passing</td>
                <td>20+</td>
                <td>⏳ Planned</td>
              </tr>
              <tr>
                <td>E2E tests passing</td>
                <td>15+</td>
                <td>⏳ Planned</td>
              </tr>
              <tr>
                <td>Mobile responsive</td>
                <td>Portrait + landscape</td>
                <td>⏳ Planned</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="cta-section">
          <h2>More Information</h2>
          <p>See full implementation plan and technical details:</p>
          <div className="cta-buttons-large">
            <Link href="/" className="btn btn-large btn-primary">
              ← Back to Home
            </Link>
            <Link href="/algorithms" className="btn btn-large btn-secondary">
              Algorithms →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
