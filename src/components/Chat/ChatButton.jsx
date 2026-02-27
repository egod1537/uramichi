function ClaudeSparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 2.5l2.4 6.3 6.1 2.2-6.1 2.2-2.4 6.3-2.4-6.3-6.1-2.2 6.1-2.2L12 2.5z"
        fill="#CC785C"
      />
      <path d="M12 6.3l1.2 3.2 3.2 1.2-3.2 1.2-1.2 3.2-1.2-3.2-3.2-1.2 3.2-1.2L12 6.3z" fill="#F5E6D3" />
    </svg>
  )
}

function ChatButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A574] shadow-lg transition hover:scale-105 hover:bg-[#CC785C]"
      aria-label="AI 채팅 열기"
    >
      <ClaudeSparkleIcon />
    </button>
  )
}

export default ChatButton
