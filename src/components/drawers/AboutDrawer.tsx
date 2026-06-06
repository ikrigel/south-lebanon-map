import React from 'react';

export const AboutDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  donationCopied: boolean;
  onShare: () => void;
  onCopyDonation: () => void;
  onDonation: () => void;
}> = ({ isOpen, onClose, donationCopied, onShare, onCopyDonation, onDonation }) => {
  if (!isOpen) return null;

  return (
    <div className="drawer" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel about-panel" onClick={e => e.stopPropagation()} data-testid="drawer-about">
        <div className="drawer-head">
          <h2>About</h2>
          <button className="btn ghost" onClick={onClose} data-testid="button-close-about">סגירה</button>
        </div>
        <div className="drawer-body">
          <section className="about-card" data-testid="card-about">
            <p className="about-kicker">קרדיט פיתוח</p>
            <h3>פותח ע״י יגאל קריגל - קה״ד גדס״מ 5679 - גדוד סיור מיוחד</h3>
            <p>
              האפליקציה נבנתה כמפת מצב אינטראקטיבית וחינוכית למרחב דרום לבנון עד נהר הליטני,
              עם שכבות מידע, חיפוש, ניווט כבישים, מצפן, מיני־ניווט, הנחיות קוליות בעברית ובאנגלית,
              הוראות פנייה לפי המסלול, הקלטת מסלולים, נקודות עניין ושיתוף קבצים מקומי.
            </p>
            <div className="about-meta">
              <span>React + Leaflet</span>
              <span>RTL Hebrew UI</span>
              <span>Local-first privacy</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>v2.0.0</span>
            </div>
            <div className="support-actions">
              <a
                className="btn primary"
                href="https://portfolio-dusky-eight-77.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-about-portfolio"
              >
                פורטפוליו
              </a>
              <button className="btn" onClick={onShare} data-testid="button-about-share">
                שתף את האפליקציה
              </button>
              <button className="btn ghost" onClick={onDonation} data-testid="button-about-donate">
                תרומה ב־Bit
              </button>
              <button className="btn ghost" onClick={onCopyDonation} data-testid="button-about-copy-donation">
                {donationCopied ? 'הקישור הועתק' : 'העתק קישור'}
              </button>
            </div>
          </section>
          <h4>הצהרת שימוש</h4>
          <p>
            המפה מיועדת להמחשה וללמידה בלבד. המיקומים מקורבים, הנתונים מבוססי מקורות פתוחים,
            ואין באפליקציה נתוני מודיעין מבצעי, מטרות, מצבורים או נקודות שיגור.
          </p>
        </div>
      </div>
    </div>
  );
};
