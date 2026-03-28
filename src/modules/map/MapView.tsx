import React from 'react';
import { eventBus } from '../../services/EventBus';
import { planStore } from '../../services/PlanStore';
import { loadGoogleMapsApi } from '../../services/GoogleMapsLoader';
import { resolveSimulationPosition } from '../../services/SimulationPosition';
import MapControlsOverlay from './MapControlsOverlay';
import MapStatusOverlay from './MapStatusOverlay';
import MapToolStatusOverlay from './MapToolStatusOverlay';
import MapTransitRoutePanel from './MapTransitRoutePanel';
import {
  hasConfiguredGoogleMapsApiKey,
  googleMapsApiKey,
  mapToolShortcutLabels,
} from './mapConfig';
import { syncMapInfoWindow } from './mapInfoWindowSync';
import { syncMapDrawings } from './mapDrawingSync';
import { syncMapMarkers } from './mapMarkerSync';
import { syncMapRoutes } from './mapRouteSync';
import { createMapServices } from './mapServices';
import {
  appendDraftPathPoint,
  getFinalizedDraftPath,
  isDraftPathClosed,
  isPathTool,
  syncDraftPolyline,
} from './mapDraftPath';
import {
  buildNearbyActionSuggestion,
  findPreferredSearchSuggestion,
  loadGooglePlacePopup,
  loadNearbySearchSuggestions,
  loadSearchSuggestions,
} from './mapSearch';
import {
  loadTransitRouteCandidates,
  syncTransitRouteOverlay,
  syncTransitSelectionMarkers,
  type TransitRouteCandidate,
  type TransitSelectionPoint,
} from './mapTransit';
import { syncSimulationMarker } from './mapSimulationSync';
import { createMarkerIcon, selectFocusedPlace } from './mapUtils';
import type {
  DrawingPopup,
  MapSearchSuggestion,
  MapViewProps,
  MapViewState,
} from './MapView.types';
import type { MapToolbarActionId } from './MapToolbar.types';
import type { Root } from 'react-dom/client';

class MapView extends React.Component<MapViewProps, MapViewState> {
  static defaultProps = {
    className: '',
  };

  private mapRef = React.createRef<HTMLDivElement>();

  private mapInstance: google.maps.Map | null = null;

  private mapsApi: typeof google.maps | null = null;

  private markers = new Map<string, google.maps.Marker>();

  private routePolylines = new Map<string, google.maps.Polyline>();

  private drawingOverlays = new Map<string, google.maps.Polygon | google.maps.Polyline>();

  private transitSelectionMarkers: google.maps.Marker[] = [];

  private transitRoutePolylines: google.maps.Polyline[] = [];

  private simulationMarker: google.maps.Marker | null = null;

  private infoWindow: google.maps.InfoWindow | null = null;

  private placesService: google.maps.places.PlacesService | null = null;

  private autocompleteService: google.maps.places.AutocompleteService | null = null;

  private directionsService: google.maps.DirectionsService | null = null;

  private popupContainer: HTMLDivElement | null = null;

  private popupRoot: Root | null = null;

  private unsubscribe: (() => void) | null = null;

  private isUnmounted = false;

  private mapInitializationFrameId: number | null = null;

  private draftPolyline: google.maps.Polyline | null = null;

  private searchRequestId = 0;

  private searchDebounceTimer: number | null = null;

  private transitRequestId = 0;

  private isRightDragPanning = false;

  private rightDragPointerId: number | null = null;

  private rightDragPreviousPosition: { x: number; y: number } | null = null;

  constructor(props: MapViewProps) {
    super(props);
    this.state = {
      snapshot: planStore.getSnapshot(),
      status: hasConfiguredGoogleMapsApiKey ? 'loading' : 'missing-key',
      errorMessage: '',
      draftPath: [],
      drawingPopup: null,
      googlePlacePopup: null,
      isSearchOpen: false,
      isTransitLoading: false,
      searchQuery: '',
      searchSuggestions: [],
      selectedDrawingId: null,
      selectedTransitRouteId: null,
      transitErrorMessage: '',
      transitRoutes: [],
      transitSelectionPoints: [],
    };
  }

