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
      className={`flex h-9 min-w-9 items-center justify-center rounded-sm border px-2 text-base transition ${
        isActive
          ? 'border-blue-300 bg-blue-50 text-blue-600'
          : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700'
      } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
      title={label}
      aria-label={label}
    >
      <span>{icon}</span>
    </button>
  )
}
