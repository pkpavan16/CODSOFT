import json
import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"IntelliBot" in response.data


def test_chat_route(client):
    response = client.post("/chat", json={"message": "hello"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "response" in data
    assert "confidence" in data
    assert data["primary_intent"] == "greeting"


def test_feedback_route(client):
    response = client.post("/feedback", json={"message_id": "test-id", "helpful": True})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "saved"


def test_api_stats(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "total_messages" in data
    assert "intent_frequency" in data


def test_api_intents(client):
    response = client.get("/api/intents")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "intents" in data


def test_api_teach_and_clear(client):
    # Test training
    teach_payload = {
        "intent_name": "test_unit_intent",
        "pattern": "\\btestpattern\\b",
        "keyword": "testpattern",
        "response": "This is a test response",
        "trained_query": "testpattern query"
    }
    response = client.post("/api/teach", json=teach_payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "Successfully trained" in data["message"]

    # Verify reload worked by calling the chat endpoint
    chat_response = client.post("/chat", json={"message": "testpattern"})
    assert chat_response.status_code == 200
    chat_data = json.loads(chat_response.data)
    assert chat_data["response"] == "This is a test response"
    assert chat_data["primary_intent"] == "test_unit_intent"

    # Reset/clear
    clear_response = client.post("/api/clear-history")
    assert clear_response.status_code == 200

    # Restore intents.json backup to keep the repository clean
    import shutil
    from config import INTENTS_FILE
    backup_file = INTENTS_FILE.parent / "intents.json.bak"
    if backup_file.exists():
        shutil.copy(backup_file, INTENTS_FILE)

