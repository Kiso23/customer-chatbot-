"""
Lightweight semantic FAQ search using TF-IDF + cosine similarity.
No external API or heavy model needed — works fully offline.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class FAQSearcher:
    def __init__(self, threshold: float = 0.3):
        self.threshold = threshold
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.vectors = None
        self.faqs: list[dict] = []  # [{question, answer}]

    def fit(self, faqs: list[dict]):
        """Build the TF-IDF index from FAQ list."""
        self.faqs = faqs
        if not faqs:
            return
        questions = [f["question"] for f in faqs]
        self.vectors = self.vectorizer.fit_transform(questions)

    def search(self, query: str) -> str | None:
        """Return best matching answer or None if below threshold."""
        if self.vectors is None or not self.faqs:
            return None
        q_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(q_vec, self.vectors).flatten()
        best_idx = int(np.argmax(scores))
        if scores[best_idx] >= self.threshold:
            return self.faqs[best_idx]["answer"]
        return None


# Singleton — reloaded when FAQs change
_searcher = FAQSearcher()


def get_searcher() -> FAQSearcher:
    return _searcher
