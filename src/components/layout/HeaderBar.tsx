import type { ThemeMode } from '../../types';

interface HeaderBarProps {
  panelsCollapsed: boolean;
  handlePanelToggle: () => void;
  openMiniWindow: () => Promise<void>;
  setMiniOverlayOpen: (open: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resetView: () => void;
  setHelpOpen: (open: boolean) => void;
  setSupportOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  measureMode: boolean;
  setMeasureMode: (mode: boolean) => void;
  setManualMeasure: (measure: any[]) => void;
  setDrawerOpen: (open: boolean) => void;
  setTransferOpen: (open: boolean) => void;
}

export function HeaderBar(props: HeaderBarProps) {
  return (
    <header className="header">
      <div className="brand">
        <svg className="brand-logo" viewBox="0 0 32 32" fill="none" aria-label="לוגו">
          <path d="M4 24 L12 8 L16 16 L20 12 L28 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx="16" cy="20" r="2" fill="currentColor" />
        </svg>
        <div>
          <div className="brand-title">מרחב דרום לבנון — מפת מצב</div>
          <div className="brand-sub">פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</div>
        </div>
      </div>
      <div className="header-actions">
        <button
          className="btn menu-toggle"
          onClick={props.handlePanelToggle}
          aria-pressed={props.panelsCollapsed}
          data-testid="button-toggle-menu"
        >
          {props.panelsCollapsed ? 'פתח תפריט' : 'סגור תפריט'}
        </button>
        <button className="btn" onClick={() => props.openMiniWindow().catch(() => props.setMiniOverlayOpen(true))} data-testid="button-mini-window">
          חלון מוקטן
        </button>
        <div className="theme-switch" role="group" aria-label="מצב בהירות" data-testid="theme-switch">
          {([
            ['dark', 'כהה'],
            ['light', 'בהיר'],
            ['auto', 'אוטומטי'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              className="theme-btn"
              aria-pressed={props.themeMode === mode}
              onClick={() => props.setThemeMode(mode)}
              data-testid={`button-theme-${mode}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="btn ghost"
          onClick={props.resetView}
          data-testid="button-reset-view"
          title="איפוס שכבות, בהירות, מצפן ומיקוד המפה"
        >
          איפוס תצוגה
        </button>
        <a
          className="btn portfolio-link"
          href="https://portfolio-dusky-eight-77.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-portfolio"
        >
          הפורטפוליו שלי
        </a>
        <button className="btn" onClick={() => { props.setHelpOpen(true); props.setSupportOpen(false); props.setAboutOpen(false); }} data-testid="button-help">
          עזרה והדרכה
        </button>
        <button className="btn" onClick={() => { props.setSupportOpen(true); props.setHelpOpen(false); props.setAboutOpen(false); }} data-testid="button-support">
          תמיכה בפיתוח
        </button>
        <button className="btn" onClick={() => { props.setAboutOpen(true); props.setHelpOpen(false); props.setSupportOpen(false); }} data-testid="button-about">
          About
        </button>
        <button
          className="btn"
          onClick={() => {
            props.setMeasureMode(!props.measureMode);
            props.setManualMeasure([]);
          }}
          aria-pressed={props.measureMode}
          data-testid="button-measure"
        >
          {props.measureMode ? 'יציאה ממצב מדידה' : 'מדידה ידנית'}
        </button>
        <button className="btn ghost" onClick={() => props.setDrawerOpen(true)} data-testid="button-sources">
          מקורות ועל אודות
        </button>
        <button className="btn" onClick={() => props.setTransferOpen(true)} data-testid="button-transfer">
          העברת מרשמים
        </button>
      </div>
    </header>
  );
}
