// Debug logging utility with levels and toggle
type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

// Initialize localStorage with default values if not set
if (!localStorage.getItem('DEBUG_ENABLED')) {
  localStorage.setItem('DEBUG_ENABLED', 'false');
}
if (!localStorage.getItem('DEBUG_LEVEL')) {
  localStorage.setItem('DEBUG_LEVEL', 'INFO');
}

let config: DebugConfig = {
  enabled: localStorage.getItem('DEBUG_ENABLED') !== 'false',
  level: (localStorage.getItem('DEBUG_LEVEL') as LogLevel) || 'INFO',
  prefix: '[DEBUG]',
};

// Event emitter for debug state changes
class DebugEventEmitter {
  private listeners = new Set<(config: DebugConfig) => void>();

  subscribe(callback: (config: DebugConfig) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit() {
    this.listeners.forEach(cb => cb({ ...config }));
  }
}

const debugEmitter = new DebugEventEmitter();

// Quick helper to enable and set level
function enableAtLevel(level: LogLevel) {
  config.enabled = true;
  config.level = level;
  localStorage.setItem('DEBUG_ENABLED', 'true');
  localStorage.setItem('DEBUG_LEVEL', level);
  console.log(`✅ Debug enabled at level: ${level}`);
  debugEmitter.emit();
}

// Expose control functions globally for console access
(window as any).debug = {
  // Quick shortcuts: debug.trace, debug.debug, debug.info, etc.
  trace: () => enableAtLevel('TRACE'),
  all: () => enableAtLevel('TRACE'),
  debug: () => enableAtLevel('DEBUG'),
  info: () => enableAtLevel('INFO'),
  warn: () => enableAtLevel('WARN'),
  error: () => enableAtLevel('ERROR'),
  disable: () => {
    config.enabled = false;
    localStorage.setItem('DEBUG_ENABLED', 'false');
    console.log('❌ Debug logging disabled');
    debugEmitter.emit();
  },

  // Verbose methods (for backward compatibility)
  enable: () => enableAtLevel('INFO'),
  setLevel: (level: LogLevel) => {
    if (!LOG_LEVELS.hasOwnProperty(level)) {
      console.error(`Invalid level: ${level}. Use: ERROR, WARN, INFO, DEBUG, TRACE`);
      return;
    }
    config.level = level;
    localStorage.setItem('DEBUG_LEVEL', level);
    console.log(`📊 Debug level set to: ${level}`);
    debugEmitter.emit();
  },
  status: () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                  DEBUG STATUS                              ║
╠════════════════════════════════════════════════════════════╣
║  Enabled: ${config.enabled ? '✓ YES' : '✗ NO'}                                      ║
║  Level:   ${config.level.padEnd(5)}                                       ║
║                                                            ║
║  QUICK COMMANDS:                                           ║
║  • debug.trace      - Enable everything                   ║
║  • debug.debug      - Detailed debug logs                 ║
║  • debug.info       - Normal operation logs               ║
║  • debug.warn       - Warnings + errors only              ║
║  • debug.error      - Errors only                         ║
║  • debug.disable    - Turn off all logs                   ║
║  • debug.all        - Same as .trace                      ║
║  • debug.status     - Show this message                   ║
║                                                            ║
║  LEGACY COMMANDS:                                          ║
║  • debug.enable()        • debug.setLevel('LEVEL')        ║
╚════════════════════════════════════════════════════════════╝
    `);
  },
};

// Keep DEBUG as alias for backward compatibility
(window as any).DEBUG = (window as any).debug;

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] <= LOG_LEVELS[config.level];
}

function formatLog(level: LogLevel, context: string, message: string, data?: any): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString().split('T')[1];
  const color = {
    ERROR: '%c🔴 ERROR',
    WARN: '%c🟡 WARN',
    INFO: '%c🔵 INFO',
    DEBUG: '%c🟢 DEBUG',
    TRACE: '%c⚪ TRACE',
  }[level];

  const colorStyle = {
    ERROR: 'color: red; font-weight: bold;',
    WARN: 'color: orange; font-weight: bold;',
    INFO: 'color: blue; font-weight: bold;',
    DEBUG: 'color: green;',
    TRACE: 'color: gray;',
  }[level];

  if (data !== undefined) {
    console.log(
      `${color} [${timestamp}] ${context}`,
      colorStyle,
      message,
      data
    );
  } else {
    console.log(`${color} [${timestamp}] ${context}: ${message}`, colorStyle);
  }
}

export const debugLog = {
  error: (context: string, message: string, data?: any) =>
    formatLog('ERROR', context, message, data),
  warn: (context: string, message: string, data?: any) =>
    formatLog('WARN', context, message, data),
  info: (context: string, message: string, data?: any) =>
    formatLog('INFO', context, message, data),
  debug: (context: string, message: string, data?: any) =>
    formatLog('DEBUG', context, message, data),
  trace: (context: string, message: string, data?: any) =>
    formatLog('TRACE', context, message, data),
};

// Export emitter for UI to subscribe to config changes
export { debugEmitter };

// Call subscribers on module load so any late-mounting components get initial state
setTimeout(() => debugEmitter.emit(), 0);

let initLogged = false;

export function initDebugLogging() {
  if (initLogged) return; // Only log once
  initLogged = true;

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           📋 DEBUG LOGGING SYSTEM INITIALIZED              ║
╠════════════════════════════════════════════════════════════╣
║  🔧 Version: 4.7.9 (LOW-SPEED DETECTION)                      ║
║  Status: ${config.enabled ? '✓ ENABLED' : '✗ DISABLED'}                                      ║
║  Level:  ${config.level}                                          ║
║                                                            ║
║  Console commands:                                         ║
║  • debug.debug           - Detailed debug info            ║
║  • debug.trace           - Everything                     ║
║  • debug.info            - Normal operations              ║
║  • debug.warn            - Warnings only                  ║
║  • debug.error           - Errors only                    ║
║  • debug.disable         - Turn off all logs              ║
║  • debug.status()        - Show current config            ║
║                                                            ║
║  Levels: ERROR < WARN < INFO < DEBUG < TRACE             ║
╚════════════════════════════════════════════════════════════╝
  `);
}
