const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");

function appendMessage(kind, text, metadata = "") {
  const article = document.createElement("article");
  article.className = `message ${kind}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  article.appendChild(paragraph);

  if (metadata) {
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = metadata;
    article.appendChild(meta);
  }

  chatMessages.appendChild(article);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return article;
}

function addFeedbackControls(messageElement, messageId) {
  const feedback = document.createElement("div");
  feedback.className = "feedback";

  const positive = document.createElement("button");
  positive.type = "button";
  positive.title = "Helpful";
  positive.setAttribute("aria-label", "Mark response helpful");
  positive.textContent = "+";

  const negative = document.createElement("button");
  negative.type = "button";
  negative.title = "Not helpful";
  negative.setAttribute("aria-label", "Mark response not helpful");
  negative.textContent = "-";

  positive.addEventListener("click", () => sendFeedback(messageId, true, positive, negative));
  negative.addEventListener("click", () => sendFeedback(messageId, false, negative, positive));

  feedback.append(positive, negative);
  messageElement.appendChild(feedback);
}

async function sendFeedback(messageId, helpful, selected, other) {
  const response = await fetch("/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message_id: messageId, helpful })
  });

  if (response.ok) {
    selected.classList.add("selected");
    other.classList.remove("selected");
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  appendMessage("user", message);
  messageInput.value = "";
  messageInput.focus();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    const intentText = data.primary_intent ? `Intent: ${data.primary_intent}` : "Intent: unknown";
    const botMessage = appendMessage("bot", data.response, `${intentText} | Confidence: ${data.confidence}%`);
    addFeedbackControls(botMessage, data.message_id);
  } catch (error) {
    appendMessage("bot", "Something went wrong while contacting the chatbot.", "Error");
  }
});
