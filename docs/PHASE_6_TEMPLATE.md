# Phase 6: Component/Hook Split Template

This document provides a pattern for splitting oversized files in Phase 6.

## Files Requiring Splits

| File | Lines | Target | Action |
|------|-------|--------|--------|
| NavigationPanel.tsx | 435 | 200 | Extract route options/saved routes sections |
| TransferModal.tsx | 484 | 200 | Extract Send/Receive tabs |
| Map.tsx | 314 | 280 | Extract layer init or popup HTML |
| MultiRoutePanel.tsx | 264 | 230 | Extract route point list |
| useMapInit.ts | 257 | 240 | Extract control factories or helper functions |

## Pattern: Component Extraction

### Step 1: Identify the extraction target
- Look for conditional sections (`{condition && <JSX />}`)
- Look for large sub-trees that handle one concern
- Look for helper functions that could be external utilities

### Step 2: Create the sub-component
```tsx
// src/components/path/SubComponent.tsx
import type { Props } from '../types';

interface SubComponentProps {
  // Extract ONLY the props this sub-component uses
  prop1: type1;
  prop2: type2;
  onAction: (value) => void;
}

export function SubComponent(props: SubComponentProps) {
  return (
    <div>
      {/* Moved JSX from parent */}
    </div>
  );
}
```

### Step 3: Import and render in parent
```tsx
import { SubComponent } from './SubComponent';

export function ParentComponent(props: ParentProps) {
  return (
    <div>
      <SubComponent 
        prop1={props.prop1}
        prop2={props.prop2}
        onAction={props.onAction}
      />
    </div>
  );
}
```

### Step 4: Test
```bash
npm test -- --run          # Must stay 289/289
wc -l src/components/path/*.tsx  # Verify ≤250
```

### Step 5: Commit
```bash
git add -A
git commit -m "Phase 6.X: Extract SubComponent from ParentComponent

Extracted <description> from ParentComponent.tsx into SubComponent.tsx

Impact:
- ParentComponent: XXX → YYY lines
- SubComponent: new (ZZZ lines)
- Tests: 289/289 passing ✅"
```

## Example: TransferModal → TransferSendTab

```tsx
// BEFORE: TransferModal.tsx 484 lines
{tab === 'send' && (
  <div className="transfer-send">
    {/* 86 lines of Send tab JSX */}
  </div>
)}

// AFTER: TransferSendTab.tsx (new, ~90 lines)
export function TransferSendTab(props: TransferSendTabProps) {
  return <div className="transfer-send">...</div>;
}

// AFTER: TransferModal.tsx (~400 lines)
<TransferSendTab {...sendTabProps} />
```

## Independent Extractions

Each file can be split independently:
- **NavigationPanel** split doesn't affect **TransferModal** split
- Can be done in any order
- Each test run should confirm 289/289 tests still pass

## Success Criteria

For Phase 6 to be complete:
1. All non-test, non-data source files ≤250 lines
2. 289/289 tests passing
3. No behavioral changes
4. Components properly typed with interfaces
5. All extractions committed

## Expected Final State

```
✅ src/App.tsx                          ≤250 lines
✅ src/hooks/                           all ≤250 lines
✅ src/components/layout/              all ≤250 lines
✅ src/components/panels/              all ≤250 lines
✅ src/components/modals/              all ≤250 lines
✅ src/components/drawers/             all ≤250 lines
✅ Tests                                289/289 passing
```

## Time Estimate

- **NavigationPanel**: ~45 min (identify sections, extract, test)
- **TransferModal**: ~45 min (Send/Receive tabs are clear split points)
- **Map.tsx**: ~30 min (identify helper extraction)
- **MultiRoutePanel**: ~20 min (small 4-line over target)
- **useMapInit.ts**: ~20 min (7 lines over, may be simpler than others)

**Total**: ~3 hours for full Phase 6 completion
