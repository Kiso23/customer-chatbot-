import { useState, useEffect } from 'react'
import axios from 'axios'

export default function History() {
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await axios.get('/api/history')
    setHistory(data)
  }

  useEffect(() => { load() }, [])

  const clearAll = async () => {
    if (!confirm('Clear all chat history?')) return
    await axios.delete('/api/history')
    setHistory([])
  }

  const exportCSV = () => {
    window.open('/api/history/export', '_blank')
  }

  const filtered = history.filter(h =>
    h.user_message.toLowerCase().includes(search.toLowerCase()) ||
    h.bot_response.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Chat History</h2>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Export CSV</button>
          <button onClick={clearAll} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{history.length} conversations stored</p>

      <input
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
        placeholder="Search messages..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No history found.</p>
        )}
        {filtered.map(h => (
          <div key={h.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</span>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${h.source === 'faq' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'}`}>
                  {h.source === 'faq' ? '📚 FAQ' : '🧠 AI'}
                </span>
                {h.feedback === 1 && <span className="text-xs">👍</span>}
                {h.feedback === -1 && <span className="text-xs">👎</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-start">
                <span className="text-base">🧑</span>
                <p className="text-sm text-gray-700 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg px-3 py-2 flex-1">{h.user_message}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-base">🤖</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 flex-1">{h.bot_response}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
