import React from 'react'

const formatLastEdited = (isoDateTime) => {
  const dateInstance = new Date(isoDateTime)
  return dateInstance.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

class MapPanel extends React.Component {
  constructor(props) {
    super(props)
    this.state = { isEditingTitle: false, draftTitle: props.mapTitle }
  }

  componentDidUpdate(previousProps) {
    if (!this.state.isEditingTitle && previousProps.mapTitle !== this.props.mapTitle) {
      this.setState({ draftTitle: this.props.mapTitle })
    }
  }

  handleTitleSave = () => {
    const trimmedTitle = this.state.draftTitle.trim()
    this.props.setMapTitle(trimmedTitle || '제목없는 지도')
    this.setState({ isEditingTitle: false })
  }

  handleEditStart = () => {
    this.setState({ isEditingTitle: true, draftTitle: this.props.mapTitle })
  }

  handleTitleInputChange = (event) => {
    this.setState({ draftTitle: event.target.value })
  }

  handleTitleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.handleTitleSave()
    }
    if (event.key === 'Escape') {
      this.setState({ isEditingTitle: false, draftTitle: this.props.mapTitle })
    }
  }

  render() {
    return (
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          {this.state.isEditingTitle ? (
            <input
              value={this.state.draftTitle}
              onChange={this.handleTitleInputChange}
              onBlur={this.handleTitleSave}
              onKeyDown={this.handleTitleInputKeyDown}
              className="w-full rounded border border-blue-200 px-2 py-1 text-xl font-semibold text-gray-800 outline-none ring-blue-300 focus:ring"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={this.handleEditStart}
              className="truncate text-left text-xl font-semibold text-gray-800"
            >
              {this.props.mapTitle}
            </button>
          )}
          <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="지도 옵션">
            ⋮
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">{formatLastEdited(this.props.lastEditedAt)} 마지막으로 수정됨</p>
        <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3 text-sm">
          <button type="button" onClick={this.props.addLayer} className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">
            레이어 추가
          </button>
          <button type="button" className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">공유</button>
          <button type="button" className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">미리보기</button>
        </div>
      </div>
    )
  }
}

export default MapPanel
