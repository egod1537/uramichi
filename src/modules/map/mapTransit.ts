export interface TransitSelectionPoint {
  label: string;
  position: google.maps.LatLngLiteral;
}

export type TransitStepKind = 'walk' | 'bus' | 'subway' | 'train' | 'tram' | 'ferry' | 'other';

export interface TransitRouteStep {
  detail: string;
  durationText: string;
  id: string;
  instruction: string;
  kind: TransitStepKind;
  lineLabel: string;
  path: google.maps.LatLngLiteral[];
  timeRangeText?: string;
}

export interface TransitRouteCandidate {
  arrivalTimeText?: string;
  bounds?: google.maps.LatLngBoundsLiteral;
  departureTimeText?: string;
  endAddress: string;
  fareText?: string;
  id: string;
  startAddress: string;
  steps: TransitRouteStep[];
  summary: string;
  totalDurationText: string;
}

interface LoadTransitRouteCandidatesParams {
  destination: google.maps.LatLngLiteral;
  directionsService: google.maps.DirectionsService;
  origin: google.maps.LatLngLiteral;
}

interface SyncTransitRouteOverlayParams {
  currentPolylines: google.maps.Polyline[];
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
  route: TransitRouteCandidate | null;
}

interface SyncTransitSelectionMarkersParams {
  currentMarkers: google.maps.Marker[];
  mapInstance: google.maps.Map;
  mapsApi: typeof google.maps;
  points: TransitSelectionPoint[];
}

interface TransitStepStyle {
  dashed: boolean;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function formatTransitVehicleType(vehicleType?: string | null): TransitStepKind {
  switch (vehicleType) {
    case 'BUS':
      return 'bus';
    case 'SUBWAY':
      return 'subway';
    case 'HEAVY_RAIL':
    case 'COMMUTER_TRAIN':
    case 'HIGH_SPEED_TRAIN':
    case 'INTERCITY_BUS':
    case 'LONG_DISTANCE_TRAIN':
    case 'METRO_RAIL':
    case 'MONORAIL':
    case 'RAIL':
      return 'train';
    case 'TRAM':
      return 'tram';
    case 'FERRY':
      return 'ferry';
    default:
      return vehicleType ? 'other' : 'walk';
  }
}

function buildTransitStepLabel(step: google.maps.DirectionsStep): string {
  if (step.travel_mode === google.maps.TravelMode.WALKING) {
    return '도보';
  }

  if (step.travel_mode !== google.maps.TravelMode.TRANSIT || !step.transit) {
    return stripHtml(step.instructions || step.travel_mode);
  }

  const vehicleName = stripHtml(step.transit.line.vehicle.name || '대중교통');
  const lineName = stripHtml(
    step.transit.line.short_name || step.transit.line.name || vehicleName,
  );

  return `${vehicleName} · ${lineName}`;
}

function buildTransitStepDetail(step: google.maps.DirectionsStep): string {
  if (step.travel_mode === google.maps.TravelMode.WALKING) {
    const distanceText = step.distance?.text ? ` · ${step.distance.text}` : '';

    return `${step.duration?.text ?? ''}${distanceText}`.trim();
  }

  if (step.travel_mode !== google.maps.TravelMode.TRANSIT || !step.transit) {
    return step.duration?.text ?? '';
  }

  const headsign = stripHtml(step.transit.headsign || '');
  const stopCount =
    typeof step.transit.num_stops === 'number' ? `${step.transit.num_stops}정거장` : '';
  const detailParts = [headsign, step.duration?.text ?? '', stopCount].filter(Boolean);

  return detailParts.join(' · ');
}

function buildTransitStepTimeRange(step: google.maps.DirectionsStep): string | undefined {
  if (step.travel_mode !== google.maps.TravelMode.TRANSIT || !step.transit) {
    return undefined;
  }

  const departureTime = step.transit.departure_time?.text;
  const arrivalTime = step.transit.arrival_time?.text;

  if (!departureTime || !arrivalTime) {
    return undefined;
  }

  return `${departureTime} - ${arrivalTime}`;
}

function buildTransitStepPath(step: google.maps.DirectionsStep): google.maps.LatLngLiteral[] {
  if (Array.isArray(step.path) && step.path.length > 1) {
    return step.path.map((point) => point.toJSON());
  }

  return [step.start_location.toJSON(), step.end_location.toJSON()];
}

function buildTransitRouteSummary(steps: TransitRouteStep[]): string {
  const labelByKind: Record<TransitStepKind, string> = {
    bus: '버스',
    ferry: '페리',
    other: '이동',
    subway: '지하철',
    train: '철도',
    tram: '트램',
    walk: '도보',
  };

  return steps
    .map((step) => labelByKind[step.kind])
    .filter(Boolean)
    .join(' → ');
}

function normalizeTransitRouteStep(
  routeIndex: number,
  stepIndex: number,
  step: google.maps.DirectionsStep,
): TransitRouteStep {
  const vehicleType = step.transit?.line.vehicle.type ?? null;

  return {
    detail: buildTransitStepDetail(step),
    durationText: step.duration?.text ?? '',
    id: `transit-step-${routeIndex}-${stepIndex}`,
    instruction: stripHtml(step.instructions || ''),
    kind: formatTransitVehicleType(vehicleType),
    lineLabel: buildTransitStepLabel(step),
    path: buildTransitStepPath(step),
    timeRangeText: buildTransitStepTimeRange(step),
  };
}

function normalizeTransitRoute(
  route: google.maps.DirectionsRoute,
  routeIndex: number,
): TransitRouteCandidate | null {
  const firstLeg = route.legs[0];

  if (!firstLeg) {
    return null;
  }

  const steps = firstLeg.steps.map((step, stepIndex) =>
    normalizeTransitRouteStep(routeIndex, stepIndex, step),
  );

  return {
    arrivalTimeText: firstLeg.arrival_time?.text,
    bounds: route.bounds?.toJSON?.(),
    departureTimeText: firstLeg.departure_time?.text,
    endAddress: firstLeg.end_address,
    fareText: route.fare?.text,
    id: `transit-route-${routeIndex}`,
    startAddress: firstLeg.start_address,
    steps,
    summary: buildTransitRouteSummary(steps),
    totalDurationText: firstLeg.duration?.text ?? '',
  };
}

function readDirectionsErrorMessage(status: google.maps.DirectionsStatus): string {
  switch (status) {
    case google.maps.DirectionsStatus.ZERO_RESULTS:
      return '선택한 두 지점 사이에서 대중교통 경로를 찾지 못했습니다.';
    case google.maps.DirectionsStatus.NOT_FOUND:
      return '출발지 또는 도착지를 찾지 못했습니다.';
    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
      return 'Google Directions 요청 한도를 초과했습니다.';
    case google.maps.DirectionsStatus.REQUEST_DENIED:
      return 'Google Directions 요청이 거부되었습니다. API 설정을 확인하세요.';
    default:
      return '대중교통 경로를 불러오지 못했습니다.';
  }
}

function createDashSymbol(): google.maps.Symbol {
  return {
    path: 'M 0,-1 0,1',
    scale: 4,
    strokeOpacity: 1,
  };
}

function getTransitStepStyle(kind: TransitStepKind): TransitStepStyle {
  switch (kind) {
    case 'walk':
      return {
        dashed: true,
        strokeColor: '#94a3b8',
        strokeOpacity: 0,
        strokeWeight: 3,
      };
    case 'bus':
      return {
        dashed: true,
        strokeColor: '#f97316',
        strokeOpacity: 0,
        strokeWeight: 5,
      };
    case 'subway':
      return {
        dashed: false,
        strokeColor: '#2563eb',
        strokeOpacity: 0.96,
        strokeWeight: 6,
      };
    case 'train':
      return {
        dashed: false,
        strokeColor: '#16a34a',
        strokeOpacity: 0.94,
        strokeWeight: 6,
      };
    case 'tram':
      return {
        dashed: false,
        strokeColor: '#9333ea',
        strokeOpacity: 0.92,
        strokeWeight: 5,
      };
    case 'ferry':
      return {
        dashed: true,
        strokeColor: '#0891b2',
        strokeOpacity: 0,
        strokeWeight: 5,
      };
    default:
      return {
        dashed: false,
        strokeColor: '#0f766e',
        strokeOpacity: 0.92,
        strokeWeight: 5,
      };
  }
}

function clearPolyline(polylines: google.maps.Polyline[], mapsApi: typeof google.maps): void {
  polylines.forEach((polyline) => {
    mapsApi.event.clearInstanceListeners(polyline);
    polyline.setMap(null);
  });
}

function clearMarkers(markers: google.maps.Marker[], mapsApi: typeof google.maps): void {
  markers.forEach((marker) => {
    mapsApi.event.clearInstanceListeners(marker);
    marker.setMap(null);
  });
}

export function loadTransitRouteCandidates({
  destination,
  directionsService,
  origin,
}: LoadTransitRouteCandidatesParams): Promise<TransitRouteCandidate[]> {
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        destination,
        origin,
        provideRouteAlternatives: true,
        travelMode: google.maps.TravelMode.TRANSIT,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result) {
          reject(new Error(readDirectionsErrorMessage(status)));
          return;
        }

