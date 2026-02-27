import React from 'react'

class ToolButton extends React.Component {
  handleClick = () => {
    this.props.onClick(this.props.buttonKey)
  }

  render() {
    const baseClassName = 'flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm transition-colors'
    const activeClassName = this.props.isActive
      ? 'bg-blue-100 text-blue-600'
      : 'text-gray-600 hover:bg-gray-100'

    return (
      <button
        type="button"
        aria-label={this.props.label}
        disabled={this.props.isDisabled}
        onClick={this.handleClick}
        className={`${baseClassName} ${activeClassName} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span>{this.props.icon}</span>
      </button>
    )
  }
}

export default ToolButton
