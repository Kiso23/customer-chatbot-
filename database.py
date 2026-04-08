from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os

_db_url = os.getenv("DATABASE_URL", "sqlite:///./support.db")

# Railway gives postgres:// but SQLAlchemy needs postgresql://
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

DATABASE_URL = _db_url
_is_sqlite = "sqlite" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class FAQ(Base):
    __tablename__ = "faq"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, index=True)
    answer = Column(Text)


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)  # for multi-turn tracking
    user_message = Column(Text)
    bot_response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String, default="ai")  # "faq" or "ai"
    feedback = Column(Integer, nullable=True)  # 1 = thumbs up, -1 = thumbs down


def init_db():
    Base.metadata.create_all(bind=engine)
    # Seed some FAQs if table is empty
    db = SessionLocal()
    if db.query(FAQ).count() == 0:
        seed_faqs = [
            FAQ(question="where is my order", answer="Your order will be delivered within 2–3 business days. You can track it in your account."),
            FAQ(question="how do i return a product", answer="You can return any product within 30 days of purchase. Visit our Returns page to start the process."),
            FAQ(question="what are your working hours", answer="Our support team is available Monday to Friday, 9 AM – 6 PM."),
            FAQ(question="how do i reset my password", answer="Click 'Forgot Password' on the login page and follow the instructions sent to your email."),
            FAQ(question="do you offer refunds", answer="Yes, refunds are processed within 5–7 business days after we receive the returned item."),
        ]
        db.add_all(seed_faqs)
        db.commit()
    db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
