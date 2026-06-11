interface SupportDrawerProps {
  open: boolean;
  onClose: () => void;
  donationCopied: boolean;
  onOpenDonation: () => void;
  onCopyDonation: () => Promise<void>;
  onShareApp: () => Promise<void>;
  donationContactUrl: string;
}

export function SupportDrawer(props: SupportDrawerProps) {
  if (!props.open) return null;

  return (
    <div className="drawer" onClick={props.onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel support-panel" onClick={e => e.stopPropagation()} data-testid="drawer-support">
        <div className="drawer-head">
          <h2>תמיכה בהמשך הפיתוח</h2>
          <button className="btn ghost" onClick={props.onClose} data-testid="button-close-support">סגירה</button>
        </div>
        <div className="drawer-body">
          <div className="support-card">
            <h4>למה לתמוך?</h4>
            <p>
              התמיכה מסייעת להמשיך לפתח את האפליקציה: שיפור שכבות המפה, הוספת יכולות ניווט, בדיקות אבטחה, תיעוד בעברית, ותחזוקת הפריסה.
            </p>
            <div className="support-actions">
              <button className="btn primary" onClick={props.onOpenDonation} data-testid="button-open-donation">
                תרומה ב־Bit
              </button>
              <button className="btn ghost" onClick={() => props.onCopyDonation().catch(() => undefined)} data-testid="button-copy-donation">
                {props.donationCopied ? 'הקישור הועתק' : 'העתק קישור Bit'}
              </button>
              <button className="btn" onClick={() => props.onShareApp().catch(() => undefined)} data-testid="button-share-app">
                שתף את האפליקציה
              </button>
              <a className="btn ghost" href="https://portfolio-dusky-eight-77.vercel.app/" target="_blank" rel="noopener noreferrer" data-testid="link-support-portfolio">
                מעבר לפורטפוליו
              </a>
            </div>
            <a className="copyable-link" href={props.donationContactUrl} target="_blank" rel="noopener noreferrer" data-testid="link-donate-contact">
              {props.donationContactUrl}
            </a>
            <p className="legend-note">
              התרומה מתבצעת דרך Bit בקישור חיצוני מאובטח. האפליקציה אינה שומרת פרטי תשלום ואינה מעבדת תשלומים בעצמה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
