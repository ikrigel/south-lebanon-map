// Device detection and external navigation app integration
export const isMobileLikeDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|SamsungBrowser|Mobile/i.test(ua) || window.matchMedia('(max-width: 768px)').matches;
};

// Opens external navigation app: tries Waze deep-link first (Android/iOS),
// falls back to Apple Maps on iOS, then Google Maps web.
// fromLat/Lon: start coords (null = let app use current GPS)
// toLat/Lon: destination coords
export const openExternalNav = (
  toLat: number,
  toLon: number,
  toLabel: string,
  fromLat?: number | null,
  fromLon?: number | null
) => {
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const destLL = `${toLat.toFixed(6)},${toLon.toFixed(6)}`;
  const startLL = (fromLat != null && fromLon != null)
    ? `${fromLat.toFixed(6)},${fromLon.toFixed(6)}`
    : null;

  const wazeUrl = `waze://?ll=${destLL}&navigate=yes&zoom=17`;
  const gmAndroid = startLL
    ? `https://www.google.com/maps/dir/${startLL}/${destLL}/`
    : `https://www.google.com/maps/dir/Current+Location/${destLL}/`;
  const appleMaps = startLL
    ? `maps://maps.apple.com/?saddr=${startLL}&daddr=${destLL}&dirflg=d`
    : `maps://maps.apple.com/?daddr=${destLL}&dirflg=d`;
  const gmWeb = startLL
    ? `https://www.google.com/maps/dir/${startLL}/${destLL}/@${destLL},13z`
    : `https://www.google.com/maps/dir/Current+Location/${destLL}/@${destLL},13z`;

  if (isIOS) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = wazeUrl;
    document.body.appendChild(iframe);
    setTimeout(() => { document.body.removeChild(iframe); }, 1500);
    setTimeout(() => { window.location.href = appleMaps; }, 500);
    return;
  }
  if (isAndroid) {
    const intent = `intent://ul?ll=${destLL}&navigate=yes#Intent;scheme=waze;package=com.waze;end`;
    try {
      window.location.href = intent;
    } catch {
      window.open(gmAndroid, '_blank');
    }
    setTimeout(() => { window.open(gmAndroid, '_blank'); }, 1800);
    return;
  }
  window.open(gmWeb, '_blank');
};
