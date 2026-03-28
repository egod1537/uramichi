import { GeminiIcon } from '../../components/icons/WorkspaceIcons';
import type { ChatMessageModel } from '../../models/Chat';

interface ChatMessageProps {
  message: ChatMessageModel;
  isPending?: boolean;
}

export default function ChatMessage({
  message,
  isPending = false,
}: ChatMessageProps) {
  return (
    <div
      className={`workspace-chat-message ${
        message.role === 'user'
          ? 'workspace-chat-message--user'
          : 'workspace-chat-message--assistant'
      } ${
        isPending ? 'workspace-chat-message--pending' : ''
      }`}
    >
      <p className="workspace-chat-message-role">
        {message.role === 'user' ? 'You' : 'AI Agent'}
      </p>
      {isPending ? (
        <div className="workspace-chat-loading" aria-label="AI 응답 생성 중" role="status">
          <span className="workspace-chat-loading-icon" aria-hidden="true">
            <span className="workspace-chat-loading-orbit" />
            <GeminiIcon />
          </span>
          <span className="workspace-chat-loading-dots" aria-hidden="true">
            <span className="workspace-chat-loading-dot" />
            <span className="workspace-chat-loading-dot" />
            <span className="workspace-chat-loading-dot" />
          </span>
        </div>
      ) : (
        <p className="workspace-chat-message-body">{message.content}</p>
      )}
    </div>
  );
}
