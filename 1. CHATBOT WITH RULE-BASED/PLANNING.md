# Software Requirements Specification (SRS)

## Project Title
**Intelligent Rule-Based Chatbot Web Application**

## Purpose
This project is a Flask-based chatbot web application that responds to users through rule-based intent detection, context awareness, confidence scoring, and persistent analytics.

## Scope
The chatbot uses Python, Flask, regex, fuzzy matching, JSON persistence, and browser-based HTML/CSS/JavaScript. It does not use external AI APIs or machine learning models in version 1.

## Functional Requirements
- Provide a simple web chat interface.
- Accept user messages and return chatbot responses.
- Detect intents with regex and fuzzy matching.
- Support greeting, farewell, bot identity, programming, time/date, math, jokes, help, small talk, mood, name capture, and name recall.
- Remember the user's name and mood during the session.
- Detect multiple intents in one message where possible.
- Score response confidence from 0 to 100.
- Save chat history in JSON format.
- Save analytics and feedback in JSON format.
- Log unknown and low-confidence questions for manual improvement.

## Non-Functional Requirements
- Respond quickly for normal local messages.
- Keep intent data separate in `intents.json`.
- Keep Flask routes separate from chatbot logic.
- Handle empty and unknown input safely.
- Continue working when history files do not exist.

## Data Flow
```text
User Input
Clean and Normalize Text
Detect Intent Using Regex and Fuzzy Matching
Calculate Confidence Score
Generate Response
Update Context
Save Chat History
Update Analytics
Display Response in Web UI
```

## Success Criteria
- Runs as a Flask web app.
- Recognizes at least 10 intent categories.
- Handles common typos.
- Remembers user name and mood.
- Stores history, analytics, and feedback.
- Shows confidence scores.
- Includes README documentation.
