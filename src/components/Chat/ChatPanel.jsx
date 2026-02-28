import React from 'react'
import { createPortal } from 'react-dom'
import ChatMessage from './ChatMessage'

class ChatPanel extends React.Component {
  constructor(props) {
    super(props)
    this.messageInputRef = React.createRef()
  }

  state = {
    messageList: [
      {
        id: 'welcome',
        role: 'assistant',
        text: '안녕하세요! 여행 계획을 도와드릴게요. 무엇을 해볼까요?',
      },
    ],
    draftMessage: '',
    isSubmitting: false,
  }


  componentDidMount() {
    if (this.props.isOpen) {
      this.focusMessageInput()
    }
  }

  componentDidUpdate(previousProps) {
    if (!previousProps.isOpen && this.props.isOpen) {
      this.focusMessageInput()
    }
  }

  focusMessageInput = () => {
    if (!this.messageInputRef.current) {
      return
    }

    this.messageInputRef.current.focus()
  }

  getPanelClassName() {
    return `fixed right-0 top-0 z-[70] flex h-screen w-[380px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${
      this.props.isOpen ? 'translate-x-0' : 'translate-x-full'
    }`
  }

  handleSendMessage = async () => {
    if (this.state.isSubmitting) return

    const trimmedMessage = this.state.draftMessage.trim()
    if (!trimmedMessage) return

    const createdAt = Date.now()
    const submittedMessage = {
      id: `${createdAt}-user`,
      role: 'user',
      text: trimmedMessage,
    }
    const pendingAssistantMessage = {
      id: `${createdAt}-assistant`,
      role: 'assistant',
      text: 'AI 응답 준비 중...',
    }

    this.setState((previousState) => ({
      messageList: [...previousState.messageList, submittedMessage, pendingAssistantMessage],
      draftMessage: '',
      isSubmitting: true,
    }))

    const historyMessageList = this.state.messageList
      .filter((messageItem) => messageItem.role === 'user' || messageItem.role === 'assistant')
      .map((messageItem) => ({ role: messageItem.role, text: messageItem.text }))
    const requestMessageList = [...historyMessageList, { role: 'user', text: trimmedMessage }]

    try {
      const response = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessageList }),
      })

      const responseBody = await response.json()
      const assistantText = response.ok
        ? responseBody?.text || '응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.'
        : responseBody?.error || 'AI 응답을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

      this.setState((previousState) => ({
        messageList: previousState.messageList.map((messageItem) => {
          if (messageItem.id !== pendingAssistantMessage.id) {
            return messageItem
          }

          return {
            ...messageItem,
            text: assistantText,
          }
        }),
        isSubmitting: false,
      }))
    } catch {
      this.setState((previousState) => ({
        messageList: previousState.messageList.map((messageItem) => {
          if (messageItem.id !== pendingAssistantMessage.id) {
            return messageItem
          }

          return {
            ...messageItem,
            text: '네트워크 문제로 응답을 받지 못했어요. 연결 상태를 확인해 주세요.',
          }
        }),
        isSubmitting: false,
      }))
    }
  }

  handleTextareaKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.handleSendMessage()
    }
  }

  handleDraftMessageChange = (event) => {
    this.setState({ draftMessage: event.target.value })
  }

  render() {
    const { isOpen, onClose } = this.props
    const panelElement = (
      <section className={this.getPanelClassName()} aria-hidden={!isOpen}>
        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">裏道 AI</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="채팅 닫기"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4">
          {this.state.messageList.map((messageItem) => (
            <ChatMessage key={messageItem.id} message={messageItem} />
          ))}
        </div>

        <div className="border-t border-gray-200 px-4 py-3">
          <div className="rounded-3xl border border-[#d6d6d6] bg-[#f6f6f4] px-4 pb-3 pt-3 shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
            <textarea
              ref={this.messageInputRef}
              value={this.state.draftMessage}
              onChange={this.handleDraftMessageChange}
              onKeyDown={this.handleTextareaKeyDown}
              placeholder="우즈지가 뭐냐 질문을 입력하세요"
              className="min-h-[28px] w-full resize-none bg-transparent text-[15px] text-gray-800 outline-none placeholder:text-gray-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={this.handleSendMessage}
                disabled={this.state.isSubmitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C86F42] text-lg text-white transition hover:bg-[#ad5e37] disabled:cursor-not-allowed disabled:bg-[#d9a186]"
                aria-label={this.state.isSubmitting ? '전송 중' : '전송'}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </section>
    )

    return createPortal(panelElement, document.body)
  }
}

export default ChatPanel
