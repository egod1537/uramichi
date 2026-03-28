import { LayersIcon } from '../../components/icons/WorkspaceIcons';
import type { PlannerSnapshot } from '../../models/Plan';
import { buildDayLayerGroups, countDayLayerAlternatives } from '../../shared/utils/dayLayerGroups';

interface SidebarSummaryCardProps {
  snapshot: PlannerSnapshot;
}

export default function SidebarSummaryCard({ snapshot }: SidebarSummaryCardProps) {
  const totalPlaces = snapshot.dayLayers.reduce((count, layer) => count + layer.places.length, 0);
  const layerGroups = buildDayLayerGroups(snapshot.dayLayers, snapshot.selectedVariantIds);
  const alternativeCount = countDayLayerAlternatives(snapshot.dayLayers);

  return (
    <section className="workspace-sidebar-summary">
      <div className="workspace-sidebar-summary-icon">
        <LayersIcon />
      </div>
      <div className="workspace-sidebar-summary-content">
        <p className="workspace-sidebar-summary-title">{snapshot.planMeta.title}</p>
        <p className="workspace-sidebar-summary-meta">
          레이어 {layerGroups.length}개
          {alternativeCount > 0 ? ` · 대안 ${alternativeCount}개` : ''}
        </p>
        <p className="workspace-sidebar-summary-submeta">
          장소 {totalPlaces}개 · {snapshot.planMeta.travelRange}
        </p>
      </div>
    </section>
  );
}
