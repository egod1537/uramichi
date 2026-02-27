import LayerRow from './LayerRow'
import useProjectStore from '../../stores/useProjectStore'

function LayerPanel() {
  const layers = useProjectStore((state) => state.layers)

  if (!layers.length) {
    return <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-500">레이어가 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {layers.map((layerItem) => (
        <LayerRow key={layerItem.id} layer={layerItem} />
      ))}
    </div>
  )
}

export default LayerPanel
