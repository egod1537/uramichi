function ToolButton({ buttonKey, onClick, label, tooltip, shortcut, isDisabled, isActive, icon }) {
  const baseClassName = 'flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm transition-colors'
  const activeClassName = isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'

  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip || label}
      disabled={isDisabled}
      onClick={() => onClick(buttonKey)}
      className={`${baseClassName} ${activeClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span>{icon}</span>
      {shortcut && <span className="ml-1 text-[10px] font-semibold text-gray-400">{shortcut}</span>}
    </button>
  )
}

export default ToolButton
