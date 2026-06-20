import { useState, useEffect } from 'react';
import { debugEmitter } from '../utils/debugLog';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

export function DebugMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);  // Will sync from emitter
  const [level, setLevel] = useState<LogLevel>('INFO');  // Will sync from emitter

  // Subscribe to debug config changes (event-driven, zero polling overhead!)
  useEffect(() => {
    const unsubscribe = debugEmitter.subscribe((config) => {
      console.log(`[DebugMenu] Emitter update: enabled=${config.enabled}, level=${config.level}`);
      setIsEnabled(config.enabled);
      setLevel(config.level);
    });
    // Immediately subscribe should call with current state via setTimeout emit in module load
    return unsubscribe;
  }, []);

  const setDebugLevel = (newLevel: LogLevel) => {
    (window as any).debug[newLevel.toLowerCase()]?.();
  };

  const toggleDebug = () => {
    if (isEnabled) {
      (window as any).debug.disable?.();
    } else {
      (window as any).debug.info?.();
    }
  };

  if (!isOpen) {
    return (
      <button
        className="btn debug-icon"
        onClick={() => setIsOpen(true)}
        title="🐛 Debug Menu"
        data-testid="button-debug-menu"
      >
        🐛
      </button>
    );
  }

  // Modal dialog
  return (
    <div className="debug-modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="debug-modal" onClick={e => e.stopPropagation()}>
        <div className="debug-modal-header">
          <h3>🐛 Debug Logging</h3>
          <button
            className="debug-modal-close"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="debug-modal-body">
          <div className="debug-status-info">
            <strong>Status:</strong> {isEnabled ? '✓ ENABLED' : '✗ DISABLED'}<br/>
            <strong>Level:</strong> {level}
          </div>

          <div className="debug-level-buttons">
            <button
              className={`debug-level-btn ${level === 'TRACE' ? 'active' : ''}`}
              onClick={() => setDebugLevel('TRACE')}
              title="See absolutely everything"
            >
              TRACE
            </button>
            <button
              className={`debug-level-btn ${level === 'DEBUG' ? 'active' : ''}`}
              onClick={() => setDebugLevel('DEBUG')}
              title="Detailed debug info (recommended)"
            >
              DEBUG
            </button>
            <button
              className={`debug-level-btn ${level === 'INFO' ? 'active' : ''}`}
              onClick={() => setDebugLevel('INFO')}
              title="Normal operations only"
            >
              INFO
            </button>
            <button
              className={`debug-level-btn ${level === 'WARN' ? 'active' : ''}`}
              onClick={() => setDebugLevel('WARN')}
              title="Warnings and errors"
            >
              WARN
            </button>
            <button
              className={`debug-level-btn ${level === 'ERROR' ? 'active' : ''}`}
              onClick={() => setDebugLevel('ERROR')}
              title="Errors only"
            >
              ERROR
            </button>
          </div>

          <button
            className="debug-toggle-btn"
            onClick={toggleDebug}
          >
            {isEnabled ? '🔴 Disable All' : '🟢 Enable'}
          </button>

          <div className="debug-console-section">
            <strong>💻 Console Shortcuts</strong>
            <p className="debug-shortcuts-list">
              Type in browser console (F12):<br/>
              <code>debug.trace</code> — Everything<br/>
              <code>debug.debug</code> — Detailed<br/>
              <code>debug.info</code> — Normal<br/>
              <code>debug.warn</code> — Warnings<br/>
              <code>debug.error</code> — Errors<br/>
              <code>debug.disable</code> — Turn off
            </p>
            <p className="debug-shortcuts-note">
              ✨ Menu updates automatically when you use console commands!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
