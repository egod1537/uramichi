import { GeminiIcon } from '../../components/icons/WorkspaceIcons';

interface ChatFabButtonProps {
  onClick: () => void;
}

function ChatFabButton({ onClick }: ChatFabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="workspace-chat-fab"
      aria-label="AI 에이전트 열기"
      title="AI 에이전트"
    >
      <span className="workspace-chat-fab-icon">
        <GeminiIcon />
      </span>
    </button>
  );
}

export default ChatFabButton;
