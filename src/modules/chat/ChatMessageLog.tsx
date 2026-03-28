import React from 'react';
import type { ChatMessageModel } from '../../models/Chat';
import ChatMessage from './ChatMessage';

interface ChatMessageLogProps {
  logRef: React.RefObject<HTMLDivElement | null>;
  messages: ChatMessageModel[];
  pendingMessage: string;
}

function ChatMessageLog({ logRef, messages, pendingMessage }: ChatMessageLogProps) {
  return (
    <div ref={logRef} className="workspace-chat-log">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          isPending={message.content === pendingMessage}
        />
      ))}
    </div>
  );
}

export default ChatMessageLog;