        const routes = result.routes
          .map((route, routeIndex) => normalizeTransitRoute(route, routeIndex))
          .filter((route): route is TransitRouteCandidate => route !== null);

        if (!routes.length) {
          reject(new Error('표시할 수 있는 대중교통 경로 후보가 없습니다.'));
          return;
        }

        resolve(routes);
      },
    );
  });
}

export function syncTransitRouteOverlay({
  currentPolylines,
  mapInstance,
  mapsApi,
  route,
}: SyncTransitRouteOverlayParams): google.maps.Polyline[] {
  clearPolyline(currentPolylines, mapsApi);

  if (!route) {
    return [];
  }

  return route.steps
    .filter((step) => step.path.length > 1)
    .map((step) => {
      const style = getTransitStepStyle(step.kind);
      const polyline = new mapsApi.Polyline({
        clickable: false,
        geodesic: false,
        map: mapInstance,
        path: step.path,
        strokeColor: style.strokeColor,
        strokeOpacity: style.strokeOpacity,
        strokeWeight: style.strokeWeight,
        zIndex: 82,
      });

      if (style.dashed) {
        polyline.setOptions({
          icons: [
            {
              icon: createDashSymbol(),
              offset: '0',
              repeat: step.kind === 'walk' ? '11px' : '14px',
            },
          ],
        });
      }

      return polyline;
    });
}

export function syncTransitSelectionMarkers({
  currentMarkers,
  mapInstance,
  mapsApi,
  points,
}: SyncTransitSelectionMarkersParams): google.maps.Marker[] {
  clearMarkers(currentMarkers, mapsApi);

  return points.map((point, index) => {
    const marker = new mapsApi.Marker({
      icon: {
        anchor: new mapsApi.Point(12, 12),
        fillColor: index === 0 ? '#2563eb' : '#ef4444',
        fillOpacity: 1,
        path: mapsApi.SymbolPath.CIRCLE,
        scale: 8,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      label: {
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: '700',
        text: index === 0 ? 'A' : 'B',
      },
      map: mapInstance,
      position: point.position,
      title: point.label,
      zIndex: 90,
    });

    return marker;
  });
}
