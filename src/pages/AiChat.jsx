import { useState, useRef, useEffect } from 'react'
import { predictionApi } from '../api/client'
import { Brain, Send, User, Trash2, Loader2, Sparkles } from 'lucide-react'
import clsx from 'clsx'

const SUGGESTIONS = [
  'Which products should I restock this week?',
  'What is my best performing category this month?',
  'How can I improve profit margins on electronics?',
  'Which products are at risk of going out of stock?',
  'Suggest a pricing strategy for slow-moving items.',
  'What sales trends should I watch out for?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-violet-500 to-blue-600'
      )}>
        {isUser ? <User size={16} className="text-white" /> : <Brain size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      )}>
        {msg.loading
          ? <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Claude is thinking…</span>
            </div>
          : <p className="whitespace-pre-wrap">{msg.content}</p>
        }
        {msg.timestamp && (
          <p className={clsx('text-xs mt-1.5', isUser ? 'text-blue-200' : 'text-gray-400')}>
            {new Date(msg.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI inventory assistant powered by Claude. I can answer questions about your stock levels, sales trends, pricing strategy, and more.\n\nTry asking me something about your inventory!",
      timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useContext, setUseContext] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')

    const userMsg = { role: 'user', content: question, timestamp: new Date().toISOString() }
    const loadingMsg = { role: 'assistant', content: '', loading: true, id: Date.now() }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    try {
      const res = await predictionApi.chat(question, useContext)
      const answer = res.data.data.answer
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { role: 'assistant', content: answer, timestamp: new Date().toISOString() }
          : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }
          : m
      ))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const clear = () => setMessages([{
    role: 'assistant',
    content: "Conversation cleared. How can I help you with your inventory?",
    timestamp: new Date().toISOString(),
  }])

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">AI Assistant</h1>
              <p className="text-xs text-gray-400">Powered by claude-sonnet-4-20250514</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Inventory context toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setUseContext(v => !v)}
                className={clsx(
                  'w-10 h-5 rounded-full transition-colors relative',
                  useContext ? 'bg-blue-600' : 'bg-gray-300'
                )}
              >
                <div className={clsx(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  useContext ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
              <span className="text-xs text-gray-600">Inventory context</span>
            </label>
            <button onClick={clear} title="Clear chat"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions (shown when only the welcome message exists) */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles size={12} /> Suggested questions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask about inventory, sales, pricing…"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Send size={18} />
            }
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-2">
          {useContext ? 'Claude has access to your live inventory data' : 'General mode — no inventory data shared'}
        </p>
      </div>
    </div>
  )
}
