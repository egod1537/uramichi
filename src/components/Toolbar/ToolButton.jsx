export default function ToolButton({
  buttonKey,
  label,
  icon,
  isActive,
  isDisabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(buttonKey)}
      disabled={isDisabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-1.5 text-base transition ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
      title={label}
      aria-label={label}
    >
      <span>{icon}</span>
    </button>
  )
}
