import { useCallback, useEffect, useRef } from 'react';
import type { VoiceGuidanceMode, VoiceLanguage } from '../types';
import { pickSpeechVoice } from '../storage/storage';
import { haversineKm, fmtKm } from '../util';

export const useVoiceGuidance = ({
  voiceGuidance,
  voiceLanguage,
  navigationRoute,
  routeStatus,
  currentTurnInstruction,
  navPosition,
  mapBearing,
  liveLocation,
  setVoiceGuidance,
  setVoiceStatus,
}: {
  voiceGuidance: VoiceGuidanceMode;
  voiceLanguage: VoiceLanguage;
  navigationRoute: any;
  routeStatus: 'idle' | 'loading' | 'ready' | 'error';
  currentTurnInstruction: any;
  navPosition: any;
  mapBearing: number;
  liveLocation: any;
  setVoiceGuidance: (mode: VoiceGuidanceMode) => void;
  setVoiceStatus: (status: 'idle' | 'speaking' | 'unsupported') => void;
}) => {
  const lastVoiceRouteRef = useRef<string>('');
  const lastVoiceProgressRef = useRef<{ at: number; bucket: number }>({ at: 0, bucket: -1 });
  const lastTurnVoiceRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });

  const speakGuidance = useCallback((message: string, interrupt = true) => {
    if (voiceGuidance === 'off') return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setVoiceStatus('unsupported');
      return;
    }
    if (interrupt) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
    const voice = pickSpeechVoice(voiceLanguage);
    if (voice) utterance.voice = voice;
    utterance.rate = voiceGuidance === 'detailed' ? 0.92 : 0.98;
    utterance.pitch = 1;
    utterance.onstart = () => setVoiceStatus('speaking');
    utterance.onend = () => setVoiceStatus('idle');
    utterance.onerror = () => setVoiceStatus('idle');
    window.speechSynthesis.speak(utterance);
  }, [voiceGuidance, voiceLanguage, setVoiceStatus]);

  const setVoiceMode = useCallback((mode: VoiceGuidanceMode) => {
    if (mode === 'off' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceGuidance(mode);
    setVoiceStatus('idle');
    if (mode === 'basic') {
      window.setTimeout(() => {
        if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(
            voiceLanguage === 'he' ? 'הנחיות קוליות בסיסיות הופעלו' : 'Basic voice guidance is enabled'
          );
          utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
          const voice = pickSpeechVoice(voiceLanguage);
          if (voice) utterance.voice = voice;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }, 0);
    }
    if (mode === 'detailed') {
      window.setTimeout(() => {
        if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
          const utterance = new SpeechSynthesisUtterance(
            voiceLanguage === 'he'
              ? 'הנחיות קוליות מפורטות הופעלו. אכריז על מסלול, מרחק, זמן משוער, הוראות פנייה ועדכוני התקדמות'
              : 'Detailed voice guidance is enabled. I will announce the route, distance, estimated time, turn prompts and progress updates'
          );
          utterance.lang = voiceLanguage === 'he' ? 'he-IL' : 'en-US';
          const voice = pickSpeechVoice(voiceLanguage);
          if (voice) utterance.voice = voice;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }, 0);
    }
  }, [voiceLanguage, setVoiceGuidance, setVoiceStatus]);

  const testVoiceGuidance = useCallback(() => {
    if (voiceGuidance === 'off') return;
    speakGuidance(
      voiceLanguage === 'he'
        ? voiceGuidance === 'basic'
          ? 'בדיקת קול. הנחיות בסיסיות בעברית פעילות.'
          : 'בדיקת קול. הנחיות מפורטות בעברית פעילות. בזמן ניווט יושמעו עדכוני מסלול, מרחק, זמן, כיוון התקדמות והוראות פנייה מהמסלול.'
        : voiceGuidance === 'basic'
          ? 'Voice test. Basic guidance in English is active.'
          : 'Voice test. Detailed guidance in English is active. During navigation, route updates, distance, time, heading and route turn prompts will be spoken.'
    );
  }, [voiceGuidance, voiceLanguage, speakGuidance]);

  // Route ready announcement
  useEffect(() => {
    if (voiceGuidance === 'off') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setVoiceStatus('idle');
      return;
    }
    if (!navigationRoute || routeStatus === 'loading') return;
    const routeKey = `${navigationRoute.start.label}|${navigationRoute.end.label}|${navigationRoute.km.toFixed(2)}|${routeStatus}`;
    if (lastVoiceRouteRef.current === routeKey) return;
    lastVoiceRouteRef.current = routeKey;
    const timeText = voiceLanguage === 'he'
      ? navigationRoute.durationMin ? ` זמן נסיעה משוער ${Math.round(navigationRoute.durationMin)} דקות.` : ''
      : navigationRoute.durationMin ? ` Estimated drive time is ${Math.round(navigationRoute.durationMin)} minutes.` : '';
    const fallbackText = voiceLanguage === 'he'
      ? routeStatus === 'error' ? ' לא נמצא מסלול כבישים, מוצג מרחק אווירי משוער.' : ''
      : routeStatus === 'error' ? ' No road route was found. An estimated straight-line distance is shown.' : '';
    const turnText = currentTurnInstruction
      ? voiceLanguage === 'he'
        ? ` הוראת הפנייה הקרובה: ${currentTurnInstruction.text}.`
        : ` Next route turn prompt: ${currentTurnInstruction.textEn}.`
      : '';
    const message = voiceLanguage === 'he'
      ? voiceGuidance === 'basic'
        ? `המסלול מוכן. המרחק ${fmtKm(navigationRoute.km)}.${fallbackText}`
        : `המסלול מוכן מ${navigationRoute.start.label} אל ${navigationRoute.end.label}. המרחק ${fmtKm(navigationRoute.km)}.${timeText}${fallbackText}${turnText} לחץ על מיקום חי כדי לקבל עדכונים תוך כדי תנועה.`
      : voiceGuidance === 'basic'
        ? `The route is ready. The distance is ${fmtKm(navigationRoute.km)}.${fallbackText}`
        : `The route from ${navigationRoute.start.label} to ${navigationRoute.end.label} is ready. The distance is ${fmtKm(navigationRoute.km)}.${timeText}${fallbackText}${turnText} Turn on live location for updates while moving.`;
    speakGuidance(message);
  }, [voiceGuidance, voiceLanguage, navigationRoute, routeStatus, currentTurnInstruction, speakGuidance, setVoiceStatus]);

  // Progress updates
  useEffect(() => {
    if (voiceGuidance === 'off' || !navigationRoute || !navPosition) return;
    const remainingKm = haversineKm([navPosition.lat, navPosition.lon], [navigationRoute.end.lat, navigationRoute.end.lon]);
    const bucket = voiceGuidance === 'basic'
      ? Math.max(0, Math.floor(remainingKm))
      : Math.max(0, Math.floor(remainingKm * 2) / 2);
    const now = Date.now();
    const minGap = voiceGuidance === 'basic' ? 60_000 : 30_000;
    if (lastVoiceProgressRef.current.bucket === bucket && now - lastVoiceProgressRef.current.at < minGap) return;
    if (now - lastVoiceProgressRef.current.at < minGap) return;
    lastVoiceProgressRef.current = { at: now, bucket };
    if (remainingKm < 0.15) {
      speakGuidance(voiceLanguage === 'he' ? 'הגעת לקרבת היעד.' : 'You are near your destination.');
      return;
    }
    const headingText = Number.isFinite(mapBearing)
      ? voiceLanguage === 'he'
        ? ` כיוון התקדמות משוער ${Math.round(mapBearing)} מעלות.`
        : ` Estimated heading is ${Math.round(mapBearing)} degrees.`
      : '';
    const turnText = voiceGuidance === 'detailed' && currentTurnInstruction
      ? voiceLanguage === 'he' ? ` ${currentTurnInstruction.text}.` : ` ${currentTurnInstruction.textEn}.`
      : '';
    const message = voiceLanguage === 'he'
      ? voiceGuidance === 'basic'
        ? `נותרו כ${fmtKm(remainingKm)} עד היעד.`
        : `עדכון ניווט. נותרו כ${fmtKm(remainingKm)} עד ${navigationRoute.end.label}.${headingText}${turnText} דיוק מיקום משוער ${Math.round(liveLocation?.accuracy ?? 0)} מטר.`
      : voiceGuidance === 'basic'
        ? `About ${fmtKm(remainingKm)} remaining to the destination.`
        : `Navigation update. About ${fmtKm(remainingKm)} remaining to ${navigationRoute.end.label}.${headingText}${turnText} Estimated location accuracy is ${Math.round(liveLocation?.accuracy ?? 0)} meters.`;
    speakGuidance(message, false);
  }, [voiceGuidance, voiceLanguage, navigationRoute, navPosition, mapBearing, currentTurnInstruction, liveLocation, speakGuidance]);

  // Turn instruction announcements
  useEffect(() => {
    if (voiceGuidance === 'off' || !navigationRoute || !currentTurnInstruction) return;
    if (voiceGuidance === 'basic' && currentTurnInstruction.action === 'straight') return;
    const key = `${currentTurnInstruction.action}-${Math.round(currentTurnInstruction.distanceM / 50)}-${Math.round(currentTurnInstruction.bearing / 10)}`;
    const now = Date.now();
    if (lastTurnVoiceRef.current.key === key) return;
    if (now - lastTurnVoiceRef.current.at < 20_000) return;
    lastTurnVoiceRef.current = { key, at: now };
    speakGuidance(voiceLanguage === 'he' ? currentTurnInstruction.text : currentTurnInstruction.textEn, false);
  }, [voiceGuidance, voiceLanguage, navigationRoute, currentTurnInstruction, speakGuidance]);

  return {
    speakGuidance,
    setVoiceMode,
    testVoiceGuidance,
  };
};
