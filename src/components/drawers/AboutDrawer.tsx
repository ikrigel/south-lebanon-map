interface AboutDrawerProps {
  open: boolean;
  onClose: () => void;
  donationCopied: boolean;
  onOpenDonation: () => void;
  onCopyDonation: () => Promise<void>;
  onShareApp: () => Promise<void>;
}

export function AboutDrawer(props: AboutDrawerProps) {
  if (!props.open) return null;

  return (
    <div className="drawer" onClick={props.onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel about-panel" onClick={e => e.stopPropagation()} data-testid="drawer-about">
        <div className="drawer-head">
          <h2>About</h2>
          <button className="btn ghost" onClick={props.onClose} data-testid="button-close-about">סגירה</button>
        </div>
        <div className="drawer-body">
          <section className="about-card" data-testid="card-about">
            <p className="about-kicker">קרדיט פיתוח</p>
            <h3>פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</h3>
            <p>
              האפליקציה נבנתה כמפת מצב אינטראקטיבית וחינוכית למרחב דרום לבנון עד נהר הליטני, עם שכבות מידע, חיפוש, ניווט כבישים, מצפן, מיני־ניווט, הנחיות קוליות בעברית ובאנגלית,
              הוראות פנייה לפי המסלול, הקלטת מסלולים, נקודות עניין ושיתוף קבצים מקומי.
            </p>
            <div className="about-meta">
              <span>React + Leaflet</span>
              <span>RTL Hebrew UI</span>
              <span>Local-first privacy</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>v4.7.5</span>
            </div>
            <div className="support-actions">
              <a className="btn primary" href="https://portfolio-dusky-eight-77.vercel.app/" target="_blank" rel="noopener noreferrer" data-testid="link-about-portfolio">
                פורטפוליו
              </a>
              <button className="btn" onClick={() => props.onShareApp().catch(() => undefined)} data-testid="button-about-share">
                שתף את האפליקציה
              </button>
              <button className="btn ghost" onClick={props.onOpenDonation} data-testid="button-about-donate">
                תרומה ב־Bit
              </button>
              <button className="btn ghost" onClick={() => props.onCopyDonation().catch(() => undefined)} data-testid="button-about-copy-donation">
                {props.donationCopied ? 'הקישור הועתק' : 'העתק קישור'}
              </button>
            </div>
          </section>
          <h4>הצהרת שימוש</h4>
          <p>
            המפה מיועדת להמחשה וללמידה בלבד. המיקומים מקורבים, הנתונים מבוססי מקורות פתוחים, ואין באפליקציה נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
          </p>

          <h4>שכבת התקפות כלים</h4>
          <p>
            שכבת התקפות החזבאללה מוצגת לצורכי מחקר היסטורי ו־OSINT (Open Source Intelligence). הנתונים אָמתוּ דרך מקורות ציבוריים מרובים:
          </p>
          <ul style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
            <li><strong>IDF Spokesperson</strong> — דוחות רשמיים על אירועי ביטחון (idf.il)</li>
            <li><strong>Bellingcat</strong> — אמת מידע OSINT עצמאי וביקורת מקורות</li>
            <li><strong>ISW (Institute for the Study of War)</strong> — ניתוח מודיעיני יומי</li>
            <li><strong>Media outlets</strong> — Haaretz, Reuters, BBC, Al Jazeera, Middle East Eye</li>
            <li><strong>Local sources</strong> — Ynet, Kan, Walla (ישראל); Al Mayadeen, Al Arabiya (מזרח תיכון)</li>
          </ul>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>סטטוסים:</strong><br/>
            🔴 <strong>מאומת</strong> — אושר על ידי לפחות 2 מקורות עצמאיים<br/>
            🟠 <strong>טוען</strong> — דיווח מצד אחד בלבד<br/>
            🟡 <strong>מעורער</strong> — מקורות סותרים (ישראל טוענת חסימה, חזבאללה טוענת היטל)
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong>הערה:</strong> קואורדינטות משוערות (±500 מטרים מהנקודה המדויקת). התקפות מטרח כללי (צבאי או אזרחי) — לא נקודות שיגור או עמדות הגנה מדויקות.
          </p>

          <h4>מקורות נוספים</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
            <a href="https://www.understandingwar.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Institute for the Study of War (ISW)</a> —
            <a href="https://www.bellingcat.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', marginLeft: '8px' }}>Bellingcat</a> —
            <a href="https://www.idf.il/en/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', marginLeft: '8px' }}>IDF Official</a>
          </p>
        </div>
      </div>
    </div>
  );
}
