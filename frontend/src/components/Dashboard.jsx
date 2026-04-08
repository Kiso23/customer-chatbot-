import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

function StatCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data))
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm">
      Loading stats...
    </div>
  )

  const pieData = [
    { name: 'FAQ hits', value: stats.faq_hits },
    { name: 'AI responses', value: stats.ai_hits },
  ]

  const feedbackData = [
    { name: '👍 Helpful', value: stats.thumbs_up },
    { name: '👎 Not helpful', value: stats.thumbs_down },
  ]

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Dashboard</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Live stats from your support system</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Chats" value={stats.total_chats} color="indigo" />
        <StatCard label="FAQ Hit Rate" value={`${stats.faq_rate}%`} sub={`${stats.faq_hits} answered by FAQ`} color="green" />
        <StatCard label="👍 Helpful" value={stats.thumbs_up} color="yellow" />
        <StatCard label="👎 Not Helpful" value={stats.thumbs_down} color="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* FAQ vs AI pie */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Response Source</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback pie */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">User Feedback</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={feedbackData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Chats by Hour of Day</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.hourly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={h => `${h}h`} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Chats']} labelFormatter={h => `${h}:00`} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
