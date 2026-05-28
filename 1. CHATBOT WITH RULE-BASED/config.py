from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
INTENTS_FILE = BASE_DIR / "intents.json"
HISTORY_DIR = BASE_DIR / "conversation_history"
STATS_FILE = HISTORY_DIR / "stats.json"

APP_NAME = "Intelligent Rule-Based Chatbot"

HIGH_CONFIDENCE = 75
MEDIUM_CONFIDENCE = 45
MAX_CONTEXT_MESSAGES = 12
FUZZY_MATCH_CUTOFF = 0.78
