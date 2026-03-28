import { AiChatIcon, CloseIcon } from '../../components/icons/WorkspaceIcons';
import type { ChatConnectionState } from '../../models/Chat';
import { buildChatStatusLabel } from './chatConfig';

interface ChatHeaderProps {
  connectionState: ChatConnectionState;
  modelName: string;
  onClose: () => void;
}

function ChatHeader({ connectionState, modelName, onClose }: ChatHeaderProps) {
  return (
    <header className="workspace-chat-header">
      <div className="workspace-chat-title-group">
        <div className="workspace-chat-badge">
          <AiChatIcon />
        </div>
        <div>
          <p className="workspace-chat-eyebrow">AI Agent</p>
          <h2 className="workspace-chat-title">여행 플래너 채팅</h2>
        </div>
      </div>

      <div className="workspace-chat-header-actions">
        <span className={`workspace-chat-status workspace-chat-status--${connectionState}`}>
          {buildChatStatusLabel(connectionState, modelName)}
        </span>
        <button type="button" onClick={onClose} className="workspace-chat-close-button">
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;
