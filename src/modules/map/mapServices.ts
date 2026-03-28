interface CreateMapServicesParams {
  center: { lat: number; lng: number };
  container: HTMLDivElement;
  maps: typeof google.maps;
  onInfoWindowClose: () => void;
  onMapClick: (event: google.maps.MapMouseEvent) => void;
  zoom: number;
}

interface MapServices {
  autocompleteService: google.maps.places.AutocompleteService;
  directionsService: google.maps.DirectionsService;
  infoWindow: google.maps.InfoWindow;
  mapInstance: google.maps.Map;
  placesService: google.maps.places.PlacesService;
}

export function createMapServices({
  center,
  container,
  maps,
  onInfoWindowClose,
  onMapClick,
  zoom,
}: CreateMapServicesParams): MapServices {
  const mapInstance = new maps.Map(container, {
    center,
    zoom,
    disableDefaultUI: true,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: false,
    clickableIcons: true,
    gestureHandling: 'greedy',
  });

  const placesService = new maps.places.PlacesService(mapInstance);
  const autocompleteService = new maps.places.AutocompleteService();
  const directionsService = new maps.DirectionsService();
  const infoWindow = new maps.InfoWindow({
    ariaLabel: 'POI details',
  });

  infoWindow.addListener('closeclick', onInfoWindowClose);
  mapInstance.addListener('click', onMapClick);

  return {
    autocompleteService,
    directionsService,
    infoWindow,
    mapInstance,
    placesService,
  };
}
