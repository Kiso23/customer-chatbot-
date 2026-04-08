import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Stable session ID per browser tab
const SESSION_ID = `session_${Date.now()}`

const QUICK_REPLIES = [
  'Where is my order?',
  'How do I return a product?',
  'Do you offer refunds?',
  'How do I reset my password?',
  'What are your working hours?',
]

function SkeletonBubble() {
  return (
    <div className="flex items-end gap-2">
      <span className="text-2xl">🤖</span>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow w-48 flex flex-col gap-2">
        <motion.div
          className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
        <motion.div
          className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-3/4"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
        />
      </div>
    </div>
  )
}

function FeedbackButtons({ chatId, onFeedback }) {
  const [voted, setVoted] = useState(null)
  const vote = async (val) => {
    if (voted) return
    setVoted(val)
    onFeedback(val)
    await axios.post(`/api/chat/feedback/${chatId}`, { feedback: val })
  }
  return (
    <div className="flex gap-1 mt-1 ml-9">
      <button
        onClick={() => vote(1)}
        className={`text-sm px-2 py-0.5 rounded-full border transition-colors
          ${voted === 1 ? 'bg-green-100 border-green-400 text-green-700' : 'border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'}`}
      >👍</button>
      <button
        onClick={() => vote(-1)}
        className={`text-sm px-2 py-0.5 rounded-full border transition-colors
          ${voted === -1 ? 'bg-red-100 border-red-400 text-red-700' : 'border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-600'}`}
      >👎</button>
    </div>
  )
}

function Message({ msg, onFeedback }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-2xl">{isUser ? '🧑' : '🤖'}</span>
        <div className={`max-w-[75%] sm:max-w-[65%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow
          ${isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
          }`}
        >
          {msg.content}
          {!isUser && msg.source && (
            <span className={`block mt-1 text-xs opacity-60 ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
              {msg.source === 'faq' ? '📚 FAQ' : '🧠 AI'}
            </span>
          )}
        </div>
      </div>
      {!isUser && msg.id && (
        <FeedbackButtons chatId={msg.id} onFeedback={onFeedback} />
      )}
    </motion.div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! How can I help you today? 😊' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setShowQuick(false)
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const { data } = await axios.post('/api/chat', { message: msg, session_id: SESSION_ID })
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        source: data.source,
        id: data.id,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const clearChat = async () => {
    await axios.delete(`/api/chat/session/${SESSION_ID}`)
    setMessages([{ role: 'assistant', content: 'Hi! How can I help you today? 😊' }])
    setShowQuick(true)
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 sm:px-6 py-3 shadow flex items-center gap-3">
        <span className="text-3xl">🤖</span>
        <div className="flex-1">
          <h1 className="font-semibold text-base sm:text-lg leading-tight">AI Support Assistant</h1>
          <p className="text-indigo-200 text-xs">Powered by LLaMA 3 · Always online</p>
        </div>
        <button onClick={clearChat} className="text-xs text-indigo-200 hover:text-white border border-indigo-400 hover:border-white px-3 py-1 rounded-lg transition-colors">
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} onFeedback={() => {}} />
          ))}
          {loading && <SkeletonBubble key="skeleton" />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-3 sm:px-6 pb-2 flex flex-wrap gap-2"
          >
            {QUICK_REPLIES.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-full transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 flex gap-2 items-end">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32 placeholder-gray-400"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
