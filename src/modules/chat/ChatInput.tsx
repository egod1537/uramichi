import React from 'react';
import type { ChatToolOptionId, ChatToolOptions } from '../../models/Chat';
import { PencilIcon, SendIcon } from '../../components/icons/WorkspaceIcons';

interface ChatInputProps {
  onSubmit: (value: string) => void;
  onToggleToolOption: (optionId: ChatToolOptionId) => void;
  toolOptions: ChatToolOptions;
  disabled?: boolean;
}

interface ChatInputState {
  inputValue: string;
}

class ChatInput extends React.Component<ChatInputProps, ChatInputState> {
  static defaultProps = {};

  private textareaRef = React.createRef<HTMLTextAreaElement>();

  constructor(props: ChatInputProps) {
    super(props);
    this.state = {
      inputValue: '',
    };
  }

  focusInput = () => {
    this.textareaRef.current?.focus();
  };

  setInputValue = (inputValue: string, focusInput = false) => {
    this.setState(
      {
        inputValue,
      },
      () => {
        if (focusInput) {
          this.focusInput();
        }
      },
    );
  };

  private handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({
      inputValue: event.target.value,
    });
  };

  private submitInputValue() {
    if (this.props.disabled) {
      return;
    }

    const { inputValue } = this.state;

    if (!inputValue.trim()) {
      return;
    }

    this.props.onSubmit(inputValue);
    this.setState({
      inputValue: '',
    });
  }

  private handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.submitInputValue();
  };

  private handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    const nativeEvent = event.nativeEvent;

    if (nativeEvent.isComposing || nativeEvent.keyCode === 229) {
      return;
    }

    event.preventDefault();
    this.submitInputValue();
  };

  private renderToolOptions() {
    const { toolOptions } = this.props;

    return (
      <div className="workspace-chat-tool-options" role="group" aria-label="채팅 도구 옵션">
        <button
          type="button"
          className="workspace-chat-tool-option workspace-chat-tool-option--inline"
          onClick={() => this.props.onToggleToolOption('planEdit')}
          aria-pressed={toolOptions.planEdit}
        >
          <span className="workspace-chat-tool-option-copy">
            <span className="workspace-chat-tool-option-icon">
              <PencilIcon />
            </span>
            <span className="workspace-chat-tool-option-label">여행 계획 수정</span>
          </span>
          <span
            className={`workspace-chat-tool-switch ${
              toolOptions.planEdit ? 'workspace-chat-tool-switch--checked' : ''
            }`}
            aria-hidden="true"
          >
            <span className="workspace-chat-tool-switch-knob" />
          </span>
        </button>
      </div>
    );
  }

  render() {
    const { disabled = false } = this.props;
    const { inputValue } = this.state;

    return (
      <div className="workspace-chat-form-shell">
        <form onSubmit={this.handleSubmit} className="workspace-chat-form">
          {this.renderToolOptions()}

          <textarea
            ref={this.textareaRef}
            value={inputValue}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            disabled={disabled}
            placeholder="예: 2일차 오전에 아키하바라 추가하고 경로도 다시 계산해줘"
            className="workspace-chat-input"
            rows={3}
          />

          <div className="workspace-chat-form-actions">
            <button type="submit" className="workspace-chat-submit-button" disabled={disabled}>
              <SendIcon />
              <span>{disabled ? '응답 생성 중' : '보내기'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default ChatInput;
