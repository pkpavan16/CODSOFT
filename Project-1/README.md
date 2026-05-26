# Intelligent Rule-Based Chatbot

A Flask web app chatbot that uses regex, fuzzy matching, confidence scoring, context memory, JSON persistence, analytics, and thumbs up/down feedback.

## Features

- Rule-based intent detection with regex patterns
- Fuzzy matching for small typos
- 10+ intent categories
- Context awareness for user name, mood, and recent messages
- Confidence scoring from 0 to 100
- Multi-intent responses for compound messages
- Persistent chat history and analytics in JSON
- Manual learning workflow through logged unknown and low-confidence questions
- Simple browser chat UI

## Setup

```bash
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Example Prompts

- `hello`
- `my name is Rahul`
- `what is my name?`
- `tell me a Python joke`
- `calculate 12 / 3`
- `I am tired`
- `what can you do?`

## Project Structure

```text
├── app.py
├── chatbot.py
├── intents.json
├── config.py
├── utils.py
├── requirements.txt
├── README.md
├── PLANNING.md
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
├── tests/
│   └── test_chatbot.py
└── conversation_history/
    └── .gitkeep
```

## Learning Approach

The chatbot does not automatically rewrite its rules. Instead, it records:

- Unknown questions
- Low-confidence messages
- Intent frequency
- User feedback

The developer reviews `conversation_history/stats.json` and manually updates `intents.json`.

## Run Tests

```bash
pytest
```
