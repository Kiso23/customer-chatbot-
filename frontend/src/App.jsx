import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Chat from './components/Chat'
import Admin from './components/Admin'
import History from './components/History'
import Dashboard from './components/Dashboard'
import { ThemeProvider, useTheme } from './ThemeContext'

function Nav() {
  const { dark, toggle } = useTheme()
  const base = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
  const active = `${base} bg-indigo-600 text-white`
  const inactive = `${base} text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <NavLink to="/" end className={({ isActive }) => isActive ? active : inactive}>💬 Chat</NavLink>
      <NavLink to="/admin" className={({ isActive }) => isActive ? active : inactive}>⚙️ Admin</NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? active : inactive}>📋 History</NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? active : inactive}>📊 Dashboard</NavLink>
      <button
        onClick={toggle}
        className="ml-auto text-xl px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </nav>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen bg-white dark:bg-gray-950 transition-colors">
          <Nav />
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/history" element={<History />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
