import { useEffect } from 'react';
import L from 'leaflet';
import { towns, unifilPoints, terrainFeatures } from '../data/geo';
import { labelHtml } from '../mapHtml';

export const useMapLabels = (
  layersRef: React.MutableRefObject<any>,
  largeLabels: boolean,
  allLabels: boolean,
  visible: any,
) => {
  useEffect(() => {
    const group = layersRef.current.labels;
    if (!group) return;
    group.clearLayers();
    if (!visible.cityLabels) return;

    const compactTownIds = new Set([
      'tyre', 'sidon', 'nabat', 'naqoura', 'alma', 'dhayra', 'aitaa', 'rmeish',
      'yater', 'bintj', 'tibnin', 'braachit', 'haris', 'hadatha', 'beit-yahoun',
      'rachaf', 'kafra', 'khirbet-selm', 'deir-ntar', 'majdal-selm', 'tulin',
      'souaneh', 'froun', 'ghandouriyeh', 'burj-el-shemali', 'rashidiyeh',
      'sarafand', 'zahrani-area', 'ghaziyeh', 'marjay', 'khiam', 'kfark', 'mais',
      'kawkaba', 'mari', 'hasbaya', 'shebaa', 'metula', 'kiryat', 'shlomi',
    ]);

    if (visible.settlementLabels) {
      const townsToLabel = largeLabels || allLabels
        ? towns
        : towns.filter((t: any) => compactTownIds.has(t.id) || (visible.sectColors && t.side === 'LB'));
      townsToLabel.forEach((t: any) => {
        const icon = L.divIcon({
          className: `map-label-icon ${largeLabels ? 'label-expanded' : 'label-compact'} settlement-label ${t.side === 'IL' ? 'il-label' : 'lb-label'}${(visible.sectColors && t.sect) ? ` sect-${t.sect}` : ''}`,
          html: labelHtml(t.name_he, largeLabels ? t.name_en : undefined, visible.sectColors ? t.sect : undefined),
          iconSize: undefined,
          iconAnchor: [0, 10],
        });
        L.marker([t.lat, t.lon], { icon, interactive: false }).addTo(group);
      });
    }

    if (visible.unifil) {
      const unifilToLabel = largeLabels
        ? unifilPoints.filter((u: any) => u.kind !== 'reference')
        : unifilPoints.filter((u: any) => u.kind === 'hq');
      unifilToLabel.forEach((u: any) => {
        const icon = L.divIcon({
          className: `map-label-icon ${largeLabels ? 'label-expanded' : 'label-compact'} unifil-label`,
          html: labelHtml(u.name_he, largeLabels ? u.name_en : undefined),
          iconSize: undefined,
          iconAnchor: [0, 12],
        });
        L.marker([u.lat, u.lon], { icon, interactive: false }).addTo(group);
      });
    }

    const isRidgeLike = (type: string) => type === 'ridge' || type === 'mountain' || type === 'valley';
    const isWaterLike = (type: string) => type === 'river' || type === 'wadi' || type === 'water';
    const compactRidgeIds = new Set(['jabal-amel', 'bint-jbeil-ridge', 'nabatieh-plateau', 'silvester-ridge']);
    const compactWaterIds = new Set(['litani', 'awali', 'zahrani', 'hasbani']);
    const terrainToLabel = terrainFeatures.filter((f: any) => {
      if (isRidgeLike(f.type) && !visible.ridgeLabels) return false;
      if (isWaterLike(f.type) && !visible.waterLabels) return false;
      if (largeLabels || allLabels) return true;
      return compactRidgeIds.has(f.id) || compactWaterIds.has(f.id);
    });
    terrainToLabel.forEach((f: any) => {
      const icon = L.divIcon({
        className: `map-label-icon ${largeLabels ? 'label-expanded' : 'label-compact'} terrain-label terrain-${f.type}`,
        html: labelHtml(f.name_he, largeLabels ? f.name_en : undefined),
        iconSize: undefined,
        iconAnchor: [0, 12],
      });
      L.marker([f.lat, f.lon], { icon, interactive: false }).addTo(group);
    });
  }, [largeLabels, allLabels, visible.cityLabels, visible.settlementLabels, visible.ridgeLabels, visible.waterLabels, visible.unifil, visible.sectColors]);
};
