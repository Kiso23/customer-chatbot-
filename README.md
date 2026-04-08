# 🤖 AI-Powered Customer Support Chatbot

🌐 **Live Demo:** [customer-chatbot-gilt.vercel.app](https://customer-chatbot-gilt.vercel.app)

A full-stack AI customer support system built as a final-year project. It runs **completely free and offline** using a local LLM (LLaMA 3 via Ollama), with a React chat UI, FastAPI backend, semantic FAQ search, and a live analytics dashboard.

---

## ✨ Features

- 💬 **Real-time chat UI** — WhatsApp-style interface with animations
- 🧠 **Multi-turn memory** — AI remembers the full conversation context
- 📚 **Semantic FAQ search** — TF-IDF cosine similarity matches questions even with different wording
- 🤖 **LLaMA 3 via Ollama** — runs locally, no paid API needed
- ⚙️ **Admin panel** — add, edit, delete FAQs from the browser
- 📋 **Chat history** — searchable log of all conversations
- 📊 **Dashboard** — live stats: FAQ hit rate, AI usage, feedback, chats by hour
- 👍👎 **User feedback** — thumbs up/down on every bot response
- 🌙 **Dark mode** — toggle with persistence
- 📱 **Mobile responsive** — works on all screen sizes
- 📥 **CSV export** — download full chat history
- 🚀 **Deployable** — Railway (backend) + Vercel (frontend)

---

## 🧩 System Architecture

```
React Frontend (Vite + Tailwind)
        ↓
FastAPI Backend (Python)
        ↓
Semantic Search (TF-IDF)  →  FAQ Database (SQLite / PostgreSQL)
        ↓ (if no FAQ match)
Ollama — LLaMA 3 (local AI)
        ↓
Response + Chat History saved to DB
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.12 |
| AI Engine | Ollama (LLaMA 3 / Mistral) |
| Semantic Search | scikit-learn (TF-IDF + cosine similarity) |
| Database | SQLite (local) / PostgreSQL (production) |
| Deployment | Railway (backend), Vercel (frontend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- [Ollama](https://ollama.com) installed

### 1. Clone the repo

```bash
git clone https://github.com/Kiso23/customer-chatbot-.git
cd customer-chatbot-
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Install and run Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull LLaMA 3
ollama pull llama3
```

### 5. Open the app

Visit `http://localhost:5173`

---

## 📁 Project Structure

```
customer-chatbot-/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── database.py      # SQLAlchemy models + DB init
│   ├── semantic.py      # TF-IDF semantic search engine
│   ├── requirements.txt
│   ├── .env.example
│   └── railway.json     # Railway deployment config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx      # Main chat UI
│   │   │   ├── Admin.jsx     # FAQ manager
│   │   │   ├── History.jsx   # Chat history viewer
│   │   │   └── Dashboard.jsx # Analytics dashboard
│   │   ├── App.jsx
│   │   └── ThemeContext.jsx  # Dark mode
│   └── vercel.json      # Vercel deployment config
└── .gitignore
```

---

## 🔄 How It Works

1. User sends a message from the React UI
2. Backend receives it at `POST /api/chat`
3. Semantic search checks the FAQ database first
4. If matched → instant FAQ answer returned
5. If not matched → sent to LLaMA 3 via Ollama with full conversation history
6. Response saved to DB with source tag (`faq` or `ai`)
7. User can rate the response 👍 or 👎

---

## 🌐 Deployment

### Backend → Railway

1. New Project → Deploy from GitHub
2. Set root directory to `backend`
3. Add PostgreSQL plugin (auto-injects `DATABASE_URL`)
4. Set env vars: `OLLAMA_MODEL`, `OLLAMA_URL`

### Frontend → Vercel

1. New Project → import repo
2. Set root directory to `frontend`
3. Update `vercel.json` with your Railway URL

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a message |
| POST | `/api/chat/feedback/{id}` | Submit feedback |
| GET | `/api/faqs` | List all FAQs |
| POST | `/api/faqs` | Add a FAQ |
| PUT | `/api/faqs/{id}` | Update a FAQ |
| DELETE | `/api/faqs/{id}` | Delete a FAQ |
| GET | `/api/history` | Get chat history |
| GET | `/api/history/export` | Export history as CSV |
| DELETE | `/api/history` | Clear all history |
| GET | `/api/stats` | Get dashboard stats |

---

## 👨‍💻 Author

**Kiso23**
Final Year Project — AI-Powered Customer Support System

---

## 📄 License

MIT
