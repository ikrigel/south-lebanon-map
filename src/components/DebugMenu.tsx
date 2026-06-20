import { useState } from 'react';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

export function DebugMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(
    localStorage.getItem('DEBUG_ENABLED') !== 'false'
  );
  const [level, setLevel] = useState<LogLevel>(
    (localStorage.getItem('DEBUG_LEVEL') as LogLevel) || 'INFO'
  );

  const setDebugLevel = (newLevel: LogLevel) => {
    (window as any).debug?.[newLevel.toLowerCase()]?.();
    setLevel(newLevel);
    setIsEnabled(true);
  };

  const toggleDebug = () => {
    if (isEnabled) {
      (window as any).debug?.disable?.();
      setIsEnabled(false);
    } else {
      (window as any).debug?.info?.();
      setIsEnabled(true);
    }
  };

  return (
    <div className="debug-menu" data-testid="debug-menu">
      <button
        className="btn debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isEnabled ? '🐛 Debug enabled' : '🐛 Debug disabled'}
        aria-pressed={isOpen}
        data-testid="button-debug-toggle"
      >
        🐛
      </button>

      {isOpen && (
        <div className="debug-menu-dropdown" data-testid="debug-menu-dropdown">
          <div className="debug-status">
            Status: {isEnabled ? '✓ ENABLED' : '✗ DISABLED'} | Level: {level}
          </div>

          <div className="debug-buttons">
            <button
              className={`debug-btn ${level === 'TRACE' ? 'active' : ''}`}
              onClick={() => setDebugLevel('TRACE')}
              title="See everything"
              data-testid="debug-trace"
            >
              TRACE
            </button>
            <button
              className={`debug-btn ${level === 'DEBUG' ? 'active' : ''}`}
              onClick={() => setDebugLevel('DEBUG')}
              title="Detailed debugging"
              data-testid="debug-debug"
            >
              DEBUG
            </button>
            <button
              className={`debug-btn ${level === 'INFO' ? 'active' : ''}`}
              onClick={() => setDebugLevel('INFO')}
              title="Normal operations"
              data-testid="debug-info"
            >
              INFO
            </button>
            <button
              className={`debug-btn ${level === 'WARN' ? 'active' : ''}`}
              onClick={() => setDebugLevel('WARN')}
              title="Warnings only"
              data-testid="debug-warn"
            >
              WARN
            </button>
            <button
              className={`debug-btn ${level === 'ERROR' ? 'active' : ''}`}
              onClick={() => setDebugLevel('ERROR')}
              title="Errors only"
              data-testid="debug-error"
            >
              ERROR
            </button>
          </div>

          <button
            className="debug-btn toggle-btn"
            onClick={toggleDebug}
            data-testid="debug-toggle-btn"
          >
            {isEnabled ? 'Disable All' : 'Enable'}
          </button>
        </div>
      )}
    </div>
  );
}
