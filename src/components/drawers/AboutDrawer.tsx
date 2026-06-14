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
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>v3.3.8</span>
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
        </div>
      </div>
    </div>
  );
}
