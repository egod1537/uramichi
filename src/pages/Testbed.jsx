import Map from '../components/Map/Map';
import Toolbar from '../components/Toolbar/Toolbar';
import Search from '../components/Toolbar/Search';
import Sidebar from '../components/Sidebar/Sidebar';
import MapPanel from '../components/Sidebar/MapPanel';
import LayerPanel from '../components/Sidebar/LayerPanel';
import ColorPalette from '../components/common/ColorPalette';
import useEditorStore from '../stores/useEditorStore';

const componentLabelMap = {
  map: 'Map',
  toolbar: 'Toolbar',
  search: 'Search',
  sidebar: 'Sidebar',
  mapPanel: 'MapPanel',
  layerPanel: 'LayerPanel',
  colorPalette: 'ColorPalette',
};

function Testbed({ currentMode, historyIndex, historyLength }) {
  const selectedComponentKey = useEditorStore((state) => state.testbedSelectedComponentKey);
  const setSelectedComponentKey = useEditorStore((state) => state.setTestbedSelectedComponentKey);

  if (!selectedComponentKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-xl font-semibold">Component Testbed</h1>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(componentLabelMap).map(([componentKey, componentLabel]) => (
              <button
                key={componentKey}
                type="button"
                onClick={() => setSelectedComponentKey(componentKey)}
                className="rounded border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {componentLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedComponentKey(null)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          뒤로가기
        </button>
        <h1 className="text-lg font-semibold text-slate-800">
          {componentLabelMap[selectedComponentKey]}
        </h1>
      </div>

      <div className="relative min-h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-white">
        {selectedComponentKey === 'map' && <Map />}
        {selectedComponentKey === 'toolbar' && (
          <Toolbar
            currentMode={currentMode}
            historyIndex={historyIndex}
            historyLength={historyLength}
          />
        )}
        {selectedComponentKey === 'search' && (
          <div className="p-4">
            <Search />
          </div>
        )}
        {selectedComponentKey === 'sidebar' && <Sidebar />}
        {selectedComponentKey === 'mapPanel' && <MapPanel />}
        {selectedComponentKey === 'layerPanel' && <LayerPanel />}
        {selectedComponentKey === 'colorPalette' && (
          <div className="p-4">
            <ColorPalette />
          </div>
        )}
      </div>
    </div>
  );
}

export default Testbed;
