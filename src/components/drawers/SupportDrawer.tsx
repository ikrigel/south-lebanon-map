import React from 'react';
import { DONATION_CONTACT_URL } from '../../constants';

export const SupportDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  donationCopied: boolean;
  onDonation: () => void;
  onCopyDonation: () => void;
  onShare: () => void;
}> = ({ isOpen, onClose, donationCopied, onDonation, onCopyDonation, onShare }) => {
  if (!isOpen) return null;

  return (
    <div className="drawer" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel support-panel" onClick={e => e.stopPropagation()} data-testid="drawer-support">
        <div className="drawer-head">
          <h2>תמיכה בהמשך הפיתוח</h2>
          <button className="btn ghost" onClick={onClose} data-testid="button-close-support">סגירה</button>
        </div>
        <div className="drawer-body">
          <div className="support-card">
            <h4>למה לתמוך?</h4>
            <p>
              התמיכה מסייעת להמשיך לפתח את האפליקציה: שיפור שכבות המפה, הוספת יכולות ניווט, בדיקות אבטחה, תיעוד בעברית, ותחזוקת הפריסה.
            </p>
            <div className="support-actions">
              <button className="btn primary" onClick={onDonation} data-testid="button-open-donation">
                תרומה ב־Bit
              </button>
              <button className="btn ghost" onClick={onCopyDonation} data-testid="button-copy-donation">
                {donationCopied ? 'הקישור הועתק' : 'העתק קישור Bit'}
              </button>
              <button className="btn" onClick={onShare} data-testid="button-share-app">
                שתף את האפליקציה
              </button>
              <a
                className="btn ghost"
                href="https://portfolio-dusky-eight-77.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-support-portfolio"
              >
                מעבר לפורטפוליו
              </a>
            </div>
            <a
              className="copyable-link"
              href={DONATION_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-donate-contact"
            >
              {DONATION_CONTACT_URL}
            </a>
            <p className="legend-note">
              התרומה מתבצעת דרך Bit בקישור חיצוני מאובטח. האפליקציה אינה שומרת פרטי תשלום ואינה מעבדת תשלומים בעצמה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
