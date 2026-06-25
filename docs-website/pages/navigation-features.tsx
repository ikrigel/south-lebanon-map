import Head from 'next/head';
import Link from 'next/link';

export default function NavigationFeatures() {
  return (
    <>
      <Head>
        <title>Navigation Features | Camera-to-Map Localization</title>
      </Head>

      <div className="page-content">
        <h1>🧭 Advanced Navigation Features</h1>

        <section>
          <h2>Feature 1: Tri-Directional Heading Indicator</h2>
          <p>
            A sophisticated compass system that shows three directions simultaneously on a single composite arrow.
          </p>

          <div className="algorithm-card">
            <div className="algorithm-header">
              <h3>Composite Arrow Design</h3>
              <p>Three synchronized directional indicators in one visual element</p>
            </div>
            <div className="algorithm-body">
              <h4>Components:</h4>

              <div className="components-grid">
                <div className="component">
                  <h3>🔵 Blue Arrow</h3>
                  <p><strong>Direction of Travel</strong></p>
                  <ul>
                    <li>Always faces where you're heading (device bearing)</li>
                    <li>Rotates with compass heading</li>
                    <li>Shows actual movement direction</li>
                    <li>Updates in real-time from device sensors</li>
                  </ul>
                </div>

                <div className="component">
                  <h3>⬜ White Arrow</h3>
                  <p><strong>North Reference</strong></p>
                  <ul>
                    <li>Always points North (↑)</li>
                    <li>Never rotates</li>
                    <li>Fixed geographic anchor</li>
                    <li>Visual North indicator</li>
                  </ul>
                </div>

                <div className="component">
                  <h3>🔴 Red Arrow</h3>
                  <p><strong>South Reference</strong></p>
                  <ul>
                    <li>Always points South (↓)</li>
                    <li>Never rotates</li>
                    <li>Confirms North-South axis</li>
                    <li>Visual geographic orientation</li>
                  </ul>
                </div>
              </div>

              <h4>Visual Layout:</h4>
              <pre>{`        ⬜
       ↑ (North - White)
      /  \\
     /    \\
    /  🔵  \\  ← Blue arrow faces heading
    \\        /    (rotates with device)
     \\      /
      \\    /
       ↓ (South - Red)
        🔴`}</pre>

              <h4>Technical Implementation:</h4>
              <ul>
                <li>Blue arrow rotation: CSS transform rotate with device heading</li>
                <li>White/Red arrows: Fixed position (no rotation)</li>
                <li>SVG composite element with 3 arrow paths</li>
                <li>Real-time update from device compass (Web Sensors API)</li>
                <li>Smooth rotation animation (0.2s transition)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Feature 2: Screen-Center Map Rotation</h2>
          <p>
            Map rotates around a fixed center point where the navigation arrow is always locked.
          </p>

          <div className="solution-box">
            <h3>Core Concept</h3>
            <p>
              <strong>Fixed position, rotating world:</strong> The arrow never moves from the center of the screen.
              Instead, the entire map rotates around it based on device heading.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Arrow Position</h3>
              <p>
                <strong>Always locked to screen center</strong>
              </p>
              <ul>
                <li>Composite arrow fixed at 50% X, 50% Y</li>
                <li>Never scrolls or moves</li>
                <li>Always visible</li>
                <li>User always sees their position</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Map Rotation</h3>
              <p>
                <strong>Entire map rotates around center</strong>
              </p>
              <ul>
                <li>Rotation angle = device heading</li>
                <li>All map content rotates together</li>
                <li>Routes rotate with map</li>
                <li>POIs maintain relative positions</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧭</div>
              <h3>Heading-Up Navigation</h3>
              <p>
                <strong>Map always shows direction of travel ahead</strong>
              </p>
              <ul>
                <li>North? Map shows North at top</li>
                <li>East? Map rotates to show East at top</li>
                <li>Natural intuitive movement</li>
                <li>Like helicopter view from above</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛣️</div>
              <h3>Route Navigation</h3>
              <p>
                <strong>Navigation route always visible ahead</strong>
              </p>
              <ul>
                <li>Route shows where to go</li>
                <li>Arrow points toward next waypoint</li>
                <li>Turn instructions visible ahead</li>
                <li>Distance to destination clear</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>User Experience</h3>
              <p>
                <strong>Intuitive, natural navigation</strong>
              </p>
              <ul>
                <li>No scrolling or panning needed</li>
                <li>Always centered on position</li>
                <li>World rotates, you stay still</li>
                <li>Like walking forward naturally</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Performance</h3>
              <p>
                <strong>Optimized for mobile devices</strong>
              </p>
              <ul>
                <li>CSS transform rotate (GPU accelerated)</li>
                <li>No re-layout or repaints</li>
                <li>Smooth 60 FPS animation</li>
                <li>Minimal battery impact</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Technical Architecture</h2>

          <div className="test-suite">
            <h3>Component Stack</h3>
            <ul>
              <li><strong>HeadingIndicator:</strong> Tri-directional arrow with composite SVG</li>
              <li><strong>MapRotation:</strong> CSS transform rotation on map container</li>
              <li><strong>CompassProvider:</strong> Device heading from Web Sensors API</li>
              <li><strong>NavigationCenter:</strong> Maintains screen-center positioning</li>
            </ul>
          </div>

          <div className="test-suite">
            <h3>Data Flow</h3>
            <pre>{`Device Compass (Web Sensors API)
    ↓
Heading angle (0-360°)
    ↓
HeadingIndicator (blue arrow rotation)
    ↓
MapRotation (CSS transform)
    ↓
Map content (routes, POIs, terrain)
    ↓
User sees world rotating around them`}</pre>
          </div>

          <div className="test-suite">
            <h3>Key Formulas</h3>
            <ul>
              <li><strong>Blue arrow rotation:</strong> transform: rotate with device heading angle</li>
              <li><strong>Map rotation:</strong> transform: rotate with device heading angle</li>
              <li><strong>Arrow position:</strong> Fixed at screen center (50%, 50%)</li>
              <li><strong>Rotation center:</strong> transform-origin: 50% 50% (center point)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>User Scenarios</h2>

          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Device Heading</th>
                <th>Map View</th>
                <th>Arrow Direction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Facing North (↑)</td>
                <td>0°</td>
                <td>North ahead (0° rotation)</td>
                <td>Blue points up (↑)</td>
              </tr>
              <tr>
                <td>Facing Northeast (↗)</td>
                <td>45°</td>
                <td>NE ahead (45° rotation)</td>
                <td>Blue points NE (↗)</td>
              </tr>
              <tr>
                <td>Facing East (→)</td>
                <td>90°</td>
                <td>East ahead (90° rotation)</td>
                <td>Blue points right (→)</td>
              </tr>
              <tr>
                <td>Facing South (↓)</td>
                <td>180°</td>
                <td>South ahead (180° rotation)</td>
                <td>Blue points down (↓)</td>
              </tr>
              <tr>
                <td>Facing West (←)</td>
                <td>270°</td>
                <td>West ahead (270° rotation)</td>
                <td>Blue points left (←)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Implementation Benefits</h2>

          <div className="highlights">
            <div className="highlight">
              <h3>✅ Intuitive Navigation</h3>
              <p>Users don't need to mentally rotate the map — the world rotates to match their heading.</p>
            </div>

            <div className="highlight">
              <h3>✅ Always Oriented</h3>
              <p>White (North) and Red (South) arrows provide constant geographic reference points.</p>
            </div>

            <div className="highlight">
              <h3>✅ No Scrolling</h3>
              <p>Center-locked arrow eliminates need for panning or scrolling the map.</p>
            </div>

            <div className="highlight">
              <h3>✅ Clear Direction</h3>
              <p>Blue arrow always shows where you're actually heading, updated in real-time.</p>
            </div>

            <div className="highlight">
              <h3>✅ Optimal Performance</h3>
              <p>GPU-accelerated CSS transforms ensure smooth 60 FPS animation on mobile devices.</p>
            </div>

            <div className="highlight">
              <h3>✅ Field-Ready</h3>
              <p>Compass heading works offline; no internet or GPS correction needed for rotation.</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Comparison: Traditional vs. Our Approach</h2>

          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Traditional Map</th>
                <th>Our Heading-Up System</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Arrow Position</td>
                <td>Moves around map</td>
                <td>Always center-fixed</td>
              </tr>
              <tr>
                <td>Map Rotation</td>
                <td>Manual toggle</td>
                <td>Automatic with heading</td>
              </tr>
              <tr>
                <td>Scrolling Required</td>
                <td>Yes (to keep user centered)</td>
                <td>No (always centered)</td>
              </tr>
              <tr>
                <td>North Reference</td>
                <td>Map top (when rotated)</td>
                <td>White arrow (always)</td>
              </tr>
              <tr>
                <td>Heading Indicator</td>
                <td>Single arrow</td>
                <td>Tri-directional (blue/white/red)</td>
              </tr>
              <tr>
                <td>User Mental Load</td>
                <td>Medium (rotate map mentally)</td>
                <td>Low (world rotates automatically)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="cta-section">
          <h2>Ready to Implement?</h2>
          <p>These features enhance navigation accuracy and user experience significantly.</p>
          <div className="cta-buttons-large">
            <Link href="/phase2" className="btn btn-large btn-primary">
              Back to Phase 2 →
            </Link>
            <Link href="/goals" className="btn btn-large btn-secondary">
              Goals & Motivation
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
