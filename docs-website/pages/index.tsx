import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Coreset Camera Calibration | Implementation Plan</title>
        <meta name="description" content="Phase 3: Advanced camera intrinsic calibration using provably-approximated algorithms" />
      </Head>

      <div className="hero">
        <div className="hero-content">
          <h1>🎥 Coreset Camera Calibration</h1>
          <h2>Phase 3: Advanced GPS Localization</h2>
          <p>Implementation of Dan Feldman's Coreset algorithms for real-time camera calibration on mobile devices</p>

          <div className="cta-buttons">
            <Link href="/overview" className="btn btn-primary">
              📖 Overview
            </Link>
            <Link href="/algorithms" className="btn btn-secondary">
              🧮 Algorithms
            </Link>
            <Link href="/testing" className="btn btn-secondary">
              ✅ Testing Plan
            </Link>
            <Link href="/timeline" className="btn btn-secondary">
              📅 Timeline
            </Link>
          </div>
        </div>
      </div>

      <section className="features">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Ultra-Fast Calibration</h3>
            <p>Complete camera calibration in &lt; 2 seconds on mobile devices</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔬</div>
            <h3>Mathematically Proven</h3>
            <p>Based on peer-reviewed algorithms with ε-approximation guarantees</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>100% Offline</h3>
            <p>No internet required - pure client-side computation</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>±100m Accuracy</h3>
            <p>Improve object localization accuracy by ≥10%</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>No External Libraries</h3>
            <p>Pure TypeScript - zero dependencies on ML frameworks</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧪</div>
            <h3>84 Tests</h3>
            <p>61 unit tests + 23 Playwright E2E tests with 100% coverage</p>
          </div>
        </div>
      </section>

      <section className="highlights">
        <div className="highlight">
          <h3>📊 Data Compression</h3>
          <p>Reduce calibration frames from 12 to 5 using Carathéodory's Theorem</p>
          <code>12 frames → 5 frames (58% reduction)</code>
        </div>

        <div className="highlight">
          <h3>🚀 Performance</h3>
          <p>2.4× speedup while maintaining mathematical guarantees</p>
          <code>&lt; 2 seconds per calibration</code>
        </div>

        <div className="highlight">
          <h3>📐 Precision</h3>
          <p>Reprojection error under 2 pixels for accurate GPS</p>
          <code>&lt; 2.0px RMS error</code>
        </div>
      </section>

      <section className="architecture">
        <h2>Implementation Architecture</h2>
        <div className="architecture-diagram">
          <div className="stage">
            <h4>Stage 1</h4>
            <p>📸 Capture 8-12 photos of checkerboard pattern</p>
          </div>
          <div className="arrow">→</div>
          <div className="stage">
            <h4>Stage 2</h4>
            <p>🎯 Detect 48 corners per frame</p>
          </div>
          <div className="arrow">→</div>
          <div className="stage">
            <h4>Stage 3</h4>
            <p>📊 Select 5 representative frames</p>
          </div>
          <div className="arrow">→</div>
          <div className="stage">
            <h4>Stage 4</h4>
            <p>🔢 Compute K matrix (intrinsics)</p>
          </div>
          <div className="arrow">→</div>
          <div className="stage">
            <h4>Stage 5</h4>
            <p>💾 Store & Apply to GPS</p>
          </div>
        </div>
      </section>

      <section className="timeline">
        <h2>6-Week Implementation Timeline</h2>
        <div className="timeline-grid">
          <div className="timeline-item">
            <div className="week">Week 1-2</div>
            <div className="task">SVD & Coreset Algorithms</div>
            <div className="hours">16 hours</div>
          </div>
          <div className="timeline-item">
            <div className="week">Week 3</div>
            <div className="task">ICP & Camera Model</div>
            <div className="hours">12 hours</div>
          </div>
          <div className="timeline-item">
            <div className="week">Week 4-5</div>
            <div className="task">React Integration & UI</div>
            <div className="hours">20 hours</div>
          </div>
          <div className="timeline-item">
            <div className="week">Week 6</div>
            <div className="task">Testing & E2E</div>
            <div className="hours">24 hours</div>
          </div>
        </div>
        <p className="timeline-note"><strong>Total: 6 weeks, 72 hours</strong></p>
      </section>

      <section className="cta-section">
        <h2>Ready to Dive In?</h2>
        <p>Explore the implementation plan, algorithms, and testing strategy</p>
        <div className="cta-buttons-large">
          <Link href="/overview" className="btn btn-large btn-primary">
            Start Reading →
          </Link>
          <a href="https://github.com/ikrigel/south-lebanon-map" target="_blank" rel="noopener noreferrer" className="btn btn-large btn-outline">
            View on GitHub
          </a>
        </div>
      </section>
    </>
  );
}
