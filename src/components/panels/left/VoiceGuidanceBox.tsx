import type { VoiceGuidanceMode, VoiceLanguage, TurnInstruction } from '../../../types';

interface VoiceGuidanceBoxProps {
  voiceStatus: 'idle' | 'speaking' | 'unsupported';
  voiceLanguage: VoiceLanguage;
  setVoiceLanguage: (lang: VoiceLanguage) => void;
  voiceGuidance: VoiceGuidanceMode;
  setVoiceMode: (mode: string) => void;
  testVoiceGuidance: () => void;
  currentTurnInstruction: TurnInstruction | null;
}

export function VoiceGuidanceBox(props: VoiceGuidanceBoxProps) {
  return (
    <div className="voice-guidance-box" data-testid="voice-guidance-box">
      <div className="voice-guidance-head">
        <strong>הנחיות קוליות</strong>
        <span data-testid="text-voice-status">
          {props.voiceStatus === 'speaking' ? 'משמיע כעת' : props.voiceStatus === 'unsupported' ? 'לא נתמך בדפדפן' : 'מוכן'}
        </span>
      </div>
      <div className="voice-language-grid" role="group" aria-label="בחירת שפת הנחיות קוליות">
        {([['he', 'עברית', 'בדיקה והנחיות בעברית.'], ['en', 'English', 'Test and guidance in English.']] as const).map(([lang, label, desc]) => (
          <button
            key={lang}
            className="voice-language-btn"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              props.setVoiceLanguage(lang);
            }}
            aria-pressed={props.voiceLanguage === lang}
            data-testid={`button-voice-lang-${lang}`}
          >
            <span>{label}</span>
            <small>{desc}</small>
          </button>
        ))}
      </div>
      <div className="voice-mode-grid" role="group" aria-label="בחירת מצב הנחיות קוליות">
        {([['off', 'ללא קול', 'לא יושמעו הנחיות.'], ['basic', 'בסיסיות', 'הכרזת מסלול ועדכוני מרחק מעטים.'], ['detailed', 'מפורטות', 'מסלול, זמן, מרחק, כיוון ודיוק מיקום.']] as const).map(([mode, label, desc]) => (
          <button
            key={mode}
            className="voice-mode-btn"
            onClick={() => props.setVoiceMode(mode)}
            aria-pressed={props.voiceGuidance === mode}
            data-testid={`button-voice-${mode}`}
          >
            <span>{label}</span>
            <small>{desc}</small>
          </button>
        ))}
      </div>
      <div className="route-actions">
        <button className="btn ghost" disabled={props.voiceGuidance === 'off'} onClick={props.testVoiceGuidance} data-testid="button-voice-test">
          בדיקת קול
        </button>
      </div>
      <div className="turn-instruction-card" data-testid="turn-instruction-card">
        <span>הוראת פנייה במסלול</span>
        <strong data-testid="text-turn-instruction">{props.currentTurnInstruction?.text ?? 'בחר מסלול כדי לקבל הוראת פנייה.'}</strong>
        <small>
          {props.currentTurnInstruction
            ? props.currentTurnInstruction.confidence === 'route'
              ? 'מבוסס על הוראות OSRM כאשר זמינות, או על מסלול מיובא/שמור.'
              : 'אומדן לפי קו מוצא ויעד בלבד, ללא פירוט פניות כביש.'
            : 'ההוראה תתעדכן כאשר ייבחר מסלול פעיל.'}
        </small>
      </div>
    </div>
  );
}
