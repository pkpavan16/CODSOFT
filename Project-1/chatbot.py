import random
import re
from datetime import datetime

from config import (
    FUZZY_MATCH_CUTOFF,
    HIGH_CONFIDENCE,
    HISTORY_DIR,
    INTENTS_FILE,
    MAX_CONTEXT_MESSAGES,
    MEDIUM_CONFIDENCE,
    STATS_FILE,
)
from utils import current_timestamp, fuzzy_score, load_json, normalize_text, save_json, today_key


class IntelligentChatbot:
    def __init__(self):
        data = load_json(INTENTS_FILE, {"intents": [], "fallbacks": []})
        self.intents = data.get("intents", [])
        self.fallbacks = data.get("fallbacks", ["I am not sure how to answer that yet."])
        self.context = {
            "user_name": None,
            "mood": None,
            "messages": []
        }

    def respond(self, message):
        raw_message = (message or "").strip()
        if not raw_message:
            return self._build_result(
                raw_message,
                "Please type a message so I can help.",
                [],
                0,
                "empty_input"
            )

        normalized = normalize_text(raw_message)
        matches = self._detect_intents(normalized)
        top_matches = [match for match in matches if match["confidence"] >= MEDIUM_CONFIDENCE]

        if not top_matches:
            response = random.choice(self.fallbacks)
            result = self._build_result(raw_message, response, [], 20, "fallback")
            self._record_interaction(result, unknown=True)
            return result

        selected = top_matches[:3]
        self._update_context_from_message(normalized, selected)
        responses = [self._render_response(match, raw_message, normalized) for match in selected]
        confidence = max(match["confidence"] for match in selected)
        if confidence < HIGH_CONFIDENCE:
            responses.append("I am partly confident, so you can clarify if this is not what you meant.")

        result = self._build_result(
            raw_message,
            " ".join(responses),
            selected,
            confidence,
            selected[0]["intent"]
        )
        self._record_interaction(result, unknown=confidence < MEDIUM_CONFIDENCE)
        return result

    def record_feedback(self, message_id, helpful):
        stats = self._default_stats()
        stats = load_json(STATS_FILE, stats)
        stats.setdefault("feedback", {"positive": 0, "negative": 0, "items": []})
        key = "positive" if helpful else "negative"
        stats["feedback"][key] = stats["feedback"].get(key, 0) + 1
        stats["feedback"]["items"].append({
            "message_id": message_id,
            "helpful": bool(helpful),
            "timestamp": current_timestamp()
        })
        save_json(STATS_FILE, stats)
        return {"status": "saved", "message_id": message_id, "helpful": bool(helpful)}

    def _detect_intents(self, normalized_message):
        matches = []
        for intent in self.intents:
            regex_score = self._regex_confidence(intent, normalized_message)
            fuzzy_match_score, keyword = fuzzy_score(normalized_message, intent.get("keywords", []))
            fuzzy_confidence = fuzzy_match_score if fuzzy_match_score >= int(FUZZY_MATCH_CUTOFF * 100) else 0
            confidence = min(max(regex_score, fuzzy_confidence), 100)

            if confidence > 0:
                matches.append({
                    "intent": intent["name"],
                    "confidence": confidence,
                    "matched_keyword": keyword,
                    "responses": intent.get("responses", [])
                })

        matches.sort(key=lambda item: item["confidence"], reverse=True)
        return matches

    def _regex_confidence(self, intent, message):
        for pattern in intent.get("patterns", []):
            if re.search(pattern, message, re.IGNORECASE):
                return 95
        return 0

    def _update_context_from_message(self, normalized, matches):
        name_match = re.search(r"\b(?:my name is|call me)\s+([a-zA-Z][a-zA-Z ]{1,30})\b", normalized)
        if name_match:
            self.context["user_name"] = name_match.group(1).strip().title()

        mood_match = re.search(r"\b(?:i am|i'm|im|feeling)\s+(sad|happy|excited|tired|angry|stressed|bored|great|good|bad)\b", normalized)
        if mood_match:
            self.context["mood"] = mood_match.group(1)

        self.context["messages"].append({
            "text": normalized,
            "intents": [match["intent"] for match in matches],
            "timestamp": current_timestamp()
        })
        self.context["messages"] = self.context["messages"][-MAX_CONTEXT_MESSAGES:]

    def _render_response(self, match, raw_message, normalized):
        responses = match.get("responses") or ["I understand."]
        template = random.choice(responses)
        now = datetime.now().strftime("%A, %d %B %Y at %I:%M %p")
        name = self.context.get("user_name")
        captured_name = name or self._extract_name(normalized) or "friend"
        mood = self.context.get("mood") or self._extract_mood(normalized) or "that way"
        known_name = name or "not known yet. Tell me by saying 'my name is ...'"

        return template.format(
            user_name=f", {name}" if name else "",
            captured_name=captured_name,
            known_name=known_name,
            mood=mood,
            now=now,
            math_result=self._calculate_math(raw_message)
        )

    def _extract_name(self, normalized):
        match = re.search(r"\b(?:my name is|call me)\s+([a-zA-Z][a-zA-Z ]{1,30})\b", normalized)
        if match:
            return match.group(1).strip().title()
        return None

    def _extract_mood(self, normalized):
        match = re.search(r"\b(?:i am|i'm|im|feeling)\s+(sad|happy|excited|tired|angry|stressed|bored|great|good|bad)\b", normalized)
        if match:
            return match.group(1)
        return None

    def _calculate_math(self, message):
        expression_match = re.search(r"(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)", message)
        if not expression_match:
            return "a basic expression like 5 + 3"

        left = float(expression_match.group(1))
        operator = expression_match.group(2)
        right = float(expression_match.group(3))

        if operator == "+":
            result = left + right
        elif operator == "-":
            result = left - right
        elif operator == "*":
            result = left * right
        elif operator == "/":
            if right == 0:
                return "undefined because division by zero is not allowed"
            result = left / right
        else:
            return "not available"

        return int(result) if result.is_integer() else round(result, 4)

    def _build_result(self, raw_message, response, matches, confidence, primary_intent):
        message_id = f"{today_key()}-{int(datetime.now().timestamp() * 1000)}"
        return {
            "message_id": message_id,
            "user_message": raw_message,
            "response": response,
            "intents": [{"name": item["intent"], "confidence": item["confidence"]} for item in matches],
            "primary_intent": primary_intent,
            "confidence": confidence,
            "context": {
                "user_name": self.context.get("user_name"),
                "mood": self.context.get("mood")
            },
            "timestamp": current_timestamp()
        }

    def _record_interaction(self, result, unknown=False):
        history_path = HISTORY_DIR / f"history_{today_key()}.json"
        history = load_json(history_path, [])
        history.append(result)
        save_json(history_path, history)

        stats = load_json(STATS_FILE, self._default_stats())
        stats["total_messages"] = stats.get("total_messages", 0) + 1
        stats["intent_frequency"][result["primary_intent"]] = stats["intent_frequency"].get(result["primary_intent"], 0) + 1

        if result["confidence"] < HIGH_CONFIDENCE:
            stats["low_confidence"].append({
                "message": result["user_message"],
                "confidence": result["confidence"],
                "timestamp": result["timestamp"]
            })

        if unknown:
            stats["unknown_questions"].append({
                "message": result["user_message"],
                "timestamp": result["timestamp"]
            })

        save_json(STATS_FILE, stats)

    def _default_stats(self):
        return {
            "total_messages": 0,
            "intent_frequency": {},
            "unknown_questions": [],
            "low_confidence": [],
            "feedback": {
                "positive": 0,
                "negative": 0,
                "items": []
            }
        }
