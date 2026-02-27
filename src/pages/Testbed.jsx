import React from 'react'
import Map from '../components/Map/Map'
import Toolbar from '../components/Toolbar/Toolbar'
import Search from '../components/Toolbar/Search'
import Sidebar from '../components/Sidebar/Sidebar'
import MapPanel from '../components/Sidebar/MapPanel'
import LayerPanel from '../components/Sidebar/LayerPanel'

const componentLabelMap = {
  map: 'Map',
  toolbar: 'Toolbar',
  search: 'Search',
  sidebar: 'Sidebar',
  mapPanel: 'MapPanel',
  layerPanel: 'LayerPanel',
}

class Testbed extends React.Component {
  constructor(props) {
    super(props)
    this.state = { selectedComponentKey: null }
  }

  selectComponent = (selectedComponentKey) => {
    this.setState({ selectedComponentKey })
  }

  resetSelectedComponent = () => {
    this.setState({ selectedComponentKey: null })
  }

  renderComponentList() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-xl font-semibold">Component Testbed</h1>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(componentLabelMap).map(([componentKey, componentLabel]) => (
              <button
                key={componentKey}
                type="button"
                onClick={() => this.selectComponent(componentKey)}
                className="rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {componentLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  renderSelectedComponent() {
    const selectedComponentLabel = componentLabelMap[this.state.selectedComponentKey]

    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={this.resetSelectedComponent}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            뒤로가기
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{selectedComponentLabel}</h1>
        </div>

        <div className="relative min-h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-white">
          {this.renderSelectedComponentContent()}
        </div>
      </div>
    )
  }

  renderSelectedComponentContent() {
    const mapProps = {
      currentMode: this.props.currentMode,
      markers: this.props.markers,
      linePath: this.props.linePath,
      routePaths: this.props.routePaths,
      measurePath: this.props.measurePath,
      routeDraft: this.props.routeDraft,
      pins: this.props.pins,
      layers: this.props.layers,
      selectedPinId: this.props.selectedPinId,
      addMarker: this.props.addMarker,
      appendLinePoint: this.props.appendLinePoint,
      appendMeasurePoint: this.props.appendMeasurePoint,
      setRouteStart: this.props.setRouteStart,
      commitRoutePath: this.props.commitRoutePath,
      selectPin: this.props.selectPin,
    }

    const sidebarProps = {
      layers: this.props.layers,
      pins: this.props.pins,
      mapTitle: this.props.mapTitle,
      lastEditedAt: this.props.lastEditedAt,
      addLayer: this.props.addLayer,
      setMapTitle: this.props.setMapTitle,
      toggleLayerVisibility: this.props.toggleLayerVisibility,
      toggleLayerCollapse: this.props.toggleLayerCollapse,
      renameLayer: this.props.renameLayer,
      removeLayer: this.props.removeLayer,
      selectPin: this.props.selectPin,
    }

    const toolbarProps = {
      currentMode: this.props.currentMode,
      historyIndex: this.props.historyIndex,
      historyLength: this.props.historyLength,
      isShortcutModalOpen: this.props.isShortcutModalOpen,
      setMode: this.props.setMode,
      resetToSelectMode: this.props.resetToSelectMode,
      undo: this.props.undo,
      redo: this.props.redo,
      setShortcutModalOpen: this.props.setShortcutModalOpen,
    }

    if (this.state.selectedComponentKey === 'map') return <Map {...mapProps} />
    if (this.state.selectedComponentKey === 'toolbar') return <Toolbar {...toolbarProps} />
    if (this.state.selectedComponentKey === 'search') return <div className="p-4"><Search /></div>
    if (this.state.selectedComponentKey === 'sidebar') return <Sidebar {...sidebarProps} />
    if (this.state.selectedComponentKey === 'mapPanel') return <MapPanel {...sidebarProps} />
    if (this.state.selectedComponentKey === 'layerPanel') return <LayerPanel {...sidebarProps} />

    return null
  }

  render() {
    if (!this.state.selectedComponentKey) {
      return this.renderComponentList()
    }

    return this.renderSelectedComponent()
  }
}

export default Testbed
