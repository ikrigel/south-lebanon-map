import { useState, useEffect } from 'react';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

function setDebugState(level: LogLevel) {
  localStorage.setItem('DEBUG_ENABLED', 'true');
  localStorage.setItem('DEBUG_LEVEL', level);
  console.log(`✅ Debug enabled at level: ${level}`);
}

function disableDebugState() {
  localStorage.setItem('DEBUG_ENABLED', 'false');
  console.log('❌ Debug logging disabled');
}

export function DebugMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('DEBUG_ENABLED') !== 'false'
  );
  const [level, setLevel] = useState<LogLevel>(
    (localStorage.getItem('DEBUG_LEVEL') as LogLevel) || 'INFO'
  );

  // Listen for changes from console commands
  useEffect(() => {
    const handleStorageChange = () => {
      const newEnabled = localStorage.getItem('DEBUG_ENABLED') !== 'false';
      const newLevel = (localStorage.getItem('DEBUG_LEVEL') as LogLevel) || 'INFO';
      setIsEnabled(newEnabled);
      setLevel(newLevel);
    };

    // Listen for storage changes (from other tabs or console)
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from debugLog when changed via console
    window.addEventListener('debug-level-changed', () => {
      handleStorageChange();
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('debug-level-changed', handleStorageChange);
    };
  }, []);

  const setDebugLevel = (newLevel: LogLevel) => {
    setDebugState(newLevel);
    setLevel(newLevel);
    setIsEnabled(true);
    // Emit custom event for other components
    window.dispatchEvent(new Event('debug-level-changed'));
  };

  const toggleDebug = () => {
    if (isEnabled) {
      disableDebugState();
      setIsEnabled(false);
    } else {
      setDebugState('INFO');
      setIsEnabled(true);
    }
    window.dispatchEvent(new Event('debug-level-changed'));
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
