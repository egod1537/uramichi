import React from 'react'
import LayerRow from './LayerRow'

class LayerPanel extends React.Component {
  render() {
    if (!this.props.layers.length) {
      return <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
    }

    return (
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {this.props.layers.map((layerItem) => (
          <LayerRow
            key={layerItem.id}
            layer={layerItem}
            pins={this.props.pins}
            toggleLayerVisibility={this.props.toggleLayerVisibility}
            toggleLayerCollapse={this.props.toggleLayerCollapse}
            renameLayer={this.props.renameLayer}
            removeLayer={this.props.removeLayer}
            selectPin={this.props.selectPin}
          />
        ))}
      </div>
    )
  }
}

export default LayerPanel
