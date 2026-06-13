import { type CSSProperties } from 'react';
import MapView from './Map';
import TransferModal from './TransferModal';
import { HeaderBar } from './components/layout/HeaderBar';
import { MapOverlays } from './components/layout/MapOverlays';
import { AnalyticsPanel } from './components/panels/AnalyticsPanel';
import { LeftPanel } from './components/layout/LeftPanel';
import { ResumeNavDialog } from './components/modals/ResumeNavDialog';
import { MiniOverlay } from './components/modals/MiniOverlay';
import { HelpDrawer } from './components/drawers/HelpDrawer';
import { SourcesDrawer } from './components/drawers/SourcesDrawer';
import { SupportDrawer } from './components/drawers/SupportDrawer';
import { AboutDrawer } from './components/drawers/AboutDrawer';
import { Footer } from './components/layout/Footer';
import { useAppWiring } from './hooks/useAppWiring';
import { incidents, blueLine } from './data/geo';
import { sources } from './data/sources';
import { DONATION_CONTACT_URL } from './constants';
import { openExternalNav } from './navigation/externalNav';

export default function App() {
  const wiring = useAppWiring();

  const {
    effectiveTheme, panelsCollapsed, panelHeightPct, appProps, mapViewRef,
    openMiniWindow, miniNavSvgMarkup, miniOverlayOpen, setMiniOverlayOpen, miniStatus,
    themeMode, setThemeMode, handleResetView, setHelpOpen, setSupportOpen, setAboutOpen,
    measureMode, setMeasureMode, setManualMeasure, setDrawerOpen, setTransferOpen,
    initialMapViewRef, visible, filtered, selected, distanceLine, largeLabels, allLabels,
    focusTarget, navigationRoute, routeOverlays, routeDisplayMode, liveLocation, liveCenterRequestId,
    handleLiveFollowDetachedChange, handleMapViewChange, recordedTrack, compassMode, mapBearing,
    userMapRotation, handleUserRotationChange, rotationLocked, poiDraft, poiMarkerColor,
    poiMarkerShape, poiMarkerSize, customPois, multiRouteDraftPoints, activeMultiRoute,
    navFollowZoom, navigateFromCurrentPosition, setMapPointAsNavStart, onMapClick,
    manualMeasure, addPoiMode, multiRouteBuildMode, setCompassMode, toggleRotationLock,
    snapPickerOpen, setSnapPickerOpen, handleSnapRotation, resetMapRotation, liveFollowDetached,
    centerLiveLocation, manualKm, toastMessage, resumeNavDialog, setResumeNavDialog, setNavStartId,
    setNavEndId, setNavStartQuery, setNavEndQuery, setNavCustomStart, setNavCustomEnd, setRoadRoute,
    setFootRoute, setActiveRouteId, setRouteDisplayMode, currentTurnInstruction, recordedKm,
    stats, setSelectedId, drawerOpen, transferOpen, savedRoutes, savedMultiRoutes, recordingName,
    handleQrImportPois, handleQrImportRoutes, handleQrImportMultiRoutes, handleQrImportRecording,
    supportOpen, donationCopied, openDonationLink, copyDonationLink, shareCurrentApp,
    aboutOpen, helpOpen,
  } = wiring;

  return (
    <div
      className={`app ${panelsCollapsed ? 'panels-collapsed' : ''}`}
      style={{ '--panel-height-pct': `${panelHeightPct}vh` } as CSSProperties}
    >
      <HeaderBar
        panelsCollapsed={panelsCollapsed}
        handlePanelToggle={appProps.handlePanelToggle as () => void}
        openMiniWindow={openMiniWindow}
        setMiniOverlayOpen={setMiniOverlayOpen}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        resetView={handleResetView}
        setHelpOpen={setHelpOpen}
        setSupportOpen={setSupportOpen}
        setAboutOpen={setAboutOpen}
        measureMode={measureMode}
        setMeasureMode={setMeasureMode}
        setManualMeasure={setManualMeasure}
        setDrawerOpen={setDrawerOpen}
        setTransferOpen={setTransferOpen}
      />

      <LeftPanel {...appProps} />

      <div className="map-wrap">
        <MapView
          initialCenter={initialMapViewRef.current ?? undefined}
          visible={visible}
          filteredIncidents={filtered}
          selectedIncident={selected}
          onSelectIncident={(id) => setSelectedId(id)}
          measureMode={measureMode}
          pointPickMode={addPoiMode || measureMode || multiRouteBuildMode}
          manualMeasure={manualMeasure}
          onMapClick={onMapClick}
          distanceLine={selected ? distanceLine : null}
          theme={effectiveTheme}
          largeLabels={largeLabels}
          allLabels={allLabels}
          focusTarget={focusTarget}
          ref={mapViewRef}
          navigationRoute={navigationRoute}
          routeOverlays={routeOverlays}
          routeDisplayMode={routeDisplayMode}
          liveLocation={liveLocation}
          liveCenterRequestId={liveCenterRequestId}
          onLiveFollowDetachedChange={handleLiveFollowDetachedChange}
          onMapViewChange={handleMapViewChange}
          recordedTrack={recordedTrack}
          compassMode={compassMode}
          mapBearing={mapBearing}
          userRotation={userMapRotation}
          onUserRotationChange={handleUserRotationChange}
          rotationLocked={rotationLocked}
          poiDraft={poiDraft}
          poiDraftStyle={{
            markerColor: poiMarkerColor,
            markerShape: poiMarkerShape,
            markerSize: poiMarkerSize,
          }}
          customPois={customPois}
          multiRouteDraft={multiRouteDraftPoints}
          activeMultiRoute={activeMultiRoute ? { points: activeMultiRoute.points, name: activeMultiRoute.name } : null}
          navFollowZoom={navFollowZoom}
          onNavigateToPoint={navigateFromCurrentPosition}
          onSetNavStart={setMapPointAsNavStart}
        />
      </div>

      <MapOverlays
        compassMode={compassMode}
        setCompassMode={setCompassMode}
        mapBearing={mapBearing}
        userMapRotation={userMapRotation}
        rotationLocked={rotationLocked}
        toggleRotationLock={toggleRotationLock}
        snapPickerOpen={snapPickerOpen}
        setSnapPickerOpen={setSnapPickerOpen}
        handleSnapRotation={handleSnapRotation}
        resetMapRotation={resetMapRotation}
        panelsCollapsed={panelsCollapsed}
        handlePanelToggle={appProps.handlePanelToggle as () => void}
        liveLocation={liveLocation}
        liveFollowDetached={liveFollowDetached}
        centerLiveLocation={centerLiveLocation}
        openMiniWindow={openMiniWindow}
        setMiniOverlayOpen={setMiniOverlayOpen}
        measureMode={measureMode}
        manualMeasure={manualMeasure}
        manualKm={manualKm}
      />

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite" data-testid="toast-message">
          {toastMessage}
        </div>
      )}

      <ResumeNavDialog
        resumeNavDialog={resumeNavDialog}
        onClose={() => setResumeNavDialog(null)}
        onContinue={() => {
          setResumeNavDialog(null);
          document.getElementById('nav-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onDiscard={() => {
          setResumeNavDialog(null);
          setNavStartId('');
          setNavEndId('');
          setNavStartQuery('');
          setNavEndQuery('');
          setNavCustomStart(null);
          setNavCustomEnd(null);
          setRoadRoute(null);
          setFootRoute(null);
          setActiveRouteId('drive');
          setRouteDisplayMode('road');
        }}
      />

      <MiniOverlay
        miniOverlayOpen={miniOverlayOpen}
        onClose={() => setMiniOverlayOpen(false)}
        navigationRoute={navigationRoute}
        currentTurnInstruction={currentTurnInstruction}
        liveLocation={liveLocation}
        recordedTrack={recordedTrack}
        recordedKm={recordedKm}
        miniStatus={miniStatus}
        miniNavSvgMarkup={miniNavSvgMarkup}
      />

      <AnalyticsPanel
        stats={stats}
        incidents={incidents}
        filtered={filtered}
        selected={selected}
        setSelectedId={setSelectedId}
        distanceById={appProps.distanceById}
        blueLine={blueLine}
      />

      <Footer />

      <SourcesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} sources={sources} />

      {transferOpen && (
        <TransferModal
          onClose={() => setTransferOpen(false)}
          customPois={customPois}
          savedRoutes={savedRoutes}
          savedMultiRoutes={savedMultiRoutes}
          recordedTrack={recordedTrack}
          recordingName={recordingName}
          onImportPois={handleQrImportPois}
          onImportRoutes={handleQrImportRoutes}
          onImportMultiRoutes={handleQrImportMultiRoutes}
          onImportRecording={handleQrImportRecording}
        />
      )}

      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        donationCopied={donationCopied}
        onOpenDonation={openDonationLink}
        onCopyDonation={async () => { await copyDonationLink(); }}
        onShareApp={shareCurrentApp}
        donationContactUrl={DONATION_CONTACT_URL}
      />

      <AboutDrawer
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        donationCopied={donationCopied}
        onOpenDonation={openDonationLink}
        onCopyDonation={async () => { await copyDonationLink(); }}
        onShareApp={shareCurrentApp}
      />

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
