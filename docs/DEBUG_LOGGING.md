# Debug Logging System

Interactive debug logging system for tracing state changes and tracking user actions across the app.

## Quick Start

Open browser console (F12) and type any of these:

### ⚡ Fastest Way (One word!)

```javascript
debug.trace    // Maximum verbosity - see everything
debug.debug    // Detailed debug information
debug.info     // Normal operation logs
debug.warn     // Warnings and errors only
debug.error    // Errors only
debug.disable  // Turn off all logs
```

### 📋 Status & Control

```javascript
debug.status   // Show current config and all commands
debug.all      // Same as debug.trace
```

### 📚 Verbose Methods (old style, still works)

```javascript
debug.enable()          // Turn on at INFO level
debug.setLevel('DEBUG') // Set minimum level
DEBUG.status()          // Show status (DEBUG is alias)
```

## Log Levels

Lower number = fewer logs, Higher number = more verbose.

| Level | Icon | When to Use |
|-------|------|------------|
| `ERROR` | 🔴 | Only critical errors (default when debugging) |
| `WARN` | 🟡 | Warnings and validation failures |
| `INFO` | 🔵 | Normal operations (map.setView, GPS updates) |
| `DEBUG` | 🟢 | Detailed operations (pan calculations, offsets) |
| `TRACE` | ⚪ | Every function call and state change (very verbose) |

## Console Commands

### ⚡ Quick Shortcuts (Recommended)

Just type in console - no parentheses needed!

```javascript
debug.trace      // 🟣 Everything - for deep debugging
debug.debug      // 🟢 Detailed - recommended for troubleshooting  
debug.info       // 🔵 Normal - important operations only
debug.warn       // 🟡 Warnings - issues and errors only
debug.error      // 🔴 Errors - critical errors only
debug.all        // 🟣 Same as .trace
debug.disable    // ❌ Turn off completely
debug.status     // ℹ️  Show this help
```

### 📚 Full Commands (with parentheses)

```javascript
debug.enable()           // Enable at INFO level
debug.setLevel('DEBUG')  // Set to specific level
debug.disable()          // Disable
debug.status()           // Show config
```

### 🔀 Backward Compatibility

`DEBUG` is an alias for `debug`, so these also work:

```javascript
DEBUG.enable()
DEBUG.setLevel('WARN')
DEBUG.status()
```

## Typical Debugging Workflow

### 1. Reproduce the issue

1. Open DevTools: F12 → Console tab
2. Enable debugging: `DEBUG.enable()`
3. Set level: `DEBUG.setLevel('DEBUG')`
4. Perform actions that cause the issue
5. Watch console for messages

### 2. Focus on specific areas

If issue is related to:

- **Navigation/GPS**: Look for `[NAV]` and `[GPS UPDATE EFFECT]` logs
- **Map clicks**: Look for `[Map.tsx focusTarget]` logs
- **Zoom changes**: Look for `[ZOOM EFFECT]` logs
- **Screen rotation**: Look for `[RESIZE EFFECT]` logs

### 3. Filter by log level

```javascript
// Only show errors and warnings
DEBUG.setLevel('WARN')

// Show detailed info
DEBUG.setLevel('DEBUG')
```

## Example: Tracking the GPS Jump Bug

**Scenario**: Map jumps to wrong location after clicking

```javascript
// 1. Enable detailed logging
DEBUG.enable()
DEBUG.setLevel('TRACE')

// 2. Perform action
// - Click on map
// - Notice map jumps
// - Check console

// 3. Look for:
// 🔴 [Map.tsx] INVALID focusTarget coords
// or
// 🔵 [GPS UPDATE EFFECT] Invalid coordinates rejected
```

## Persistence

Debug settings are saved to `localStorage`:

- **`DEBUG_ENABLED`**: `'true'` or `'false'`
- **`DEBUG_LEVEL`**: `'ERROR'` | `'WARN'` | `'INFO'` | `'DEBUG'` | `'TRACE'`

These persist across page reloads, so you don't have to reconfigure after refreshing.

## Log Output Format

Each log shows:

```
🔵 INFO [14:32:45.123Z] context/module: Message
```

Components:
- **Icon** — Log level indicator
- **Level** — ERROR, WARN, INFO, DEBUG, TRACE
- **Timestamp** — Time in HH:MM:SS.sssZ format
- **Context** — Which module/function generated the log
- **Message** — The actual log content
- **Data** — Optional object/value for inspection

## Adding Logs in Code

```typescript
import { debugLog } from 'src/utils/debugLog';

// Log at different levels
debugLog.error('MyModule', 'Something went wrong', { error: e });
debugLog.warn('MyModule', 'Invalid coordinate detected', { lat, lon });
debugLog.info('MyModule', 'Navigation started');
debugLog.debug('MyModule', 'Calculating offset', { offsetX, offsetY });
debugLog.trace('MyModule', 'Function called', { args });
```

## Disable for Production

In `App.tsx` initialization:

```typescript
import { initDebugLogging } from 'src/utils/debugLog';

export function App() {
  useEffect(() => {
    initDebugLogging();
  }, []);
  // ...
}
```

The system reads `localStorage` to remember user's preferences, so they can debug when needed and disable when not.

## Troubleshooting

### Logs not showing?

1. Check if enabled: `DEBUG.status()`
2. Check log level: `DEBUG.setLevel('TRACE')`
3. Check browser filters: Console tab might have a filter applied
4. Hard refresh: Ctrl+Shift+R

### Too many logs?

1. Lower the level: `DEBUG.setLevel('INFO')`
2. Or disable entirely: `DEBUG.disable()`
3. Search by context: Ctrl+F in console to find specific modules

### Logs disappeared after page reload?

This is normal — logs are session-only. The **settings** (enabled/level) persist in localStorage, but the logs themselves are not stored. To see logs again, perform the action again.
