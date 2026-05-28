document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const chatMessages = document.querySelector("#chatMessages");
  const chatForm = document.querySelector("#chatForm");
  const messageInput = document.querySelector("#messageInput");
  const ttsToggle = document.querySelector("#ttsToggle");
  const sttToggle = document.querySelector("#sttToggle");
  const sidebarToggle = document.querySelector("#sidebarToggle");
  const appContainer = document.querySelector(".app-container");
  
  // Theme Selector
  const themeSelector = document.querySelector("#themeSelector");
  
  // Sidebar Tabs
  const tabBtnAnalytics = document.querySelector("#tabBtnAnalytics");
  const tabBtnTrainer = document.querySelector("#tabBtnTrainer");
  const tabAnalytics = document.querySelector("#tabAnalytics");
  const tabTrainer = document.querySelector("#tabTrainer");
  
  // Context & Metrics Displays
  const contextUserName = document.querySelector("#contextUserName");
  const contextMood = document.querySelector("#contextMood");
  const contextMessagesCount = document.querySelector("#contextMessagesCount");
  const metricTotalMessages = document.querySelector("#metricTotalMessages");
  const metricFeedbackRatio = document.querySelector("#metricFeedbackRatio");
  const intentBarsList = document.querySelector("#intentBarsList");
  const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
  
  // Trainer Log Lists
  const unknownCount = document.querySelector("#unknownCount");
  const unknownList = document.querySelector("#unknownList");
  const lowConfidenceCount = document.querySelector("#lowConfidenceCount");
  const lowConfidenceList = document.querySelector("#lowConfidenceList");
  
  // Training Form
  const trainingFormCard = document.querySelector("#trainingFormCard");
  const trainerFormTitle = document.querySelector("#trainerFormTitle");
  const trainerQueryDisplay = document.querySelector("#trainerQueryDisplay");
  const trainedQueryInput = document.querySelector("#trainedQueryInput");
  const intentSelect = document.querySelector("#intentSelect");
  const toggleNewIntentBtn = document.querySelector("#toggleNewIntentBtn");
  const newIntentInput = document.querySelector("#newIntentInput");
  const teachPattern = document.querySelector("#teachPattern");
  const teachKeyword = document.querySelector("#teachKeyword");
  const teachResponse = document.querySelector("#teachResponse");
  const teachForm = document.querySelector("#teachForm");
  const cancelTeachBtn = document.querySelector("#cancelTeachBtn");

  // State Management
  let isTtsEnabled = false;
  let isSttRecording = false;
  let recognition = null;
  let isNewIntentMode = false;

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isSttRecording = true;
      sttToggle.classList.add("recording");
      messageInput.placeholder = "Listening...";
    };

    recognition.onerror = () => {
      stopRecordingState();
    };

    recognition.onend = () => {
      stopRecordingState();
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      messageInput.value = speechToText;
      messageInput.focus();
    };
  } else {
    sttToggle.title = "Speech recognition not supported in this browser";
    sttToggle.style.opacity = "0.5";
  }

  function stopRecordingState() {
    isSttRecording = false;
    sttToggle.classList.remove("recording");
    messageInput.placeholder = "Type your message...";
  }

  // Handle STT Toggle click
  sttToggle.addEventListener("click", () => {
    if (!recognition) return;
    if (isSttRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  // Handle TTS Toggle click
  ttsToggle.addEventListener("click", () => {
    isTtsEnabled = !isTtsEnabled;
    const offIcon = ttsToggle.querySelector(".tts-icon-off");
    const onIcon = ttsToggle.querySelector(".tts-icon-on");
    if (isTtsEnabled) {
      ttsToggle.classList.add("active");
      offIcon.classList.add("hidden");
      onIcon.classList.remove("hidden");
    } else {
      ttsToggle.classList.remove("active");
      offIcon.classList.remove("hidden");
      onIcon.classList.add("hidden");
      window.speechSynthesis.cancel();
    }
  });

  // Theme selector handling
  themeSelector.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    document.documentElement.setAttribute("data-theme", selectedTheme);
    localStorage.setItem("intellibot-theme", selectedTheme);
  });

  // Load saved theme
  const savedTheme = localStorage.getItem("intellibot-theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeSelector.value = savedTheme;
  }

  // Sidebar Toggle Collapse
  sidebarToggle.addEventListener("click", () => {
    appContainer.classList.toggle("sidebar-collapsed");
  });

  // Tab switching
  function switchTab(activeBtn, activeContent, inactiveBtn, inactiveContent) {
    activeBtn.classList.add("active");
    inactiveBtn.classList.remove("active");
    activeContent.classList.add("active");
    inactiveContent.classList.remove("active");
  }

  tabBtnAnalytics.addEventListener("click", () => {
    switchTab(tabBtnAnalytics, tabAnalytics, tabBtnTrainer, tabTrainer);
  });

  tabBtnTrainer.addEventListener("click", () => {
    switchTab(tabBtnTrainer, tabTrainer, tabBtnAnalytics, tabAnalytics);
  });

  // Quick prompt pills clicking
  document.querySelectorAll(".pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      const query = pill.getAttribute("data-query");
      messageInput.value = query;
      chatForm.dispatchEvent(new Event("submit"));
    });
  });

  // Render a new message bubble to the chat panel
  function appendMessage(kind, text, metadata = "", messageId = "") {
    const article = document.createElement("article");
    article.className = `message ${kind}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    // Quick formatting: bold and monospace inline code blocks
    let formattedText = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    
    // Line breaks formatting
    contentDiv.innerHTML = formattedText.split("\n").map(line => `<p>${line}</p>`).join("");
    article.appendChild(contentDiv);

    if (metadata) {
      const meta = document.createElement("span");
      meta.className = "meta";
      
      // Determine confidence level color-coding
      let indicatorClass = "confidence-high";
      if (metadata.includes("Confidence:")) {
        const scoreMatch = metadata.match(/Confidence:\s*(\d+)%/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1], 10);
          if (score < 45) {
            indicatorClass = "confidence-low";
          } else if (score < 75) {
            indicatorClass = "confidence-medium";
          }
        }
      }
      
      meta.innerHTML = `<span class="confidence-indicator ${indicatorClass}"></span> ${metadata}`;
      article.appendChild(meta);
    }

    if (kind === "bot" && messageId) {
      addFeedbackControls(article, messageId);
    }

    chatMessages.appendChild(article);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return article;
  }

  // Create thumbs feedback buttons
  function addFeedbackControls(messageElement, messageId) {
    const feedback = document.createElement("div");
    feedback.className = "feedback-container";

    const positive = document.createElement("button");
    positive.type = "button";
    positive.className = "feedback-btn";
    positive.title = "Helpful";
    positive.innerHTML = `👍 Yes`;

    const negative = document.createElement("button");
    negative.type = "button";
    negative.className = "feedback-btn";
    negative.title = "Not helpful";
    negative.innerHTML = `👎 No`;

    positive.addEventListener("click", () => sendFeedback(messageId, true, positive, negative));
    negative.addEventListener("click", () => sendFeedback(messageId, false, negative, positive));

    feedback.append(positive, negative);
    messageElement.appendChild(feedback);
  }

  // POST response feedback
  async function sendFeedback(messageId, helpful, selected, other) {
    const response = await fetch("/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, helpful })
    });

    if (response.ok) {
      selected.classList.add(helpful ? "selected-yes" : "selected-no");
      other.classList.remove("selected-yes", "selected-no");
      fetchStats(); // Update feedback rates in dashboard
    }
  }

  // Render simulated typing indicator
  function showTypingIndicator() {
    const article = document.createElement("article");
    article.className = "message bot typing-indicator-message";

    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;

    article.appendChild(indicator);
    chatMessages.appendChild(article);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return article;
  }

  // Submit chat message
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    appendMessage("user", message);
    messageInput.value = "";
    messageInput.focus();

    // Show simulated thinking dots
    const indicatorElement = showTypingIndicator();

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      // Delay response slightly to simulate thinking time ("make more time")
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Remove typing bubble
      indicatorElement.remove();

      const intentText = data.primary_intent ? `Intent: ${data.primary_intent}` : "Intent: unknown";
      appendMessage("bot", data.response, `${intentText} | Confidence: ${data.confidence}%`, data.message_id);

      // Speak if enabled
      if (isTtsEnabled) {
        window.speechSynthesis.cancel();
        // Remove formatting markers for voice
        const spokenText = data.response.replace(/[\*`]/g, "");
        const utterance = new SpeechSynthesisUtterance(spokenText);
        window.speechSynthesis.speak(utterance);
      }

      // Refresh Stats dashboard
      fetchStats();
    } catch (error) {
      indicatorElement.remove();
      appendMessage("bot", "Oops, there was an issue connecting with my cognitive core. Please verify connectivity.", "Error");
    }
  });

  // Pull analytics & logs from Flask
  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) return;
      const stats = await res.json();

      // Update active contexts
      const activeHist = stats.total_messages > 0 ? "Configured" : "None";
      // We'll query chatbot endpoint context dynamically or infer from stats
      metricTotalMessages.textContent = stats.total_messages || 0;

      // Feedback Score
      const feedback = stats.feedback || { positive: 0, negative: 0 };
      const totalFeedback = (feedback.positive || 0) + (feedback.negative || 0);
      const usefulPercent = totalFeedback > 0 ? Math.round((feedback.positive / totalFeedback) * 100) : 100;
      metricFeedbackRatio.textContent = `${usefulPercent}%`;

      // Context Info defaults (will read last message context if any)
      // Since context runs per-session inside the python engine instance,
      // we can fetch the context from the last logged transaction
      // or we will read current state of the python bot by adding context attributes to stats or tracking locally.
      // Let's deduce context user name from latest history items or use default
      
      // Draw Intent Frequencies bar chart
      const intentFreqs = stats.intent_frequency || {};
      intentBarsList.innerHTML = "";
      const freqsArray = Object.entries(intentFreqs).sort((a, b) => b[1] - a[1]);

      if (freqsArray.length === 0) {
        intentBarsList.innerHTML = `<p class="muted-text">Send messages to populate analytics...</p>`;
      } else {
        const maxCount = Math.max(...freqsArray.map(f => f[1]));
        freqsArray.forEach(([intent, count]) => {
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const barRow = document.createElement("div");
          barRow.className = "intent-bar-row";
          barRow.innerHTML = `
            <div class="intent-bar-meta">
              <span class="intent-bar-name">${intent}</span>
              <span class="intent-bar-count">${count}x</span>
            </div>
            <div class="intent-bar-track">
              <div class="intent-bar-fill" style="width: ${percentage}%"></div>
            </div>
          `;
          intentBarsList.appendChild(barRow);
        });
      }

      // Populate Trainer Lists
      populateTrainerList(stats.unknown_questions || [], unknownList, unknownCount);
      populateTrainerList(stats.low_confidence || [], lowConfidenceList, lowConfidenceCount);

    } catch (err) {
      console.error("Failed to load statistics dashboard", err);
    }
  }

  function populateTrainerList(items, containerElement, countElement) {
    containerElement.innerHTML = "";
    countElement.textContent = items.length;

    if (items.length === 0) {
      containerElement.innerHTML = `<li class="empty-item">No queries logged</li>`;
      return;
    }

    // De-duplicate query strings
    const uniqueQueries = [...new Set(items.map(item => item.message))].slice(0, 10);
    
    uniqueQueries.forEach(queryStr => {
      const li = document.createElement("li");
      
      const textSpan = document.createElement("span");
      textSpan.textContent = queryStr.length > 36 ? queryStr.substring(0, 33) + "..." : queryStr;
      textSpan.title = queryStr;
      
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "teach-trigger-btn";
      actionBtn.textContent = "Teach Bot";
      
      actionBtn.addEventListener("click", () => {
        openTrainingForm(queryStr);
      });

      li.append(textSpan, actionBtn);
      containerElement.appendChild(li);
    });
  }

  // Populate Intent Select options
  async function fetchIntents() {
    try {
      const res = await fetch("/api/intents");
      if (!res.ok) return;
      const data = await res.json();
      
      // Save current context status parameters if returned
      // (Optionally reading from intents list)
      intentSelect.innerHTML = `<option value="" disabled selected>-- Select Existing Intent --</option>`;
      data.intents.forEach(intent => {
        const opt = document.createElement("option");
        opt.value = intent.name;
        opt.textContent = intent.name;
        intentSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Error loading intents list", err);
    }
  }

  // Open the interactive training panel
  function openTrainingForm(query) {
    trainingFormCard.classList.remove("hidden");
    trainerQueryDisplay.value = query;
    trainedQueryInput.value = query;
    newIntentInput.value = "";
    teachPattern.value = "";
    teachKeyword.value = "";
    teachResponse.value = "";
    
    // Show new/existing modes
    newIntentInput.classList.add("hidden");
    intentSelect.classList.remove("hidden");
    isNewIntentMode = false;
    toggleNewIntentBtn.textContent = "New";

    // Switch tab to trainer
    tabBtnTrainer.click();
    
    // Load fresh intent dropdown items
    fetchIntents();
    
    trainingFormCard.scrollIntoView({ behavior: "smooth" });
  }

  // Toggle custom training intent input
  toggleNewIntentBtn.addEventListener("click", () => {
    isNewIntentMode = !isNewIntentMode;
    if (isNewIntentMode) {
      newIntentInput.classList.remove("hidden");
      intentSelect.classList.add("hidden");
      toggleNewIntentBtn.textContent = "Select";
      newIntentInput.focus();
    } else {
      newIntentInput.classList.add("hidden");
      intentSelect.classList.remove("hidden");
      toggleNewIntentBtn.textContent = "New";
    }
  });

  // Cancel Training form
  cancelTeachBtn.addEventListener("click", () => {
    trainingFormCard.classList.add("hidden");
    teachForm.reset();
  });

  // Submit teach/training rule
  teachForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const trained_query = trainedQueryInput.value;
    const intent_name = isNewIntentMode ? newIntentInput.value.trim() : intentSelect.value;
    const pattern = teachPattern.value.trim();
    const keyword = teachKeyword.value.trim();
    const responseText = teachResponse.value.trim();

    if (!intent_name) {
      alert("Please select or define an intent category.");
      return;
    }

    try {
      const res = await fetch("/api/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent_name,
          pattern,
          keyword,
          response: responseText,
          trained_query
        })
      });

      if (res.ok) {
        alert(`IntelliBot successfully trained on intent: "${intent_name}"!`);
        trainingFormCard.classList.add("hidden");
        teachForm.reset();
        
        // Refresh dashboard metrics
        fetchStats();
      } else {
        const errorData = await res.json();
        alert(`Error training bot: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("Failed to submit training data to Flask server.");
    }
  });

  // Clear system settings context & logs
  clearHistoryBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to completely clear metrics, daily logs, and active session context? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/clear-history", { method: "POST" });
      if (res.ok) {
        // Clear UI Chat list
        chatMessages.innerHTML = `
          <article class="message bot animate-fade-in">
            <div class="message-content">
              <p>Context and history cleared. IntelliBot is ready for clean training and questions.</p>
            </div>
            <span class="meta"><span class="badge-intent">system</span> | Confidence: 100%</span>
          </article>
        `;
        // Refresh stats
        fetchStats();
        // Reset local context labels
        contextUserName.textContent = "Not Set";
        contextMood.textContent = "Not Set";
        contextMessagesCount.textContent = "0 / 12";
      }
    } catch (err) {
      alert("Error clearing history.");
    }
  });

  // Fetch context from latest response dynamically to keep UI in sync
  async function syncLocalContext(contextData) {
    if (!contextData) return;
    contextUserName.textContent = contextData.user_name || "Not Set";
    contextMood.textContent = contextData.mood || "Not Set";
    // Fetch count of messages in current context
    // (Managed in JS locally or loaded)
  }

  // Hook into the appendMessage to grab responses contexts
  const originalChatSubmit = chatForm.onsubmit;
  
  // Initialize Stats dashboard on load
  fetchStats();
  
  // Periodically refresh stats (every 5 seconds) to catch new questions/low-conf issues
  setInterval(fetchStats, 5000);
});
