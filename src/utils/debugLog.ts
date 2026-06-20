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

let config: DebugConfig = {
  enabled: localStorage.getItem('DEBUG_ENABLED') !== 'false',
  level: (localStorage.getItem('DEBUG_LEVEL') as LogLevel) || 'INFO',
  prefix: '[DEBUG]',
};

// Expose control functions globally for console access
(window as any).DEBUG = {
  enable: () => {
    config.enabled = true;
    localStorage.setItem('DEBUG_ENABLED', 'true');
    console.log('🔓 Debug logging ENABLED');
  },
  disable: () => {
    config.enabled = false;
    localStorage.setItem('DEBUG_ENABLED', 'false');
    console.log('🔒 Debug logging DISABLED');
  },
  setLevel: (level: LogLevel) => {
    if (!LOG_LEVELS.hasOwnProperty(level)) {
      console.error(`Invalid level: ${level}. Use: ERROR, WARN, INFO, DEBUG, TRACE`);
      return;
    }
    config.level = level;
    localStorage.setItem('DEBUG_LEVEL', level);
    console.log(`📊 Debug level set to: ${level}`);
  },
  status: () => {
    console.log(`✓ Debug enabled: ${config.enabled}`);
    console.log(`✓ Debug level: ${config.level}`);
    console.log(`✓ Available levels: ERROR, WARN, INFO, DEBUG, TRACE`);
    console.log(`✓ Commands: DEBUG.enable(), DEBUG.disable(), DEBUG.setLevel('LEVEL')`);
  },
};

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

export function initDebugLogging() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           📋 DEBUG LOGGING SYSTEM INITIALIZED              ║
╠════════════════════════════════════════════════════════════╣
║  Status: ${config.enabled ? '✓ ENABLED' : '✗ DISABLED'}                                      ║
║  Level:  ${config.level}                                          ║
║                                                            ║
║  Console commands:                                         ║
║  • DEBUG.enable()        - Turn on all logs               ║
║  • DEBUG.disable()       - Turn off all logs              ║
║  • DEBUG.setLevel(LEVEL) - Set minimum level             ║
║  • DEBUG.status()        - Show current config            ║
║                                                            ║
║  Levels: ERROR < WARN < INFO < DEBUG < TRACE             ║
╚════════════════════════════════════════════════════════════╝
  `);
}
