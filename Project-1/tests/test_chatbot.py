from chatbot import IntelligentChatbot


def test_greeting_intent():
    bot = IntelligentChatbot()
    result = bot.respond("hello")
    assert result["primary_intent"] == "greeting"
    assert result["confidence"] >= 75


def test_typo_fuzzy_matching():
    bot = IntelligentChatbot()
    result = bot.respond("pyhton help")
    assert result["primary_intent"] in {"programming", "help"}
    assert result["confidence"] >= 45


def test_name_context_memory():
    bot = IntelligentChatbot()
    bot.respond("my name is Rahul")
    result = bot.respond("what is my name")
    assert "Rahul" in result["response"]


def test_math_calculation():
    bot = IntelligentChatbot()
    result = bot.respond("calculate 8 / 2")
    assert "4" in result["response"]


def test_unknown_fallback():
    bot = IntelligentChatbot()
    result = bot.respond("zzzz completely unknown phrase")
    assert result["primary_intent"] == "fallback"
    assert result["confidence"] < 45


def test_multi_intent_compound_message():
    bot = IntelligentChatbot()
    result = bot.respond("hello tell me a python joke")
    intent_names = {intent["name"] for intent in result["intents"]}
    assert {"greeting", "programming", "joke"}.issubset(intent_names)
