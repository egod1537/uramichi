import { createRoot, type Root } from 'react-dom/client';
import type { DayLayer } from '../../models/Plan';
import type { Poi } from '../../models/Poi';
import type { MapDrawing } from '../../models/Route';
import DrawingInfoWindow from './DrawingInfoWindow';
import GooglePlaceInfoWindow from './GooglePlaceInfoWindow';
import PinInfoWindow from './PinInfoWindow';
import type { DrawingPopup, GooglePlacePopup } from './MapView.types';

interface PopupHostState {
  popupContainer: HTMLDivElement | null;
  popupRoot: Root | null;
}

interface SyncMapInfoWindowParams extends PopupHostState {
  allPlaces: Poi[];
  dayLayers: DayLayer[];
  drawingPopup: DrawingPopup | null;
  googlePlacePopup: GooglePlacePopup | null;
  infoWindow: google.maps.InfoWindow;
  mapInstance: google.maps.Map;
  markers: Map<string, google.maps.Marker>;
  poiPopupPlaceId: string | null;
}

function findDrawingById(dayLayers: DayLayer[], drawingId: string): MapDrawing | null {
  for (const day of dayLayers) {
    const drawing = day.drawings.find((item) => item.id === drawingId);

    if (drawing) {
      return drawing;
    }
  }

  return null;
}

function ensurePopupHost(
  infoWindow: google.maps.InfoWindow,
  popupContainer: HTMLDivElement | null,
  popupRoot: Root | null,
): PopupHostState {
  if (popupContainer && popupRoot) {
    return { popupContainer, popupRoot };
  }

  const nextPopupContainer = document.createElement('div');
  nextPopupContainer.className = 'workspace-poi-popup-host';

  const nextPopupRoot = createRoot(nextPopupContainer);
  infoWindow.setContent(nextPopupContainer);

  return {
    popupContainer: nextPopupContainer,
    popupRoot: nextPopupRoot,
  };
}

export function syncMapInfoWindow({
  allPlaces,
  dayLayers,
  drawingPopup,
  googlePlacePopup,
  infoWindow,
  mapInstance,
  markers,
  poiPopupPlaceId,
  popupContainer,
  popupRoot,
}: SyncMapInfoWindowParams): PopupHostState {
  if (googlePlacePopup) {
    const popupHost = ensurePopupHost(infoWindow, popupContainer, popupRoot);

    popupHost.popupContainer.className = 'workspace-google-place-popup-host';
    popupHost.popupRoot.render(<GooglePlaceInfoWindow place={googlePlacePopup} />);
    infoWindow.open({
      map: mapInstance,
      position: googlePlacePopup.position,
      shouldFocus: false,
    });

    return popupHost;
  }

  if (drawingPopup) {
    const popupDrawing = findDrawingById(dayLayers, drawingPopup.drawingId);

    if (!popupDrawing) {
      infoWindow.close();
      return { popupContainer, popupRoot };
    }

    const popupHost = ensurePopupHost(infoWindow, popupContainer, popupRoot);

    popupHost.popupContainer.className = 'workspace-poi-popup-host';
    popupHost.popupRoot.render(<DrawingInfoWindow drawing={popupDrawing} />);
    infoWindow.open({
      map: mapInstance,
      position: drawingPopup.position,
      shouldFocus: false,
    });

    return popupHost;
  }

  const popupPlace = allPlaces.find((place) => place.id === poiPopupPlaceId) ?? null;

  if (!popupPlace) {
    infoWindow.close();
    return { popupContainer, popupRoot };
  }

  const marker = markers.get(popupPlace.id);

  if (!marker) {
    infoWindow.close();
    return { popupContainer, popupRoot };
  }

  const popupHost = ensurePopupHost(infoWindow, popupContainer, popupRoot);

  popupHost.popupContainer.className = 'workspace-poi-popup-host';
  popupHost.popupRoot.render(<PinInfoWindow place={popupPlace} />);
  infoWindow.open({
    map: mapInstance,
    anchor: marker,
    shouldFocus: false,
  });

  return popupHost;
}
