import React from 'react';
import type { ChatToolOptionId } from '../../models/Chat';
import { eventBus } from '../../services/EventBus';
import { chatStore, initialChatMessages } from '../../services/ChatStore';
import { planStore } from '../../services/PlanStore';
import { getAiAgentModelName, streamAiPlannerReply } from '../../services/AiAgentService';
import {
  appendAssistantChunk,
  createChatSubmission,
  resolveAssistantError,
  resolveAssistantReply,
} from '../../services/ChatConversationService';
import ChatFabButton from './ChatFabButton';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessageLog from './ChatMessageLog';
import ChatQuickPrompts from './ChatQuickPrompts';
import { pendingAssistantMessage, quickPrompts } from './chatConfig';
import { isEditableTarget } from './chatDom';
import type {
  ChatComposeRequest,
  ChatPanelProps,
  ChatPanelState,
} from './ChatPanel.types';

class ChatPanel extends React.Component<ChatPanelProps, ChatPanelState> {
  static defaultProps = {};

  private inputRef = React.createRef<ChatInput>();

  private logRef = React.createRef<HTMLDivElement>();

  private unsubscribeComposeEvent: (() => void) | null = null;

  private isUnmounted = false;

  private readonly modelName = getAiAgentModelName();

  constructor(props: ChatPanelProps) {
    super(props);
    const chatSnapshot = chatStore.getSnapshot();
    this.state = {
      connectionState: chatSnapshot.connectionState,
      isSending: chatSnapshot.isSending,
      isOpen: chatSnapshot.isOpen,
      messages: chatSnapshot.messages,
      toolOptions: chatSnapshot.toolOptions,
    };
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleWindowKeyDown);
    this.unsubscribeComposeEvent = eventBus.on('chat:compose', this.handleComposeRequest);
  }

  componentDidUpdate(prevProps: ChatPanelProps, prevState: ChatPanelState) {
    const previousLastMessage = prevState.messages[prevState.messages.length - 1];
    const nextLastMessage = this.state.messages[this.state.messages.length - 1];

    if (
      prevState.connectionState !== this.state.connectionState ||
      prevState.isOpen !== this.state.isOpen ||
      prevState.isSending !== this.state.isSending ||
      prevState.messages !== this.state.messages ||
      prevState.toolOptions !== this.state.toolOptions
    ) {
      chatStore.replaceSnapshot({
        connectionState: this.state.connectionState,
        isOpen: this.state.isOpen,
        isSending: this.state.isSending,
        messages: this.state.messages,
        toolOptions: this.state.toolOptions,
      });
    }

    if (
      prevState.isOpen !== this.state.isOpen ||
      prevState.messages.length !== this.state.messages.length ||
      previousLastMessage?.content !== nextLastMessage?.content
    ) {
      this.scrollLogToBottom();
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    this.unsubscribeComposeEvent?.();
  }

  private handleToggle = () => {
    if (this.state.isOpen) {
      this.closePanel();
      return;
    }

    this.openPanel();
  };

  private handleWindowKeyDown = (event: KeyboardEvent) => {
    if (
      event.key !== 'Tab' ||
      !event.shiftKey ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    this.handleToggle();
  };

  private handlePromptSubmit = async (rawValue: string) => {
    const content = rawValue.trim();

    if (!content || this.state.isSending) {
      return;
    }

    const submission = createChatSubmission({
      baseMessageCount: initialChatMessages.length,
      content,
      conversationSummary: chatStore.getSnapshot().summary,
      messages: this.state.messages,
      pendingMessage: pendingAssistantMessage,
      snapshot: planStore.getSnapshot(),
      toolOptions: this.state.toolOptions,
    });

    this.setState({
      connectionState: 'sending',
      isSending: true,
      messages: submission.nextMessages,
    });

    try {
      const assistantReply = await streamAiPlannerReply(submission.request, (chunk) => {
        if (this.isUnmounted) {
          return;
        }

        this.setState((currentState) => ({
          messages: appendAssistantChunk(
            currentState.messages,
            submission.assistantMessageId,
            pendingAssistantMessage,
            chunk,
          ),
        }));
      });

      if (this.isUnmounted) {
        return;
      }

      this.setState((currentState) => ({
        connectionState: 'ready',
        isSending: false,
        messages: resolveAssistantReply(
          currentState.messages,
          submission.assistantMessageId,
          assistantReply,
        ),
      }));
    } catch (error) {
      if (this.isUnmounted) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

      this.setState((currentState) => ({
        connectionState: 'error',
        isSending: false,
        messages: resolveAssistantError(
          currentState.messages,
          submission.assistantMessageId,
          errorMessage,
        ),
      }));
    }
  };

  private handleToolOptionToggle = (optionId: ChatToolOptionId) => {
    this.setState((currentState) => ({
      toolOptions: {
        ...currentState.toolOptions,
        [optionId]: !currentState.toolOptions[optionId],
      },
    }));
  };

  private handleComposeRequest = ({ enablePlanEdit = false, message }: ChatComposeRequest) => {
    this.setState(
      (currentState) => ({
        isOpen: true,
        toolOptions: enablePlanEdit
          ? {
              ...currentState.toolOptions,
              planEdit: true,
            }
          : currentState.toolOptions,
      }),
      () => {
        window.requestAnimationFrame(() => {
          this.inputRef.current?.setInputValue(message, true);
        });
      },
    );
  };

  private openPanel() {
    this.setState(
      {
        isOpen: true,
      },
      () => {
        window.requestAnimationFrame(() => {
          this.inputRef.current?.focusInput();
        });
      },
    );
  }

  private closePanel() {
    this.setState({
      isOpen: false,
    });
  }

  private scrollLogToBottom() {
    const logElement = this.logRef.current;

    if (!logElement) {
      return;
    }

    logElement.scrollTop = logElement.scrollHeight;
  }

  private renderOpen() {
    const { connectionState, isSending, messages, toolOptions } = this.state;

    return (
      <section className="workspace-chat-panel">
        <ChatHeader
          connectionState={connectionState}
          modelName={this.modelName}
          onClose={this.handleToggle}
        />

        <ChatMessageLog
          logRef={this.logRef}
          messages={messages}
          pendingMessage={pendingAssistantMessage}
        />

        <ChatQuickPrompts
          disabled={isSending}
          prompts={quickPrompts}
          onPromptClick={this.handlePromptSubmit}
        />

        <ChatInput
          ref={this.inputRef}
          disabled={isSending}
          onSubmit={this.handlePromptSubmit}
          onToggleToolOption={this.handleToolOptionToggle}
          toolOptions={toolOptions}
        />
      </section>
    );
  }

  render() {
    const { isOpen } = this.state;

    return (
      <div className={`workspace-chat-anchor ${isOpen ? 'workspace-chat-anchor--open' : ''}`}>
        {isOpen ? this.renderOpen() : <ChatFabButton onClick={this.handleToggle} />}
      </div>
    );
  }
}

export default ChatPanel;