  componentDidMount() {
    this.isUnmounted = false;
    this.unsubscribe = planStore.subscribe(this.handleStoreChange);
    this.mapRef.current?.addEventListener('pointerdown', this.handleMapPointerDown);
    this.mapRef.current?.addEventListener('contextmenu', this.handleMapContextMenu);
    window.addEventListener('pointermove', this.handleWindowPointerMove);
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('keydown', this.handleWindowKeyDown);
    this.initializeMap();
  }

  componentDidUpdate(prevProps: MapViewProps, prevState: MapViewState) {
    const isReady = this.state.status === 'ready';

    if (prevState.status !== this.state.status && isReady) {
      this.syncMapScene();
    }

    if (prevState.snapshot !== this.state.snapshot && isReady) {
      this.syncMapScene();
    }

    if (
      prevState.selectedDrawingId !== this.state.selectedDrawingId &&
      isReady
    ) {
      this.syncDrawingsToState();
    }

    if (
      (prevState.googlePlacePopup !== this.state.googlePlacePopup ||
        prevState.drawingPopup !== this.state.drawingPopup) &&
      isReady
    ) {
      this.syncInfoWindowToState();
    }

    if (prevState.snapshot.currentDayId !== this.state.snapshot.currentDayId) {
      this.clearTransitState();
    }

    if (
      (prevState.draftPath !== this.state.draftPath ||
        prevState.snapshot.activeMapTool !== this.state.snapshot.activeMapTool ||
        prevState.status !== this.state.status) &&
      isReady
    ) {
      this.syncDraftPathOverlay();
    }

    if (
      (prevState.transitSelectionPoints !== this.state.transitSelectionPoints ||
        prevState.selectedTransitRouteId !== this.state.selectedTransitRouteId ||
        prevState.transitRoutes !== this.state.transitRoutes ||
        prevState.status !== this.state.status) &&
      isReady
    ) {
      this.syncTransitOverlay();
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    this.unsubscribe?.();
    this.mapRef.current?.removeEventListener('pointerdown', this.handleMapPointerDown);
    this.mapRef.current?.removeEventListener('contextmenu', this.handleMapContextMenu);
    window.removeEventListener('pointermove', this.handleWindowPointerMove);
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    this.infoWindow?.close();
    this.popupRoot?.unmount();
    this.popupRoot = null;
    this.popupContainer = null;
    this.draftPolyline?.setMap(null);
    this.draftPolyline = null;
    this.routePolylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.routePolylines.clear();
    this.drawingOverlays.forEach((overlay) => {
      overlay.setMap(null);
    });
    this.drawingOverlays.clear();
    this.transitSelectionMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.transitSelectionMarkers = [];
    this.transitRoutePolylines.forEach((polyline) => {
      polyline.setMap(null);
    });
    this.transitRoutePolylines = [];
    this.simulationMarker?.setMap(null);
    this.simulationMarker = null;

    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    this.markers.forEach((marker) => {
      marker.setMap(null);
    });

    this.markers.clear();

    if (this.mapInitializationFrameId) {
      window.cancelAnimationFrame(this.mapInitializationFrameId);
      this.mapInitializationFrameId = null;
    }
  }

  private handleStoreChange = () => {
    const nextSnapshot = planStore.getSnapshot();
    const visibleDrawingIds = new Set(
      nextSnapshot.dayLayers
        .filter((day) => nextSnapshot.visibleDayIds.includes(day.id))
        .flatMap((day) => day.drawings.map((drawing) => drawing.id)),
    );
    const hasSelectedDrawing =
      this.state.selectedDrawingId !== null && visibleDrawingIds.has(this.state.selectedDrawingId);

    this.setState({
      drawingPopup:
        nextSnapshot.poiPopupPlaceId || !hasSelectedDrawing ? null : this.state.drawingPopup,
      snapshot: nextSnapshot,
      googlePlacePopup: nextSnapshot.poiPopupPlaceId ? null : this.state.googlePlacePopup,
      selectedDrawingId: hasSelectedDrawing ? this.state.selectedDrawingId : null,
    });
  };

  private handleDrawingSelect = (
    drawingId: string,
    position: DrawingPopup['position'],
  ) => {
    this.setState({
      drawingPopup: {
        drawingId,
        position,
      },
      googlePlacePopup: null,
      isSearchOpen: false,
      selectedDrawingId: drawingId,
    });
    eventBus.emit('poi:close', {});
  };

  private handleMapPointerDown = (event: PointerEvent) => {
    if (event.button !== 2 || this.state.snapshot.activeMapTool !== 'line') {
      return;
    }

    this.isRightDragPanning = true;
    this.rightDragPointerId = event.pointerId;
    this.rightDragPreviousPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    event.preventDefault();
  };

  private handleMapContextMenu = (event: MouseEvent) => {
    if (this.state.snapshot.activeMapTool === 'line') {
      event.preventDefault();
    }
  };

  private handleWindowPointerMove = (event: PointerEvent) => {
    if (
      !this.isRightDragPanning ||
      this.rightDragPointerId !== event.pointerId ||
      !this.mapInstance ||
      !this.rightDragPreviousPosition
    ) {
      return;
    }

    const deltaX = event.clientX - this.rightDragPreviousPosition.x;
    const deltaY = event.clientY - this.rightDragPreviousPosition.y;

    this.mapInstance.panBy(-deltaX, -deltaY);
    this.rightDragPreviousPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    event.preventDefault();
  };

  private handleWindowPointerUp = (event: PointerEvent) => {
    if (!this.isRightDragPanning || this.rightDragPointerId !== event.pointerId) {
      return;
    }

    this.isRightDragPanning = false;
    this.rightDragPointerId = null;
    this.rightDragPreviousPosition = null;
  };

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    const shortcutToolId = this.getShortcutToolId(event);

    if (shortcutToolId) {
      event.preventDefault();
      this.handleToolSelect(shortcutToolId);
      return;
    }

    if (event.key !== 'Escape') {
      return;
    }

    if (this.state.snapshot.activeMapTool === 'line') {
      event.preventDefault();
      this.finalizeLineDrawing();
      return;
    }

    if (this.state.snapshot.activeMapTool === 'measure' && this.state.draftPath.length) {
      event.preventDefault();
      this.setState({ draftPath: [] }, () => {
        eventBus.emit('map:tool-toggle', { toolId: 'hand' });
      });
    }
  };

