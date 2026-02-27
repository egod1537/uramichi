import React from 'react'

const categoryIconMap = {
  default: '📍',
  airport: '✈️',
  station: '🚂',
  cafe: '☕',
  food: '🍜',
  photo: '📷',
  shopping: '🛍️',
  spot: '📍',
}

const transportIconMap = {
  flight: '✈️',
  train: '🚂',
  walk: '🚶',
  car: '🚗',
}

class LayerRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = { isMenuOpen: false }
  }

  getLayerPins = () => {
    return this.props.pins.filter((pinItem) => pinItem.layerId === this.props.layer.id)
  }

  getPinNameMap = (pins) => {
    return pins.reduce((pinNameMap, pinItem) => {
      pinNameMap[pinItem.id] = pinItem.name
      return pinNameMap
    }, {})
  }

  toggleMenu = () => {
    this.setState((previousState) => ({ isMenuOpen: !previousState.isMenuOpen }))
  }

  closeMenu = () => {
    this.setState({ isMenuOpen: false })
  }

  handleRename = () => {
    const nextLayerName = window.prompt('레이어 이름 변경', this.props.layer.name)
    if (nextLayerName?.trim()) {
      this.props.renameLayer(this.props.layer.id, nextLayerName.trim())
    }
    this.closeMenu()
  }

  handleRemove = () => {
    this.props.removeLayer(this.props.layer.id)
    this.closeMenu()
  }

  render() {
    const layerPins = this.getLayerPins()
    const pinNameMap = this.getPinNameMap(layerPins)

    return (
      <div className="border-b border-gray-200 py-2 last:border-b-0">
        <div className="flex items-center gap-2 px-2">
          <input
            type="checkbox"
            checked={this.props.layer.visible}
            onChange={() => this.props.toggleLayerVisibility(this.props.layer.id)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <button type="button" onClick={() => this.props.toggleLayerCollapse(this.props.layer.id)} className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-gray-500">{this.props.layer.collapsed ? '▸' : '▾'}</span>
            <span className="truncate text-left text-base text-gray-800">{this.props.layer.name}</span>
          </button>

          <div className="relative">
            <button type="button" onClick={this.toggleMenu} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="레이어 더보기">
              ⋮
            </button>
            {this.state.isMenuOpen && (
              <div className="absolute right-0 top-7 z-10 w-24 rounded border border-gray-200 bg-white py-1 shadow">
                <button type="button" onClick={this.handleRename} className="block w-full px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100">
                  이름 변경
                </button>
                <button type="button" onClick={this.handleRemove} className="block w-full px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100">
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {!this.props.layer.collapsed && (
          <div className="mt-2 space-y-1 pl-8 pr-2">
            {layerPins.map((pinItem, pinIndex) => {
              const nextPin = layerPins[pinIndex + 1]
              const routeItem = this.props.layer.routes.find(
                (routeData) => routeData.fromPinId === pinItem.id && routeData.toPinId === nextPin?.id,
              )
              return (
                <div key={pinItem.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => this.props.selectPin(pinItem.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span>{categoryIconMap[pinItem.category] ?? categoryIconMap.default}</span>
                    <span className="truncate">{pinItem.name}</span>
                  </button>

                  {routeItem && (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
                      <span>{transportIconMap[routeItem.transport] ?? transportIconMap.walk}</span>
                      <span className="truncate">{pinNameMap[routeItem.fromPinId]} → {pinNameMap[routeItem.toPinId]}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
}

export default LayerRow
