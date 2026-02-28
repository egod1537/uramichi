function ChatButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 hover:bg-gray-100"
      aria-label="AI 채팅 열기"
    >
      <img src="/claude.svg" alt="Claude" className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}

export default ChatButton;