  private getShortcutToolId(event: KeyboardEvent): MapToolbarActionId | null {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.repeat ||
      this.isEditableTarget(event.target)
    ) {
      return null;
    }

    const normalizedKey = event.key.toLowerCase();

    switch (normalizedKey) {
      case mapToolShortcutLabels.hand.toLowerCase():
        return 'hand';
      case mapToolShortcutLabels.pin.toLowerCase():
        return 'pin';
      case mapToolShortcutLabels.transit.toLowerCase():
        return 'transit';
      case mapToolShortcutLabels.line.toLowerCase():
        return 'line';
      case mapToolShortcutLabels.measure.toLowerCase():
        return 'measure';
      default:
        return null;
    }
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    );
  }

  private getSelectedTransitRoute(): TransitRouteCandidate | null {
    return (
      this.state.transitRoutes.find((route) => route.id === this.state.selectedTransitRouteId) ?? null
    );
  }

  private clearTransitState = () => {
    if (
      !this.state.transitSelectionPoints.length &&
      !this.state.transitRoutes.length &&
      !this.state.selectedTransitRouteId &&
      !this.state.transitErrorMessage &&
      !this.state.isTransitLoading
    ) {
      return;
    }

    this.transitRequestId += 1;
    this.setState({
      isTransitLoading: false,
      selectedTransitRouteId: null,
      transitErrorMessage: '',
      transitRoutes: [],
      transitSelectionPoints: [],
    });
  };

  private handleTransitReset = () => {
    this.clearTransitState();
  };

  private handleTransitClear = () => {
    this.setState(
      {
        googlePlacePopup: null,
      },
      () => {
        this.clearTransitState();

        if (this.state.snapshot.activeMapTool === 'transit') {
          eventBus.emit('map:tool-toggle', { toolId: 'hand' });
        }
      },
    );
  };

  private finalizeLineDrawing() {
    const finalizedPath = getFinalizedDraftPath(this.state.draftPath);

    if (finalizedPath.length >= 2) {
      planStore.addDrawingAtCurrentDay(
        finalizedPath,
        isDraftPathClosed(finalizedPath) ? 'polygon' : 'polyline',
      );
    }

    this.setState(
      {
        draftPath: [],
      },
      () => {
        eventBus.emit('map:tool-toggle', { toolId: 'hand' });
      },
    );
  }

  private handleInfoWindowClose = () => {
    this.setState({
      drawingPopup: null,
      googlePlacePopup: null,
      selectedDrawingId: null,
    });
    eventBus.emit('poi:close', {});
  };

  private handleMarkerSelect = (pinId: string) => {
    if (this.state.snapshot.activeMapTool === 'transit') {
      const place = this.state.snapshot.allPlaces.find((item) => item.id === pinId);

      if (place) {
        void this.handleTransitPointSelection(place.position, place.name);
      }

      return;
    }

    this.setState(
      {
        drawingPopup: null,
        googlePlacePopup: null,
        isSearchOpen: false,
        selectedDrawingId: null,
      },
      () => eventBus.emit('pin:select', { pinId }),
    );
  };

  private handleToolSelect = (toolId: MapToolbarActionId) => {
    const nextToolId =
      this.state.snapshot.activeMapTool === toolId && toolId !== 'hand' ? 'hand' : toolId;
    const nextState: Partial<MapViewState> = {
      drawingPopup: null,
      googlePlacePopup: null,
      isSearchOpen: false,
      selectedDrawingId: null,
    };

    if (!isPathTool(nextToolId) && this.state.draftPath.length) {
      nextState.draftPath = [];
    }

    this.setState(nextState as Partial<MapViewState>, () =>
      eventBus.emit('map:tool-toggle', { toolId }),
    );
  };

  private async handleTransitPointSelection(
    position: google.maps.LatLngLiteral,
    label?: string,
  ) {
    const nextPoint: TransitSelectionPoint = {
      label: label || `선택 지점 ${this.state.transitSelectionPoints.length + 1}`,
      position,
    };
    const nextPoints =
      this.state.transitSelectionPoints.length >= 2
        ? [nextPoint]
        : [...this.state.transitSelectionPoints, nextPoint];

    this.setState(
      {
        drawingPopup: null,
        googlePlacePopup: null,
        isSearchOpen: false,
        isTransitLoading: nextPoints.length === 2,
        selectedTransitRouteId: null,
        transitErrorMessage: '',
        transitRoutes: [],
        transitSelectionPoints: nextPoints,
      },
      () => {
        if (nextPoints.length === 2) {
          void this.loadTransitRouteAlternatives(nextPoints[0], nextPoints[1]);
        }
      },
    );
    eventBus.emit('poi:close', {});
  }

  private async loadTransitRouteAlternatives(
    originPoint: TransitSelectionPoint,
    destinationPoint: TransitSelectionPoint,
  ) {
    if (!this.directionsService || !this.mapInstance) {
      return;
    }

    const requestId = this.transitRequestId + 1;
    this.transitRequestId = requestId;

    try {
      const routes = await loadTransitRouteCandidates({
        destination: destinationPoint.position,
        directionsService: this.directionsService,
        origin: originPoint.position,
      });

      if (this.isUnmounted || this.transitRequestId !== requestId) {
        return;
      }

      this.setState({
        isTransitLoading: false,
        selectedTransitRouteId: null,
        transitErrorMessage: '',
        transitRoutes: routes,
      });
    } catch (error) {
      if (this.isUnmounted || this.transitRequestId !== requestId) {
        return;
      }

      this.setState({
        isTransitLoading: false,
        selectedTransitRouteId: null,
        transitErrorMessage:
          error instanceof Error ? error.message : '대중교통 경로를 불러오지 못했습니다.',
        transitRoutes: [],
      });
    }
  }

  private handleTransitRouteSelect = (routeId: string) => {
    const nextRoute = this.state.transitRoutes.find((route) => route.id === routeId) ?? null;

    this.setState({
      selectedTransitRouteId: routeId,
    });

    if (nextRoute) {
      this.fitTransitRouteBounds(nextRoute);
    }
  };

  private fitTransitRouteBounds(route: TransitRouteCandidate) {
    if (!this.mapInstance || !this.mapsApi) {
      return;
    }

    if (route.bounds) {
      this.mapInstance.fitBounds(route.bounds);
      return;
    }

    const bounds = new this.mapsApi.LatLngBounds();

    route.steps.forEach((step) => {
      step.path.forEach((point) => {
        bounds.extend(point);
      });
    });

    if (!bounds.isEmpty()) {
      this.mapInstance.fitBounds(bounds);
    }
  }

  private handleSearchFocus = () => {
    if (!this.state.searchQuery.trim()) {
      return;
    }

    this.setState({
      isSearchOpen: true,
    });
  };

  private handleSearchChange = (value: string) => {
    const nextQuery = value;

    this.setState({
      searchQuery: nextQuery,
    });

    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    if (!nextQuery.trim()) {
      this.searchRequestId += 1;
      this.setState({
        isSearchOpen: false,
        searchSuggestions: [],
      });
      return;
    }

    this.setState({
      isSearchOpen: true,
    });

    this.searchDebounceTimer = window.setTimeout(() => {
      void this.updateSearchPredictions(nextQuery.trim());
    }, 180);
  };

  private handleSearchSubmit = () => {
    const { searchQuery, searchSuggestions } = this.state;

    if (!searchQuery.trim()) {
      return;
    }

    const firstPrediction = findPreferredSearchSuggestion(searchSuggestions);

    if (firstPrediction) {
      void this.handleSearchSuggestionSelect(firstPrediction);
      return;
    }

    void this.runNearbySearch(searchQuery.trim(), true);
  };

  private handleSearchSuggestionSelect = async (suggestion: MapSearchSuggestion) => {
    if (this.searchDebounceTimer) {
      window.clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    this.searchRequestId += 1;
    this.setState({
      isSearchOpen: false,
      searchSuggestions: [],
    });

    if (suggestion.kind === 'nearby-action') {
      await this.runNearbySearch(this.state.searchQuery.trim(), false);
      return;
    }

    if (!suggestion.placeId) {
      return;
    }

    await this.openGooglePlacePopupById(suggestion.placeId, suggestion.mainText, suggestion.position, {
      address: suggestion.secondaryText,
      name: suggestion.mainText,
      position: suggestion.position,
      viewport: suggestion.viewport,
    });
  };

  private initializeMap = () => {
    if (!hasConfiguredGoogleMapsApiKey) {
      this.setState({
        status: 'missing-key',
        errorMessage: '',
      });
      return;
    }

    loadGoogleMapsApi(googleMapsApiKey)
      .then((maps) => {
        if (this.isUnmounted) {
          return;
        }

        this.mapsApi = maps;
        this.ensureMapInitialized();
      })
      .catch((error: Error) => {
        if (this.isUnmounted) {
          return;
        }

        this.setState({
          status: 'error',
          errorMessage: error.message ?? '지도를 불러오는 중 알 수 없는 오류가 발생했습니다.',
        });
      });
  };

  private ensureMapInitialized() {
    if (this.isUnmounted || !this.mapsApi) {
      return;
    }

    const selectedPlace = selectFocusedPlace(this.state.snapshot);

    if (!selectedPlace) {
      return;
    }

    if (!this.mapRef.current) {
      if (!this.mapInitializationFrameId) {
        this.mapInitializationFrameId = window.requestAnimationFrame(() => {
          this.mapInitializationFrameId = null;
          this.ensureMapInitialized();
        });
      }

      return;
    }

    if (!this.mapInstance) {
      const mapServices = createMapServices({
        center: selectedPlace.position,
        container: this.mapRef.current,
        maps: this.mapsApi,
        onInfoWindowClose: this.handleInfoWindowClose,
        onMapClick: this.handleMapClick,
        zoom: selectedPlace.zoom ?? 13,
      });

      this.mapInstance = mapServices.mapInstance;
      this.autocompleteService = mapServices.autocompleteService;
      this.directionsService = mapServices.directionsService;
      this.placesService = mapServices.placesService;
      this.infoWindow = mapServices.infoWindow;
    }

    if (this.state.status !== 'ready' || this.state.errorMessage) {
      this.setState({
        status: 'ready',
        errorMessage: '',
      });
    }
  }

  private handleMapClick = (event: google.maps.MapMouseEvent) => {
    const { snapshot } = this.state;
    const mapClickEvent = event as google.maps.MapMouseEvent & {
      placeId?: string;
      stop?: () => void;
    };

    if (snapshot.activeMapTool === 'transit' && event.latLng) {
      mapClickEvent.stop?.();
      void this.handleTransitPointSelection(
        {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
        mapClickEvent.placeId
          ? `지도 지점 ${this.state.transitSelectionPoints.length + 1}`
          : undefined,
      );
      return;
    }

    if (snapshot.activeMapTool === 'pin' && event.latLng) {
      mapClickEvent.stop?.();
      this.setState({
        isSearchOpen: false,
      });
      eventBus.emit('map:pin-create', {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
      return;
    }

    if (isPathTool(snapshot.activeMapTool) && event.latLng) {
      mapClickEvent.stop?.();
      this.setState((currentState) => ({
        draftPath: appendDraftPathPoint(currentState.draftPath, event.latLng),
        drawingPopup: null,
        googlePlacePopup: null,
        isSearchOpen: false,
        selectedDrawingId: null,
      }));
      eventBus.emit('poi:close', {});
      return;
    }

    if (mapClickEvent.placeId && mapClickEvent.latLng) {
      mapClickEvent.stop?.();
      this.setState({
        drawingPopup: null,
        selectedDrawingId: null,
      });
      void this.openGooglePlacePopupById(mapClickEvent.placeId, undefined, {
        lat: mapClickEvent.latLng.lat(),
        lng: mapClickEvent.latLng.lng(),
      });
      return;
    }

    this.handleInfoWindowClose();
    this.setState({
      drawingPopup: null,
      isSearchOpen: false,
      selectedDrawingId: null,
    });
  };

  private async updateSearchPredictions(query: string) {
    if (!this.autocompleteService || !this.mapInstance) {
      return;
    }

    const requestId = this.searchRequestId + 1;
    this.searchRequestId = requestId;
    const nextSuggestions = await loadSearchSuggestions({
      autocompleteService: this.autocompleteService,
      bounds: this.mapInstance.getBounds() ?? null,
      query,
    });

    if (this.isUnmounted || this.searchRequestId !== requestId) {
      return;
    }

    this.setState({
      isSearchOpen: true,
      searchSuggestions: nextSuggestions,
    });
  }

  private async runNearbySearch(query: string, openFirstResult: boolean) {
    if (!this.mapInstance || !this.placesService || !query) {
      return;
    }

    const requestId = this.searchRequestId + 1;
    this.searchRequestId = requestId;
    const nearbyResults = await loadNearbySearchSuggestions({
      mapInstance: this.mapInstance,
      placesService: this.placesService,
      query,
    });

    if (this.isUnmounted || this.searchRequestId !== requestId) {
      return;
    }

    if (!nearbyResults.length) {
      this.setState({
        isSearchOpen: true,
        searchSuggestions: [
          buildNearbyActionSuggestion(query, '현재 보기 주변 결과가 없습니다'),
        ],
      });
      return;
    }

    if (openFirstResult) {
      await this.handleSearchSuggestionSelect(nearbyResults[0]);
      return;
    }

    this.setState({
      isSearchOpen: true,
      searchSuggestions: nearbyResults,
    });
  }

  private async openGooglePlacePopupById(
    placeId: string,
    searchQuery?: string,
    fallbackPosition?: { lat: number; lng: number },
    fallbackPopup?: {
      address?: string;
      name: string;
      position?: { lat: number; lng: number };
      viewport?: google.maps.LatLngBoundsLiteral;
    },
  ) {
    if (!this.placesService) {
      return;
    }

    this.setState({
      drawingPopup: null,
      selectedDrawingId: null,
    });
    this.infoWindow?.close();
    eventBus.emit('poi:close', {});

    const nextPopup = await loadGooglePlacePopup({
      fallbackPopup:
        fallbackPopup && fallbackPopup.position
          ? {
              address: fallbackPopup.address,
              name: fallbackPopup.name,
              position: fallbackPopup.position,
              viewport: fallbackPopup.viewport,
            }
          : undefined,
      fallbackPosition,
      mapInstance: this.mapInstance,
      placeId,
      placesService: this.placesService,
    });

    if (this.isUnmounted || !nextPopup) {
      return;
    }

    this.setState(
      {
        googlePlacePopup: nextPopup,
        isSearchOpen: false,
        searchQuery: searchQuery ?? nextPopup.name,
        searchSuggestions: [],
      },
      () => {
        this.syncInfoWindowToState();
      },
    );
  }

  private syncMarkersToState() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    syncMapMarkers({
      activePlaceId: this.state.snapshot.activePlaceId,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
      markers: this.markers,
      onMarkerClick: this.handleMarkerSelect,
      visiblePlaces: this.state.snapshot.visiblePlaces,
    });
  }

  private syncViewportToState() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    const selectedPlace = selectFocusedPlace(this.state.snapshot);
    const simulationPosition = resolveSimulationPosition(
      this.state.snapshot.currentDay,
      this.state.snapshot.currentMinutes,
    );

    if (!selectedPlace && !simulationPosition) {
      return;
    }

    if (simulationPosition?.kind === 'route') {
      this.mapInstance.panTo(simulationPosition.position);
    } else if (selectedPlace) {
      this.mapInstance.panTo(selectedPlace.position);
      this.mapInstance.setZoom(selectedPlace.zoom ?? 13);
    }

    this.markers.forEach((marker, markerId) => {
      const place = this.state.snapshot.visiblePlaces.find((item) => item.id === markerId);

      if (!place) {
        return;
      }

      marker.setIcon(
        createMarkerIcon(this.mapsApi as typeof google.maps, place, markerId === selectedPlace.id),
      );
      marker.setZIndex(markerId === selectedPlace.id ? 100 : 1);
    });

    this.mapInstance.setOptions({
      draggable: this.state.snapshot.activeMapTool !== 'line',
      draggableCursor:
        this.state.snapshot.activeMapTool === 'pin' ||
        this.state.snapshot.activeMapTool === 'transit'
          ? 'crosshair'
          : undefined,
    });
  }

  private syncRoutesToState() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    syncMapRoutes({
      activeCategoryIds: this.state.snapshot.activeCategoryIds,
      currentDayId: this.state.snapshot.currentDayId,
      dayLayers: this.state.snapshot.dayLayers,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
      routePolylines: this.routePolylines,
      visibleDayIds: this.state.snapshot.visibleDayIds,
    });
  }

  private syncDrawingsToState() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    syncMapDrawings({
      activeDayId: this.state.snapshot.currentDayId,
      dayLayers: this.state.snapshot.dayLayers,
      drawingOverlays: this.drawingOverlays,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
      onDrawingSelect: this.handleDrawingSelect,
      selectedDrawingId: this.state.selectedDrawingId,
      visibleDayIds: this.state.snapshot.visibleDayIds,
    });
  }

  private syncInfoWindowToState() {
    if (!this.mapInstance || !this.infoWindow) {
      return;
    }

    const popupHost = syncMapInfoWindow({
      allPlaces: this.state.snapshot.allPlaces,
      dayLayers: this.state.snapshot.dayLayers,
      drawingPopup: this.state.drawingPopup,
      googlePlacePopup: this.state.googlePlacePopup,
      infoWindow: this.infoWindow,
      mapInstance: this.mapInstance,
      markers: this.markers,
      poiPopupPlaceId: this.state.snapshot.poiPopupPlaceId,
      popupContainer: this.popupContainer,
      popupRoot: this.popupRoot,
    });

    this.popupContainer = popupHost.popupContainer;
    this.popupRoot = popupHost.popupRoot;
  }

  private syncDraftPathOverlay() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    this.draftPolyline = syncDraftPolyline({
      activeToolId: this.state.snapshot.activeMapTool,
      currentPolyline: this.draftPolyline,
      draftPath: this.state.draftPath,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
    });
  }

  private syncTransitOverlay() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    this.transitSelectionMarkers = syncTransitSelectionMarkers({
      currentMarkers: this.transitSelectionMarkers,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
      points: this.state.transitSelectionPoints,
    });
    this.transitRoutePolylines = syncTransitRouteOverlay({
      currentPolylines: this.transitRoutePolylines,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
      route: this.getSelectedTransitRoute(),
    });
  }

  private syncSimulationMarkerToState() {
    if (!this.mapsApi || !this.mapInstance) {
      return;
    }

    this.simulationMarker = syncSimulationMarker({
      currentDay: this.state.snapshot.currentDay,
      currentMarker: this.simulationMarker,
      currentMinutes: this.state.snapshot.currentMinutes,
      mapInstance: this.mapInstance,
      mapsApi: this.mapsApi,
    });
  }

  private syncMapScene() {
    this.syncMarkersToState();
    this.syncRoutesToState();
    this.syncDrawingsToState();
    this.syncSimulationMarkerToState();
    this.syncViewportToState();
    this.syncInfoWindowToState();
    this.syncDraftPathOverlay();
    this.syncTransitOverlay();
  }

  render() {
    const { className } = this.props;
    const {
      draftPath,
      errorMessage,
      isTransitLoading,
      selectedTransitRouteId,
      snapshot,
      status,
      transitErrorMessage,
      transitRoutes,
      transitSelectionPoints,
    } = this.state;

    return (
      <div
        className={`relative h-full w-full overflow-hidden ${className} ${
          snapshot.activeMapTool !== 'hand' ? 'workspace-map-fill--draw-mode' : ''
        }`}
      >
        <div ref={this.mapRef} className="h-full w-full" aria-label="Google map" />
        <MapControlsOverlay
          activeToolId={snapshot.activeMapTool}
          isSearchOpen={this.state.isSearchOpen}
          onSearchChange={this.handleSearchChange}
          onSearchFocus={this.handleSearchFocus}
          onSearchSelect={this.handleSearchSuggestionSelect}
          onSearchSubmit={this.handleSearchSubmit}
          onToolSelect={this.handleToolSelect}
          planMeta={snapshot.planMeta}
          searchQuery={this.state.searchQuery}
          searchSuggestions={this.state.searchSuggestions}
        />
        <MapTransitRoutePanel
          activeToolId={snapshot.activeMapTool}
          errorMessage={transitErrorMessage}
          isLoading={isTransitLoading}
          onClear={this.handleTransitClear}
          onResetPoints={this.handleTransitReset}
          onSelectRoute={this.handleTransitRouteSelect}
          points={transitSelectionPoints}
          routes={transitRoutes}
          selectedRouteId={selectedTransitRouteId}
        />

        {isPathTool(snapshot.activeMapTool) ? (
          <MapToolStatusOverlay activeToolId={snapshot.activeMapTool} draftPath={draftPath} />
        ) : null}

        <MapStatusOverlay status={status} errorMessage={errorMessage} />
      </div>
    );
  }
}

export default MapView;
