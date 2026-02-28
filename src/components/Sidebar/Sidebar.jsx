import React from 'react'
import LayerPanel from './LayerPanel'
import MapPanel from './MapPanel'
import useEditorStore from '../../stores/useEditorStore'
import withStore from '../../utils/withStore'

class Sidebar extends React.Component {
  handleOpenSidebar = () => {
    this.props.editorStore.setSidebarOpen(true)
  }

  handleCloseSidebar = () => {
    this.props.editorStore.setSidebarOpen(false)
  }

  render() {
    const { sidebarOpen } = this.props.editorStore

    if (!sidebarOpen) {
      return (
        <button
          type="button"
          onClick={this.handleOpenSidebar}
          className="absolute left-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow hover:bg-gray-50"
          aria-label="패널 열기"
        >
          <img src="/svg/sidebar-open-menu.svg" alt="" aria-hidden="true" className="h-5 w-5" />
        </button>
      )
    }

    return (
      <aside className="absolute left-4 top-4 z-20 flex h-[calc(100vh-2rem)] w-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-end gap-1 border-b border-gray-200 px-2 py-1">
          <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="사이드바 옵션">
            ⋮
          </button>
          <button
            type="button"
            onClick={this.handleCloseSidebar}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            aria-label="패널 닫기"
          >
            <img src="/svg/sidebar-close.svg" alt="" aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <MapPanel />
        <LayerPanel />
      </aside>
    )
  }
}

export default withStore(Sidebar, { editorStore: useEditorStore })
