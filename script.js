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
