import type { HeaderVisibilityMode } from '../types';

interface HeaderVisibilityToggleProps {
  mode: HeaderVisibilityMode;
  visible: boolean;
  onChange: (mode: HeaderVisibilityMode) => void;
  onToggleVisibility: () => void;
}

export function HeaderVisibilityToggle(props: HeaderVisibilityToggleProps) {
  return (
    <div className="header-visibility-controls" title="Header visibility mode">
      <select
        value={props.mode}
        onChange={(e) => props.onChange(e.target.value as HeaderVisibilityMode)}
        className="btn ghost"
        style={{ padding: '4px 8px', fontSize: '12px' }}
      >
        <option value="fix">תמיד קיים (Fix)</option>
        <option value="manual">ידני (Manual)</option>
        <option value="auto">אוטומטי (Auto)</option>
      </select>

      {props.mode === 'manual' && (
        <button
          onClick={props.onToggleVisibility}
          className="btn ghost"
          title={props.visible ? 'Hide header' : 'Show header'}
          style={{ padding: '4px 8px', fontSize: '12px', marginLeft: '4px' }}
        >
          {props.visible ? '👁 הסתר' : '👁‍🗨 הצג'}
        </button>
      )}
    </div>
  );
}
