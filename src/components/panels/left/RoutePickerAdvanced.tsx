interface RoutePickerAdvancedProps {
  navStartId: string;
  setNavStartId: (id: string) => void;
  navEndId: string;
  setNavEndId: (id: string) => void;
  navPoints: any[];
}

export function RoutePickerAdvanced(props: RoutePickerAdvancedProps) {
  return (
    <details className="route-advanced">
      <summary>בחירה מרשימה מלאה</summary>
      <label>
        <span>נקודת מוצא</span>
        <select value={props.navStartId} onChange={e => props.setNavStartId(e.target.value)} data-testid="select-route-start">
          <option value="">בחר נקודת מוצא…</option>
          {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
            <optgroup key={group} label={group}>
              {props.navPoints.filter(p => p.group === group).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label>
        <span>יעד</span>
        <select value={props.navEndId} onChange={e => props.setNavEndId(e.target.value)} data-testid="select-route-end">
          <option value="">בחר יעד…</option>
          {['נקודות עניין אישיות', 'יישובים בלבנון', 'יישובי ייחוס בישראל', 'רכסים, הרים, נחלים ונהרות', 'נקודות יוניפי״ל ציבוריות', 'אירועים מדווחים'].map(group => (
            <optgroup key={group} label={group}>
              {props.navPoints.filter(p => p.group === group).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </details>
  );
}
