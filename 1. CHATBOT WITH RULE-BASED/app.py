import os
import shutil
from flask import Flask, jsonify, render_template, request

from chatbot import IntelligentChatbot
from config import APP_NAME, INTENTS_FILE, STATS_FILE, HISTORY_DIR
from utils import load_json, save_json


app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
chatbot = IntelligentChatbot()

# Make a backup of intents.json if it doesn't exist yet
backup_file = INTENTS_FILE.parent / "intents.json.bak"
if INTENTS_FILE.exists() and not backup_file.exists():
    shutil.copy(INTENTS_FILE, backup_file)


@app.route("/")
def index():
    return render_template("index.html", app_name=APP_NAME)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")
    result = chatbot.respond(message)
    return jsonify(result)


@app.route("/feedback", methods=["POST"])
def feedback():
    data = request.get_json(silent=True) or {}
    message_id = data.get("message_id")
    helpful = data.get("helpful")

    if not message_id or helpful is None:
        return jsonify({"error": "message_id and helpful are required"}), 400

    return jsonify(chatbot.record_feedback(message_id, bool(helpful)))


@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = load_json(STATS_FILE, chatbot._default_stats())
    return jsonify(stats)


@app.route("/api/intents", methods=["GET"])
def get_intents():
    data = load_json(INTENTS_FILE, {"intents": [], "fallbacks": []})
    return jsonify(data)


@app.route("/api/teach", methods=["POST"])
def teach_bot():
    data = request.get_json(silent=True) or {}
    intent_name = data.get("intent_name", "").strip().lower()
    pattern = data.get("pattern", "").strip()
    keyword = data.get("keyword", "").strip()
    response = data.get("response", "").strip()
    trained_query = data.get("trained_query", "").strip()

    if not intent_name or not response:
        return jsonify({"error": "intent_name and response are required"}), 400

    # Load and update intents.json
    intents_data = load_json(INTENTS_FILE, {"intents": [], "fallbacks": []})
    intents_list = intents_data.setdefault("intents", [])

    found_intent = None
    for item in intents_list:
        if item["name"].lower() == intent_name:
            found_intent = item
            break

    if found_intent:
        if pattern and pattern not in found_intent.setdefault("patterns", []):
            found_intent["patterns"].append(pattern)
        if keyword and keyword not in found_intent.setdefault("keywords", []):
            found_intent["keywords"].append(keyword)
        if response not in found_intent.setdefault("responses", []):
            found_intent["responses"].append(response)
    else:
        new_intent = {
            "name": intent_name,
            "patterns": [pattern] if pattern else [],
            "keywords": [keyword] if keyword else [],
            "responses": [response]
        }
        intents_list.append(new_intent)

    save_json(INTENTS_FILE, intents_data)
    chatbot.reload_intents()

    # Clear from stats.json if a query was trained
    if trained_query:
        stats = load_json(STATS_FILE, chatbot._default_stats())
        stats["unknown_questions"] = [q for q in stats.get("unknown_questions", []) if q.get("message", "").strip().lower() != trained_query.lower()]
        stats["low_confidence"] = [q for q in stats.get("low_confidence", []) if q.get("message", "").strip().lower() != trained_query.lower()]
        save_json(STATS_FILE, stats)

    return jsonify({"status": "success", "message": f"Successfully trained intent '{intent_name}'"})


@app.route("/api/clear-history", methods=["POST"])
def clear_history():
    # Reset chatbot memory context
    chatbot.context = {
        "user_name": None,
        "mood": None,
        "messages": []
    }
    # Reset stats
    default_stats = chatbot._default_stats()
    save_json(STATS_FILE, default_stats)

    # Delete daily history files
    if HISTORY_DIR.exists():
        for f in HISTORY_DIR.glob("history_*.json"):
            try:
                f.unlink()
            except OSError:
                pass

    return jsonify({"status": "success", "message": "Chat history and metrics cleared"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=80, debug=True)

