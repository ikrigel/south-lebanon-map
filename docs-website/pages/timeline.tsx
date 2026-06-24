import Head from 'next/head';

export default function Timeline() {
  return (
    <>
      <Head>
        <title>Timeline | Coreset Camera Calibration</title>
      </Head>

      <div className="page-content">
        <h1>📅 Implementation Timeline</h1>

        <section>
          <h2>6-Week Sprint Schedule</h2>
          <p className="intro">72 total engineering hours across 6 sprints with clear deliverables</p>

          <div className="sprint">
            <h3>Sprint 1-2: Weeks 1-2 (16 hours)</h3>
            <div className="sprint-content">
              <h4>SVD & Coreset Algorithms</h4>

              <div className="task">
                <strong>Sprint 1 — SVD Math</strong>
                <ul>
                  <li>Implement Jacobi SVD for 3×3 matrices</li>
                  <li>Unit tests: svd-compact.test.ts (10 tests)</li>
                  <li>Benchmark vs. NumPy reference</li>
                  <li>Code review & documentation</li>
                </ul>
                <p className="hours">⏱️ 8 hours</p>
              </div>

              <div className="task">
                <strong>Sprint 2 — Coreset & ICP</strong>
                <ul>
                  <li>Implement Carathéodory coreset sampling</li>
                  <li>Implement Witness-Set ICP (50 trials)</li>
                  <li>Unit tests: coreset-lms.test.ts (12 tests)</li>
                  <li>Unit tests: witness-icp.test.ts (8 tests)</li>
                  <li>Verify Carathéodory property mathematically</li>
                </ul>
                <p className="hours">⏱️ 8 hours</p>
              </div>

              <div className="deliverables">
                <strong>✅ Deliverables:</strong>
                <ul>
                  <li>3 core math modules (250 lines)</li>
                  <li>30 unit tests with 100% coverage</li>
                  <li>Performance benchmarks (&lt; 10ms per operation)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="sprint">
            <h3>Sprint 3: Week 3 (12 hours)</h3>
            <div className="sprint-content">
              <h4>ICP & Camera Model</h4>

              <div className="task">
                <strong>Zhang Calibration Method</strong>
                <ul>
                  <li>Implement camera K matrix computation</li>
                  <li>Homography extraction from frames</li>
                  <li>DLT system building & solving</li>
                  <li>Levenberg-Marquardt refinement (optional)</li>
                  <li>Unit tests: camera-model.test.ts (15 tests)</li>
                </ul>
                <p className="hours">⏱️ 6 hours</p>
              </div>

              <div className="task">
                <strong>Corner Detection</strong>
                <ul>
                  <li>Implement checkerboard corner localization</li>
                  <li>Subpixel precision refinement</li>
                  <li>Quality metrics (sharpness, rotation)</li>
                  <li>Unit tests: corner-detector.test.ts (8 tests)</li>
                </ul>
                <p className="hours">⏱️ 6 hours</p>
              </div>

              <div className="deliverables">
                <strong>✅ Deliverables:</strong>
                <ul>
                  <li>Camera model + corner detection (300 lines)</li>
                  <li>23 unit tests with edge case coverage</li>
                  <li>Integration with coreset module</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="sprint">
            <h3>Sprint 4-5: Weeks 4-5 (20 hours)</h3>
            <div className="sprint-content">
              <h4>React Integration & UI</h4>

              <div className="task">
                <strong>Sprint 4 — React Hook & Storage</strong>
                <ul>
                  <li>Create useCalibration hook</li>
                  <li>Implement localStorage persistence</li>
                  <li>Implement Firestore sync (if logged in)</li>
                  <li>Progress tracking & state management</li>
                  <li>Unit tests: useCalibration.test.ts (10 tests)</li>
                </ul>
                <p className="hours">⏱️ 10 hours</p>
              </div>

              <div className="task">
                <strong>Sprint 5 — UI Wizard</strong>
                <ul>
                  <li>Build CalibrationModal 3-step wizard</li>
                  <li>Camera stream integration</li>
                  <li>Real-time corner detection overlay</li>
                  <li>Quality badge & feedback UI</li>
                  <li>UI tests: CalibrationModal.test.tsx (8 tests)</li>
                  <li>Mobile responsiveness & accessibility</li>
                </ul>
                <p className="hours">⏱️ 10 hours</p>
              </div>

              <div className="deliverables">
                <strong>✅ Deliverables:</strong>
                <ul>
                  <li>CalibrationModal component (400 lines)</li>
                  <li>useCalibration hook (100 lines)</li>
                  <li>18 unit + UI tests</li>
                  <li>Full integration with all algorithms</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="sprint">
            <h3>Sprint 6: Week 6 (12 hours)</h3>
            <div className="sprint-content">
              <h4>Testing & Phase 2 Integration</h4>

              <div className="task">
                <strong>Playwright E2E Tests</strong>
                <ul>
                  <li>calibration-capture.spec.ts (12 tests) - Full capture workflow</li>
                  <li>calibration-results.spec.ts (8 tests) - Results display & persistence</li>
                  <li>calibration-accuracy.spec.ts (3 tests) - Accuracy metrics</li>
                  <li>Mobile device testing</li>
                  <li>Offline mode verification</li>
                </ul>
                <p className="hours">⏱️ 6 hours</p>
              </div>

              <div className="task">
                <strong>Phase 2 Integration & Polish</strong>
                <ul>
                  <li>Hook Phase 2 useObjectLocalization to K matrix</li>
                  <li>Before/after accuracy comparison</li>
                  <li>Performance optimization & profiling</li>
                  <li>Documentation & release notes</li>
                  <li>Final QA & testing</li>
                </ul>
                <p className="hours">⏱️ 6 hours</p>
              </div>

              <div className="deliverables">
                <strong>✅ Deliverables:</strong>
                <ul>
                  <li>23 Playwright E2E tests (all passing)</li>
                  <li>Phase 2 integration complete</li>
                  <li>≥ 10% accuracy improvement demonstrated</li>
                  <li>Production-ready code</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Summary Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Phase</th>
                <th>Duration</th>
                <th>Hours</th>
                <th>Modules</th>
                <th>Tests</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1-2: Math</td>
                <td>2 weeks</td>
                <td>16</td>
                <td>SVD, Coreset, ICP</td>
                <td>30 unit</td>
              </tr>
              <tr>
                <td>3: Models</td>
                <td>1 week</td>
                <td>12</td>
                <td>Camera, Corners</td>
                <td>23 unit</td>
              </tr>
              <tr>
                <td>4-5: React</td>
                <td>2 weeks</td>
                <td>20</td>
                <td>Hook, Modal, UI</td>
                <td>18 unit</td>
              </tr>
              <tr>
                <td>6: QA + Integration</td>
                <td>1 week</td>
                <td>12</td>
                <td>Tests, Polish</td>
                <td>23 E2E</td>
              </tr>
              <tr style={{ backgroundColor: '#f0f4f8', fontWeight: 'bold' }}>
                <td>TOTAL</td>
                <td>6 weeks</td>
                <td>72 hours</td>
                <td>8 modules</td>
                <td>84 tests</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Success Criteria by Week</h2>

          <div className="milestone">
            <h3>End of Week 2</h3>
            <ul>
              <li>✅ SVD, Coreset, ICP fully tested</li>
              <li>✅ 30 unit tests passing</li>
              <li>✅ Performance benchmarks met (&lt; 10ms per op)</li>
            </ul>
          </div>

          <div className="milestone">
            <h3>End of Week 3</h3>
            <ul>
              <li>✅ Camera model + corner detection working</li>
              <li>✅ 23 more unit tests passing (53 total)</li>
              <li>✅ Integration with coreset module verified</li>
            </ul>
          </div>

          <div className="milestone">
            <h3>End of Week 5</h3>
            <ul>
              <li>✅ React integration complete</li>
              <li>✅ 18 UI tests passing (71 total)</li>
              <li>✅ Full UI wizard functional</li>
              <li>✅ Mobile responsiveness verified</li>
            </ul>
          </div>

          <div className="milestone">
            <h3>End of Week 6</h3>
            <ul>
              <li>✅ All 84 tests passing</li>
              <li>✅ ≥ 10% accuracy improvement in Phase 2</li>
              <li>✅ Offline mode verified</li>
              <li>✅ Production-ready deployment</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Resource Allocation</h2>
          <div className="hours-breakdown">
            <div className="hour-item">
              <div className="hour-label">Math Algorithms</div>
              <div className="hour-bar" style={{ width: '40%' }}></div>
              <div className="hour-count">28 hours (39%)</div>
            </div>

            <div className="hour-item">
              <div className="hour-label">React Integration</div>
              <div className="hour-bar" style={{ width: '28%' }}></div>
              <div className="hour-count">20 hours (28%)</div>
            </div>

            <div className="hour-item">
              <div className="hour-label">Testing</div>
              <div className="hour-bar" style={{ width: '24%' }}></div>
              <div className="hour-count">17 hours (24%)</div>
            </div>

            <div className="hour-item">
              <div className="hour-label">Documentation & QA</div>
              <div className="hour-bar" style={{ width: '9%' }}></div>
              <div className="hour-count">7 hours (9%)</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
