import React from 'react'

const mockMaps = [
  { id: 'map-1', title: '제목없는 지도', lastEditedAt: '2026. 2. 27.', visibility: 'private' },
  { id: 'map-2', title: '일본여행지도', lastEditedAt: '2026. 2. 26.', visibility: 'public' },
  { id: 'map-3', title: '2025.04.05 ~ 2025.04.07', lastEditedAt: '2026. 2. 22.', visibility: 'public' },
  { id: 'map-4', title: '2025.05.10 ~ 2025.05.14', lastEditedAt: '2026. 2. 22.', visibility: 'public' },
  { id: 'map-5', title: '도쿄 에어비앤비 후보지', lastEditedAt: '2026. 2. 16.', visibility: 'private' },
  { id: 'map-6', title: '8/28 ~ 9/1 ~도쿄 여행~', lastEditedAt: '2026. 2. 14.', visibility: 'public' },
  { id: 'map-7', title: '숭실대학교 일본캠퍼스', lastEditedAt: '2026. 2. 14.', visibility: 'public' },
  { id: 'map-8', title: '도쿄 여행', lastEditedAt: '2025. 10. 19.', visibility: 'public' },
]

class MyMapsModal extends React.Component {
  state = {
    searchKeyword: '',
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeydown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleWindowKeydown)
  }

  handleWindowKeydown = (event) => {
    if (!this.props.isOpen) {
      return
    }
    if (event.key === 'Escape') {
      this.props.onClose()
    }
  }

  handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      this.props.onClose()
    }
  }

  handleSearchChange = (event) => {
    this.setState({ searchKeyword: event.target.value })
  }

  getFilteredMaps() {
    const normalizedKeyword = this.state.searchKeyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return mockMaps
    }

    return mockMaps.filter((mapItem) => mapItem.title.toLowerCase().includes(normalizedKeyword))
  }

  renderMapCard(mapItem) {
    const visibilityIcon = mapItem.visibility === 'private' ? '🔒' : '🌐'

    return (
      <button
        key={mapItem.id}
        type="button"
        className="overflow-hidden rounded-md border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md"
      >
        <div className="relative h-36 w-full bg-gradient-to-br from-[#7ec9da] via-[#91d2df] to-[#c5e6ef]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.4),transparent_50%),radial-gradient(circle_at_75%_70%,rgba(255,255,255,0.32),transparent_48%)]" />
        </div>
        <div className="space-y-1 bg-[#f5f5f5] px-3 py-3">
          <p className="truncate text-lg font-medium text-gray-900">{mapItem.title}</p>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <span>{mapItem.lastEditedAt}</span>
            <span>{visibilityIcon}</span>
          </p>
        </div>
      </button>
    )
  }

  render() {
    if (!this.props.isOpen) {
      return null
    }

    const filteredMaps = this.getFilteredMaps()

    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-6 py-10"
        onMouseDown={this.handleOverlayMouseDown}
      >
        <div className="flex h-[85vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">내 지도 목록</h2>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">소유한 지도</span>
            </div>
            <button
              type="button"
              onClick={this.props.onClose}
              className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className="border-b border-gray-100 px-5 py-3">
            <input
              type="text"
              value={this.state.searchKeyword}
              onChange={this.handleSearchChange}
              placeholder="지도 검색"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {filteredMaps.length > 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{filteredMaps.map((mapItem) => this.renderMapCard(mapItem))}</div>}
            {filteredMaps.length === 0 && (
              <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default MyMapsModal
