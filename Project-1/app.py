from flask import Flask, jsonify, render_template, request

from chatbot import IntelligentChatbot
from config import APP_NAME


app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
chatbot = IntelligentChatbot()


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


if __name__ == "__main__":
    app.run(debug=True)
