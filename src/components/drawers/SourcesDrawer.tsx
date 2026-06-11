interface SourcesDrawerProps {
  open: boolean;
  onClose: () => void;
  sources: Array<{ url: string; title_he: string; category: string }>;
}

export function SourcesDrawer(props: SourcesDrawerProps) {
  if (!props.open) return null;

  return (
    <div className="drawer" onClick={props.onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel" onClick={e => e.stopPropagation()} data-testid="drawer-sources">
        <div className="drawer-head">
          <h2>על אודות ומקורות</h2>
          <button className="btn ghost" onClick={props.onClose} data-testid="button-close-drawer">
            סגירה
          </button>
        </div>
        <div className="drawer-body">
          <h4>על אודות</h4>
          <p>
            מפה אינטראקטיבית לחקר המרחב הדרום־לבנוני, מהקו הכחול בדרום ועד נהר הליטני בצפון — האזור המוגדר בהחלטת מועצת
            הביטחון 1701 כאזור פעולת יוניפי״ל וצבא לבנון בלבד. האפליקציה נועדה להמחיש את האתגרים הלוגיסטיים והביטחוניים של
            רעיון אזור החיץ: צפיפות יישובים אזרחיים, פריסת כוחות בינלאומיים, אזורי השפעה היסטוריים של חזבאללה, פיזור אירועים
            ביטחוניים בשנים האחרונות, וכלי עזר מקומיים לניווט, מדידה, הקלטה, חלון מיני, הנחיות קוליות והוראות פנייה לפי
            המסלול. כל הנתונים נשאבים מדיווח פומבי בלבד (תקשורת, מסמכי או״ם, מאגרים אקדמיים), המיקומים מקורבים, וההדמיה
            אינה מהווה מודיעין מבצעי או נתוני מטרות.
          </p>
          <p>
            נבנה כחלק מפורטפוליו הפרויקטים של יוצר האפליקציה:{' '}
            <a href="https://portfolio-dusky-eight-77.vercel.app/" target="_blank" rel="noopener noreferrer" data-testid="link-portfolio-about">
              portfolio-dusky-eight-77.vercel.app
            </a>
          </p>

          <h4>או״ם וגופים בינלאומיים</h4>
          {props.sources
            .filter(s => s.category === 'un')
            .map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener" data-testid={`source-${s.url}`}>
                {s.title_he} ↗
              </a>
            ))}

          <h4>תקשורת</h4>
          {props.sources
            .filter(s => s.category === 'media')
            .map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener">
                {s.title_he} ↗
              </a>
            ))}

          <h4>בסיסי נתונים אקדמיים / מחקריים</h4>
          {props.sources
            .filter(s => s.category === 'data')
            .map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener">
                {s.title_he} ↗
              </a>
            ))}

          <h4>מפות בסיס</h4>
          {props.sources
            .filter(s => s.category === 'osm')
            .map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener">
                {s.title_he} ↗
              </a>
            ))}

          <h4>הצהרת שימוש</h4>
          <p>
            ההדמיה היא חינוכית בלבד. המיקומים מוצגים מקורבים. שכבת חזבאללה היא איכותית ומבוססת דיווחים פתוחים בלבד — אין
            במידע נתוני מטרות, מבני נשק, מנהרות, מצבורים או נקודות שיגור. המידע אינו מהווה מודיעין, אינו תחליף לגורם רשמי,
            ואין לעשות בו שימוש מבצעי. הדמיית הקו הכחול וקו הליטני מקורבת לצורכי ויזואליזציה ואינה גבול סקור גיאודטית.
          </p>
        </div>
      </div>
    </div>
  );
}
