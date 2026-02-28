import React from 'react';
import useProjectStore from '../../stores/useProjectStore';

class Search extends React.Component {
  searchInputRef = React.createRef();

  componentDidMount() {
    if (!this.searchInputRef.current || !window.google?.maps?.places) return;

    this.placesAutocomplete = new window.google.maps.places.Autocomplete(
      this.searchInputRef.current,
      {
        fields: ['place_id', 'name', 'geometry', 'formatted_address', 'photos', 'rating'],
      },
    );

    this.placeChangedListener = this.placesAutocomplete.addListener('place_changed', () => {
      const selectedPlace = this.placesAutocomplete.getPlace();
      const selectedLatitude = selectedPlace?.geometry?.location?.lat?.();
      const selectedLongitude = selectedPlace?.geometry?.location?.lng?.();
      if (selectedLatitude === undefined || selectedLongitude === undefined) return;

      useProjectStore.getState().requestPoiFromSearch({
        placeId: selectedPlace.place_id || null,
        position: { lat: selectedLatitude, lng: selectedLongitude },
        name: selectedPlace.name || '',
        address: selectedPlace.formatted_address || '',
        rating: typeof selectedPlace.rating === 'number' ? selectedPlace.rating : null,
      });
    });
  }

  componentWillUnmount() {
    if (this.placeChangedListener) {
      window.google.maps.event.removeListener(this.placeChangedListener);
    }
  }

  render() {
    return (
      <input
        ref={this.searchInputRef}
        type="text"
        placeholder="Search in Google Maps"
        className="h-9 flex-1 rounded-sm border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      />
    );
  }
}

export default Search;
