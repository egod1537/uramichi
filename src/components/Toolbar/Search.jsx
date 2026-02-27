import React from 'react'

class Search extends React.Component {
  constructor(props) {
    super(props)
    this.searchInputRef = React.createRef()
    this.placeChangedListener = null
  }

  componentDidMount() {
    if (!this.searchInputRef.current || !window.google?.maps?.places) return

    this.placesAutocomplete = new window.google.maps.places.Autocomplete(this.searchInputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address', 'photos'],
    })

    this.placeChangedListener = this.placesAutocomplete.addListener('place_changed', () => {
      this.placesAutocomplete.getPlace()
    })
  }

  componentWillUnmount() {
    if (this.placeChangedListener) {
      window.google.maps.event.removeListener(this.placeChangedListener)
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
    )
  }
}

export default Search
