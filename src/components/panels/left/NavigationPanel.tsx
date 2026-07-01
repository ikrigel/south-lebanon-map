import type { RouteDisplayMode, SavedRoute, TurnInstruction, RouteOption, VoiceLanguage, VoiceGuidanceMode } from '../../../types';
import { NAV_SCALES, DEFAULT_NAV_SCALE_LABEL } from '../../../constants';
import { fmtKm } from '../../../util';
import { VoiceGuidanceBox } from './VoiceGuidanceBox';
import { RouteActions } from './RouteActions';
import { RoutePickerForm } from './RoutePickerForm';

interface NavigationPanelProps {
  navStartId: string;
  setNavStartId: (id: string) => void;
  navEndId: string;
  setNavEndId: (id: string) => void;
  navStartQuery: string;
  setNavStartQuery: (q: string) => void;
  navEndQuery: string;
  setNavEndQuery: (q: string) => void;
  navStart: any;
  navEnd: any;
  startMatches: any[];
  endMatches: any[];
  liveLocation: any;
  locationStatus: 'idle' | 'watching' | 'error';
  watchId: number | null;
  navigationRoute: any;
  routeOptions: RouteOption[];
  routeDisplayMode: RouteDisplayMode;
  setRouteDisplayMode: (mode: RouteDisplayMode) => void;
  routeName: string;
  setRouteName: (name: string) => void;
  savedRoutes: SavedRoute[];
  setSavedRoutes: (routes: SavedRoute[]) => void;
  navScaleLabel: string;
  setNavScaleLabel: (label: string) => void;
  activeRouteId: 'drive' | 'foot' | 'aerial';
  setActiveRouteId: (id: 'drive' | 'foot' | 'aerial') => void;
  roadRoute: any;
  footRoute: any;
  navCustomStart: any;
  setNavCustomStart: (start: any) => void;
  navCustomEnd: any;
  setNavCustomEnd: (end: any) => void;
  voiceGuidance: VoiceGuidanceMode;
  setVoiceGuidance: (mode: VoiceGuidanceMode) => void;
  setVoiceMode: (mode: VoiceGuidanceMode) => void;
  voiceLanguage: VoiceLanguage;
  setVoiceLanguage: (lang: VoiceLanguage) => void;
  voiceStatus: 'idle' | 'speaking' | 'unsupported';
  currentTurnInstruction: TurnInstruction | null;
  navPoints: any[];
  startRouteNavigation: (route: SavedRoute) => void;
  showToast: (msg: string) => void;
  beginLiveLocationWatch: () => void;
  toggleLiveLocation: () => void;
  loadSavedRoute: (route: SavedRoute) => void;
  saveCurrentRoute: () => void;
  importRoutes: (file: File | undefined) => Promise<void>;
  downloadJson: (name: string, data: any) => void;
  openExternalNav: (lat: number, lon: number, label: string, startLat?: number, startLon?: number) => void;
  testVoiceGuidance: () => void;
  setFocusTarget: (target: any) => void;
  liveToastShownRef: React.MutableRefObject<boolean>;
  setLiveFollowDetached: (detached: boolean) => void;
}

export function NavigationPanel(props: NavigationPanelProps) {
  return (
    <div className="panel-section" id="nav-section">
      <h3>ניווט כבישים נקודה לנקודה</h3>
      <RoutePickerForm
        navStartQuery={props.navStartQuery}
        setNavStartQuery={props.setNavStartQuery}
        navStart={props.navStart}
        navStartId={props.navStartId}
        setNavStartId={props.setNavStartId}
        startMatches={props.startMatches}
        locationStatus={props.locationStatus}
        liveLocation={props.liveLocation}
        watchId={props.watchId}
        beginLiveLocationWatch={props.beginLiveLocationWatch}
        setLiveFollowDetached={props.setLiveFollowDetached}
        liveToastShownRef={props.liveToastShownRef}
        showToast={props.showToast}
        navEndQuery={props.navEndQuery}
        setNavEndQuery={props.setNavEndQuery}
        navEnd={props.navEnd}
        navEndId={props.navEndId}
        setNavEndId={props.setNavEndId}
        endMatches={props.endMatches}
        navPoints={props.navPoints}
        navigationRoute={props.navigationRoute}
        setFocusTarget={props.setFocusTarget}
        toggleLiveLocation={props.toggleLiveLocation}
        navScaleLabel={props.navScaleLabel}
        setNavScaleLabel={props.setNavScaleLabel}
        setNavCustomStart={props.setNavCustomStart}
        setNavCustomEnd={props.setNavCustomEnd}
        routeDisplayMode={props.routeDisplayMode}
        setRouteDisplayMode={props.setRouteDisplayMode}
        routeOptions={props.routeOptions}
        activeRouteId={props.activeRouteId}
        setActiveRouteId={props.setActiveRouteId}
        openExternalNav={props.openExternalNav}
      />
      <VoiceGuidanceBox
        voiceStatus={props.voiceStatus}
        voiceLanguage={props.voiceLanguage}
        setVoiceLanguage={props.setVoiceLanguage}
        voiceGuidance={props.voiceGuidance}
        setVoiceMode={props.setVoiceMode}
        testVoiceGuidance={props.testVoiceGuidance}
        currentTurnInstruction={props.currentTurnInstruction}
      />
      <RouteActions
        navigationRoute={props.navigationRoute}
        routeName={props.routeName}
        setRouteName={props.setRouteName}
        navStartId={props.navStartId}
        navEndId={props.navEndId}
        savedRoutes={props.savedRoutes}
        setSavedRoutes={props.setSavedRoutes}
        saveCurrentRoute={props.saveCurrentRoute}
        downloadJson={props.downloadJson}
        importRoutes={props.importRoutes}
        loadSavedRoute={props.loadSavedRoute}
        startRouteNavigation={props.startRouteNavigation}
        showToast={props.showToast}
      />
    </div>
  );
}
