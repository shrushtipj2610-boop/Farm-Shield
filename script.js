import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://farm-shield-66054-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const databasePaths = {
  temperature: "temperature",
  humidity: "humidity",
  soilMoisture: "soilMoisture",
  phLevel: "pH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function formatValue(value, unit = "") {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  return `${value}${unit}`;
}

function update(id, value, unit = "") {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = formatValue(value, unit);
  }
}

function setAlert(id, message, className) {
  const alert = document.getElementById(id);
  if (alert) {
    alert.innerText = message;
    alert.className = `card ${className}`;
  }
}

function showDatabaseError(id, label, error) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = "Database error";
    el.title = `${label}: ${error.message}`;
  }
}

function getText(id) {
  const el = document.getElementById(id);
  return el ? el.innerText : "--";
}

function getBotReply(message) {
  const text = message.toLowerCase();

  if (text.includes("temp") || text.includes("temperature")) {
    return `The current temperature reading is ${getText("temp")}.`;
  }

  if (text.includes("humidity")) {
    return `The current humidity reading is ${getText("hum")}.`;
  }

  if (text.includes("soil") || text.includes("moisture")) {
    return `The current soil moisture reading is ${getText("soil")}.`;
  }

  if (text.includes("ph")) {
    return `The current pH reading is ${getText("ph")}.`;
  }

  if (text.includes("alert") || text.includes("warning")) {
    const tempAlert = getText("alert-temp");
    const soilAlert = getText("alert-soil");
    return `Alerts: ${tempAlert}; ${soilAlert}.`;
  }

  return "I can help with temperature, humidity, soil moisture, pH, and alerts. Ask me about any sensor reading.";
}

function addChatMessage(messages, text, type) {
  const message = document.createElement("div");
  message.className = `chat-message ${type}`;
  message.innerText = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function initChatbot() {
  const chatbot = document.createElement("section");
  chatbot.className = "chatbot";
  chatbot.setAttribute("aria-label", "FarmShield AI chatbot");
  chatbot.innerHTML = `
    <button class="chatbot-toggle" type="button" aria-expanded="false" aria-label="Open AI chatbot">AI</button>
    <div class="chatbot-window" aria-hidden="true">
      <div class="chatbot-header">
        <div>
          <strong>FarmShield AI</strong>
          <small>Sensor assistant</small>
        </div>
        <button class="chatbot-close" type="button" aria-label="Close AI chatbot">x</button>
      </div>
      <div class="chatbot-messages"></div>
      <form class="chatbot-form">
        <input type="text" placeholder="Ask about sensors..." aria-label="Ask the AI chatbot">
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  document.body.appendChild(chatbot);

  const toggle = chatbot.querySelector(".chatbot-toggle");
  const close = chatbot.querySelector(".chatbot-close");
  const windowEl = chatbot.querySelector(".chatbot-window");
  const messages = chatbot.querySelector(".chatbot-messages");
  const form = chatbot.querySelector(".chatbot-form");
  const input = chatbot.querySelector("input");

  function setOpen(isOpen) {
    chatbot.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    windowEl.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      input.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(!chatbot.classList.contains("open")));
  close.addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      return;
    }

    addChatMessage(messages, question, "user");
    input.value = "";
    addChatMessage(messages, getBotReply(question), "bot");
  });

  addChatMessage(messages, "Hi, I am your FarmShield AI assistant. Ask me about live sensor readings.", "bot");
}

initChatbot();

onValue(
  ref(db, databasePaths.temperature),
  (snap) => {
    const val = snap.val();
    update("temp", val, " C");

    if (val === null || val === undefined) {
      setAlert("alert-temp", "Waiting for temperature data", "orange");
      return;
    }

    setAlert(
      "alert-temp",
      val > 35 ? "High Temperature" : "Temperature Normal",
      val > 35 ? "red" : "green"
    );
  },
  (error) => showDatabaseError("temp", "temperature", error)
);

onValue(
  ref(db, databasePaths.humidity),
  (snap) => update("hum", snap.val(), " %"),
  (error) => showDatabaseError("hum", "humidity", error)
);

onValue(
  ref(db, databasePaths.soilMoisture),
  (snap) => {
    const val = snap.val();
    update("soil", val, " %");

    if (val === null || val === undefined) {
      setAlert("alert-soil", "Waiting for soil moisture data", "orange");
      return;
    }

    setAlert(
      "alert-soil",
      val < 30 ? "Low Soil Moisture" : "Soil Moisture Normal",
      val < 30 ? "orange" : "green"
    );
  },
  (error) => showDatabaseError("soil", "soilMoisture", error)
);

onValue(
  ref(db, databasePaths.phLevel),
  (snap) => update("ph", snap.val()),
  (error) => showDatabaseError("ph", "pH", error)
);
