import { useMemo, useState } from 'react'
import ChatMessage from './ChatMessage'

function ChatPanel({ isOpen, onClose }) {
  const [messageList, setMessageList] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: '안녕하세요! 여행 계획을 도와드릴게요. 무엇을 해볼까요?',
    },
  ])
  const [draftMessage, setDraftMessage] = useState('')

  const panelClassName = useMemo(
    () =>
      `absolute right-0 top-0 z-50 flex h-full w-[380px] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`,
    [isOpen],
  )

  const handleSendMessage = () => {
    const trimmedMessage = draftMessage.trim()
    if (!trimmedMessage) return

    const submittedMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmedMessage,
    }
    const pendingAssistantMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      text: 'AI 응답 준비 중...',
    }

    setMessageList((previousMessages) => [...previousMessages, submittedMessage, pendingAssistantMessage])
    setDraftMessage('')
  }

  const handleTextareaKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <section className={panelClassName} aria-hidden={!isOpen}>
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
        {messageList.map((messageItem) => (
          <ChatMessage key={messageItem.id} message={messageItem} />
        ))}
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="메시지를 입력하세요"
            className="max-h-32 min-h-[44px] flex-1 resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-[#D4A574] focus:ring-2"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="rounded-md bg-[#CC785C] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#b1654d]"
          >
            전송
          </button>
        </div>
      </div>
    </section>
  )
}

export default ChatPanel
