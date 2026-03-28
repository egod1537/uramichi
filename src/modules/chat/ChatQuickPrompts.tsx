interface ChatQuickPromptsProps {
  disabled?: boolean;
  prompts: string[];
  onPromptClick: (prompt: string) => void;
}

function ChatQuickPrompts({
  disabled = false,
  prompts,
  onPromptClick,
}: ChatQuickPromptsProps) {
  return (
    <div className="workspace-chat-prompts">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPromptClick(prompt)}
          className="workspace-chat-prompt"
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export default ChatQuickPrompts;
