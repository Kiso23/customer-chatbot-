import csv
import io
import os
from collections import defaultdict
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx
from groq import Groq

load_dotenv()

from database import ChatHistory, FAQ, get_db, init_db
from semantic import get_searcher

app = FastAPI(title="AI Customer Support API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# In-memory session store: session_id -> list of {role, content}
_sessions: dict[str, list[dict]] = defaultdict(list)
MAX_HISTORY = 10  # turns to keep in context


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class FAQCreate(BaseModel):
    question: str
    answer: str

class FAQUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None

class FeedbackRequest(BaseModel):
    feedback: int  # 1 or -1


# ── Helpers ───────────────────────────────────────────────────────────────────

def reload_searcher(db: Session):
    faqs = db.query(FAQ).all()
    get_searcher().fit([{"question": f.question, "answer": f.answer} for f in faqs])


def build_messages(history: list[dict], user_msg: str) -> list[dict]:
    messages = [{
        "role": "system",
        "content": (
            "You are a helpful customer support assistant. "
            "Answer concisely and politely. Use conversation history for context. "
            "If you don't know something, say so."
        )
    }]
    for turn in history[-MAX_HISTORY:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": user_msg})
    return messages


async def ask_groq(history: list[dict], user_msg: str) -> str:
    messages = build_messages(history, user_msg)
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        max_tokens=512,
    )
    return response.choices[0].message.content.strip()


async def ask_ollama(history: list[dict], user_msg: str) -> str:
    system = (
        "You are a helpful customer support assistant. "
        "Answer concisely and politely. If you don't know, say so."
    )
    lines = [f"System: {system}\n"]
    for turn in history[-MAX_HISTORY:]:
        role = "User" if turn["role"] == "user" else "Assistant"
        lines.append(f"{role}: {turn['content']}")
    lines.append(f"User: {user_msg}\nAssistant:")
    payload = {"model": OLLAMA_MODEL, "prompt": "\n".join(lines), "stream": False}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(OLLAMA_URL, json=payload)
        resp.raise_for_status()
        return resp.json().get("response", "").strip()


async def ask_ai(history: list[dict], user_msg: str) -> str:
    """Try Groq first, fall back to Ollama."""
    if groq_client:
        return await ask_groq(history, user_msg)
    return await ask_ollama(history, user_msg)


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()
    db = next(get_db())
    reload_searcher(db)
    db.close()


# ── Chat ──────────────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    user_msg = req.message.strip()
    session_history = _sessions[req.session_id]

    # 1. Semantic FAQ search (stateless — FAQs don't need context)
    faq_answer = get_searcher().search(user_msg)
    source = "faq"

    if faq_answer:
        response = faq_answer
    else:
        source = "ai"
        try:
            response = await ask_ai(session_history, user_msg)
        except Exception as e:
            response = f"AI error: {str(e)[:300]}"

    # Update in-memory session history
    session_history.append({"role": "user", "content": user_msg})
    session_history.append({"role": "assistant", "content": response})

    # Persist to DB
    row = ChatHistory(
        session_id=req.session_id,
        user_message=user_msg,
        bot_response=response,
        source=source,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return {"response": response, "source": source, "id": row.id}


@app.post("/api/chat/feedback/{chat_id}")
def submit_feedback(chat_id: int, body: FeedbackRequest, db: Session = Depends(get_db)):
    row = db.query(ChatHistory).filter(ChatHistory.id == chat_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Chat not found")
    row.feedback = body.feedback
    db.commit()
    return {"ok": True}


@app.delete("/api/chat/session/{session_id}")
def clear_session(session_id: str):
    _sessions.pop(session_id, None)
    return {"ok": True}


# ── FAQ CRUD ──────────────────────────────────────────────────────────────────

@app.get("/api/faqs")
def list_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).all()

@app.post("/api/faqs", status_code=201)
def add_faq(body: FAQCreate, db: Session = Depends(get_db)):
    faq = FAQ(question=body.question, answer=body.answer)
    db.add(faq)
    db.commit()
    db.refresh(faq)
    reload_searcher(db)
    return faq

@app.put("/api/faqs/{faq_id}")
def update_faq(faq_id: int, body: FAQUpdate, db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    if body.question is not None:
        faq.question = body.question
    if body.answer is not None:
        faq.answer = body.answer
    db.commit()
    db.refresh(faq)
    reload_searcher(db)
    return faq

@app.delete("/api/faqs/{faq_id}", status_code=204)
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    reload_searcher(db)


# ── History ───────────────────────────────────────────────────────────────────

@app.get("/api/history")
def chat_history(db: Session = Depends(get_db)):
    rows = db.query(ChatHistory).order_by(ChatHistory.timestamp.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "user_message": r.user_message,
            "bot_response": r.bot_response,
            "timestamp": r.timestamp.isoformat(),
            "source": r.source,
            "feedback": r.feedback,
        }
        for r in rows
    ]

@app.delete("/api/history", status_code=204)
def clear_history(db: Session = Depends(get_db)):
    db.query(ChatHistory).delete()
    db.commit()

@app.get("/api/history/export")
def export_csv(db: Session = Depends(get_db)):
    rows = db.query(ChatHistory).order_by(ChatHistory.timestamp.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "session_id", "user_message", "bot_response", "source", "feedback", "timestamp"])
    for r in rows:
        writer.writerow([r.id, r.session_id, r.user_message, r.bot_response, r.source, r.feedback, r.timestamp])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=chat_history.csv"},
    )


# ── Stats / Dashboard ─────────────────────────────────────────────────────────

@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    rows = db.query(ChatHistory).all()
    total = len(rows)
    faq_hits = sum(1 for r in rows if r.source == "faq")
    ai_hits = sum(1 for r in rows if r.source == "ai")
    thumbs_up = sum(1 for r in rows if r.feedback == 1)
    thumbs_down = sum(1 for r in rows if r.feedback == -1)

    # Chats per hour (0–23)
    hourly: dict[int, int] = defaultdict(int)
    for r in rows:
        if r.timestamp:
            hourly[r.timestamp.hour] += 1

    hourly_data = [{"hour": h, "count": hourly[h]} for h in range(24)]

    return {
        "total_chats": total,
        "faq_hits": faq_hits,
        "ai_hits": ai_hits,
        "faq_rate": round(faq_hits / total * 100, 1) if total else 0,
        "thumbs_up": thumbs_up,
        "thumbs_down": thumbs_down,
        "hourly": hourly_data,
    }
