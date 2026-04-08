import { useState, useEffect } from 'react'
import axios from 'axios'

function FAQRow({ faq, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [q, setQ] = useState(faq.question)
  const [a, setA] = useState(faq.answer)

  const save = async () => {
    await onSave(faq.id, q, a)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="bg-indigo-50">
        <td className="px-4 py-2">
          <input className="w-full border rounded px-2 py-1 text-sm" value={q} onChange={e => setQ(e.target.value)} />
        </td>
        <td className="px-4 py-2">
          <textarea className="w-full border rounded px-2 py-1 text-sm" rows={2} value={a} onChange={e => setA(e.target.value)} />
        </td>
        <td className="px-4 py-2 whitespace-nowrap">
          <button onClick={save} className="text-green-600 hover:underline text-sm mr-3">Save</button>
          <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline text-sm">Cancel</button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-700">{faq.question}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{faq.answer}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <button onClick={() => setEditing(true)} className="text-indigo-600 hover:underline text-sm mr-3">Edit</button>
        <button onClick={() => onDelete(faq.id)} className="text-red-500 hover:underline text-sm">Delete</button>
      </td>
    </tr>
  )
}

export default function Admin() {
  const [faqs, setFaqs] = useState([])
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await axios.get('/api/faqs')
    setFaqs(data)
  }

  useEffect(() => { load() }, [])

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const addFaq = async () => {
    if (!newQ.trim() || !newA.trim()) return
    setLoading(true)
    await axios.post('/api/faqs', { question: newQ.trim(), answer: newA.trim() })
    setNewQ(''); setNewA('')
    await load()
    flash('FAQ added.')
    setLoading(false)
  }

  const deleteFaq = async (id) => {
    if (!confirm('Delete this FAQ?')) return
    await axios.delete(`/api/faqs/${id}`)
    await load()
    flash('FAQ deleted.')
  }

  const saveFaq = async (id, question, answer) => {
    await axios.put(`/api/faqs/${id}`, { question, answer })
    await load()
    flash('FAQ updated.')
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">FAQ Manager</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">These are used for semantic search before hitting the AI model.</p>

      {msg && <div className="mb-4 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-sm px-4 py-2 rounded-lg">{msg}</div>}

      {/* Add new FAQ */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Add New FAQ</h3>
        <input
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          placeholder="Question (e.g. how do I track my order)"
          value={newQ}
          onChange={e => setNewQ(e.target.value)}
        />
        <textarea
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          placeholder="Answer"
          rows={2}
          value={newA}
          onChange={e => setNewA(e.target.value)}
        />
        <button
          onClick={addFaq}
          disabled={loading || !newQ.trim() || !newA.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm px-5 py-2 rounded-lg transition-colors"
        >
          Add FAQ
        </button>
      </div>

      {/* FAQ table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-2/5">Question</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Answer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No FAQs yet.</td></tr>
            )}
            {faqs.map(faq => (
              <FAQRow key={faq.id} faq={faq} onDelete={deleteFaq} onSave={saveFaq} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
