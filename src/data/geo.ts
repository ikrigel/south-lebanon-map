// Barrel re-export of all geo data
// All coordinates are approximate, for illustrative/educational use only.
// Sources: OpenStreetMap, Wikipedia (Blue Line / Litani / village articles),
// UNIFIL public materials, Reuters / AP / BBC / Times of Israel / UN News
// public reporting. See sources.ts for full URL list.

export {
  blueLine,
  litaniRiver,
  zahraniRiver,
  awaliRiver,
  litaniBufferZone,
} from './rivers';

export type { Sect, Town } from './towns';
export { towns } from './towns';

export type {
  TerrainFeature,
  UnifilPoint,
  InfluenceZone,
} from './features';
export {
  terrainFeatures,
  unifilPoints,
  influenceZones,
} from './features';

export type { Incident } from './incidents';
export { incidents } from './incidents';
