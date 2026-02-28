import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noreferrer"
                className={`underline ${isUser ? 'text-white' : 'text-blue-700'}`}
              />
            ),
            code: ({ className, children, ...props }) => {
              const isBlock = className?.includes('language-')

              if (isBlock) {
                return (
                  <code
                    {...props}
                    className={`${className} mt-2 block overflow-x-auto rounded-lg px-2 py-1 text-xs`}
                  >
                    {children}
                  </code>
                )
              }

              return (
                <code
                  {...props}
                  className={`rounded px-1 py-0.5 text-xs ${isUser ? 'bg-blue-400' : 'bg-gray-200'}`}
                >
                  {children}
                </code>
              )
            },
            ul: ({ ...props }) => <ul {...props} className="ml-5 list-disc" />,
            ol: ({ ...props }) => <ol {...props} className="ml-5 list-decimal" />,
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  )
}

export default ChatMessage
