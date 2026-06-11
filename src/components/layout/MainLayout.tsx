import { LeftPanel } from './LeftPanel';
import { MapOverlays } from '../layout/MapOverlays';
import { AnalyticsPanel } from '../panels/AnalyticsPanel';
import { ResumeNavDialog } from '../modals/ResumeNavDialog';
import { MiniOverlay } from '../modals/MiniOverlay';
import { SourcesDrawer } from '../drawers/SourcesDrawer';
import { SupportDrawer } from '../drawers/SupportDrawer';
import { AboutDrawer } from '../drawers/AboutDrawer';
import { HelpDrawer } from '../drawers/HelpDrawer';
import { Footer } from './Footer';
import TransferModal from '../../TransferModal';

interface MainLayoutProps {
  // Header
  themeMode: string;
  onToggleTheme: () => void;
  onHelpClick: () => void;
  onSourcesClick: () => void;
  onSupportClick: () => void;
  onAboutClick: () => void;
  // LeftPanel - all props
  [key: string]: any;
}

export function MainLayout(props: MainLayoutProps) {
  return (
    <div className="app">
      <LeftPanel {...props} />

      {/* ============ Map ============ */}
      <div className="map-wrap">
        {/* Map component injected by parent */}
      </div>

      {/* ============ Map overlay buttons ============ */}
      <MapOverlays
        compassMode={props.compassMode}
        setCompassMode={props.setCompassMode}
        mapBearing={props.mapBearing}
        userMapRotation={props.userMapRotation}
        rotationLocked={props.rotationLocked}
        toggleRotationLock={props.toggleRotationLock}
        snapPickerOpen={props.snapPickerOpen}
        setSnapPickerOpen={props.setSnapPickerOpen}
        handleSnapRotation={props.handleSnapRotation}
        resetMapRotation={props.resetMapRotation}
        panelsCollapsed={props.panelsCollapsed}
        handlePanelToggle={props.handlePanelToggle}
        liveLocation={props.liveLocation}
        liveFollowDetached={props.liveFollowDetached}
        centerLiveLocation={props.centerLiveLocation}
        openMiniWindow={props.openMiniWindow}
        setMiniOverlayOpen={props.setMiniOverlayOpen}
        measureMode={props.measureMode}
        manualMeasure={props.manualMeasure}
        manualKm={props.manualKm}
      />

      {/* ============ Toast ============ */}
      {props.toastMessage && (
        <div className="app-toast" role="status" aria-live="polite" data-testid="toast-message">
          {props.toastMessage}
        </div>
      )}

      {/* ============ Dialogs & Modals ============ */}
      <ResumeNavDialog
        resumeNavDialog={props.resumeNavDialog}
        onClose={() => props.setResumeNavDialog(null)}
        onContinue={() => {
          props.setResumeNavDialog(null);
          document.getElementById("nav-section")?.scrollIntoView({ behavior: "smooth" });
        }}
        onDiscard={() => {
          props.setResumeNavDialog(null);
          props.setNavStartId("");
          props.setNavEndId("");
          props.setNavStartQuery("");
          props.setNavEndQuery("");
          props.setNavCustomStart(null);
          props.setNavCustomEnd(null);
          props.setRoadRoute(null);
          props.setFootRoute(null);
          props.setActiveRouteId("drive");
          props.setRouteDisplayMode("road");
        }}
      />

      <MiniOverlay
        miniOverlayOpen={props.miniOverlayOpen}
        onClose={() => props.setMiniOverlayOpen(false)}
        navigationRoute={props.navigationRoute}
        currentTurnInstruction={props.currentTurnInstruction}
        liveLocation={props.liveLocation}
        recordedTrack={props.recordedTrack}
        recordedKm={props.recordedKm}
        miniStatus={props.miniStatus}
        miniNavSvgMarkup={props.miniNavSvgMarkup}
      />

      {/* ============ Right Panel: Analytics ============ */}
      <AnalyticsPanel
        stats={props.stats}
        incidents={props.incidents}
        filtered={props.filtered}
        selected={props.selected}
        setSelectedId={props.setSelectedId}
        distanceById={props.distanceById}
        blueLine={props.blueLine}
      />

      {/* ============ Footer ============ */}
      <Footer />

      {/* ============ Drawers ============ */}
      <SourcesDrawer
        open={props.drawerOpen}
        onClose={() => props.setDrawerOpen(false)}
        sources={props.sources}
      />

      {props.transferOpen && (
        <TransferModal
          onClose={() => props.setTransferOpen(false)}
          customPois={props.customPois}
          savedRoutes={props.savedRoutes}
          savedMultiRoutes={props.savedMultiRoutes}
          recordedTrack={props.recordedTrack}
          recordingName={props.recordingName}
          onImportPois={props.handleQrImportPois}
          onImportRoutes={props.handleQrImportRoutes}
          onImportMultiRoutes={props.handleQrImportMultiRoutes}
          onImportRecording={props.handleQrImportRecording}
        />
      )}

      <SupportDrawer
        open={props.supportOpen}
        onClose={() => props.setSupportOpen(false)}
        donationCopied={props.donationCopied}
        onOpenDonation={props.openDonationLink}
        onCopyDonation={props.copyDonationLink}
        onShareApp={props.shareCurrentApp}
        donationContactUrl={props.DONATION_CONTACT_URL}
      />

      <AboutDrawer
        open={props.aboutOpen}
        onClose={() => props.setAboutOpen(false)}
        donationCopied={props.donationCopied}
        onOpenDonation={props.openDonationLink}
        onCopyDonation={props.copyDonationLink}
        onShareApp={props.shareCurrentApp}
      />

      <HelpDrawer open={props.helpOpen} onClose={() => props.setHelpOpen(false)} />
    </div>
  );
}
