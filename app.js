import {
  loginUser,
  signupUser,
  logoutUser,
  watchAuthState,
  saveReport,
  getMyReports
} from "./firebase.js";

const el = {
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  userStatus: document.getElementById("userStatus"),
  authMessage: document.getElementById("authMessage"),
  reportMessage: document.getElementById("reportMessage"),
  logoutBtn: document.getElementById("logoutBtn"),

  fault: document.getElementById("fault"),
  result: document.getElementById("result"),
  confidence: document.getElementById("confidence"),
  aiExplain: document.getElementById("aiExplain"),
  steps: document.getElementById("steps"),

  code: document.getElementById("code"),
  codeOut: document.getElementById("codeOut"),

  reportList: document.getElementById("reportList"),

  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  runAiBtn: document.getElementById("runAiBtn"),
  saveReportBtn: document.getElementById("saveReportBtn"),
  lookupBtn: document.getElementById("lookupBtn"),
  loadReportsBtn: document.getElementById("loadReportsBtn")
};

let lastReport = null;

const diagnosticsMap = {
  overheat: {
    fault: "Cooling System Failure",
    confidence: 92,
    explanation:
      "The symptom pattern suggests the cooling system is not regulating temperature correctly. Common causes include low coolant level, thermostat failure, radiator airflow restriction, or a weak water pump.",
    steps: [
      "Inspect coolant level and check for visible leaks",
      "Test thermostat opening temperature",
      "Inspect radiator fans and airflow path",
      "Check water pump operation and belt condition",
      "Pressure test the cooling system"
    ]
  },
  no_start: {
    fault: "Starting System / Fuel Delivery Fault",
    confidence: 89,
    explanation:
      "A no-start condition often comes from battery voltage issues, starter circuit faults, immobilizer problems, or lack of spark/fuel delivery.",
    steps: [
      "Measure battery voltage under load",
      "Inspect starter motor and relay operation",
      "Verify fuel pump prime and fuel pressure",
      "Check ignition spark",
      "Scan for immobilizer and ECU faults"
    ]
  },
  misfire: {
    fault: "Ignition or Fuel Misfire",
    confidence: 94,
    explanation:
      "Misfires are commonly caused by worn spark plugs, weak ignition coils, vacuum leaks, injector imbalance, or compression issues.",
    steps: [
      "Scan live misfire counters",
      "Inspect spark plugs and ignition coils",
      "Check injector pulse and fuel trims",
      "Inspect intake for vacuum leaks",
      "Perform compression test if needed"
    ]
  },
  battery: {
    fault: "Parasitic Draw / Charging System Issue",
    confidence: 87,
    explanation:
      "Battery drain usually points to excessive key-off current draw, failing battery health, or poor charging system performance.",
    steps: [
      "Test battery state of health",
      "Measure charging voltage with engine running",
      "Perform parasitic draw test",
      "Isolate draining circuit by pulling fuses",
      "Inspect alternator and grounding points"
    ]
  },
  rough_idle: {
    fault: "Air-Fuel Balance or Idle Control Issue",
    confidence: 88,
    explanation:
      "Rough idle often indicates dirty throttle components, vacuum leaks, MAF contamination, weak ignition, or unstable fuel delivery.",
    steps: [
      "Inspect and clean throttle body if required",
      "Check for intake and vacuum leaks",
      "Review short-term and long-term fuel trims",
      "Test MAF sensor readings",
      "Inspect ignition system condition"
    ]
  }
};

const obdMap = {
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0171: "System Too Lean (Bank 1)",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0118: "Engine Coolant Temperature Circuit High Input",
  P0101: "Mass Air Flow Sensor Range/Performance Problem"
};

function setMessage(target, text, type = "") {
  target.textContent = text;
  target.className = "message";
  if (type) target.classList.add(type);
}

function setLoading(button, isLoading, loadingText = "Loading...") {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function validateCredentials(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
}

function formatDate(value) {
  if (!value) return "Unknown date";
  if (typeof value.toDate === "function") return value.toDate().toLocaleString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

function createReportCard(report) {
  const card = document.createElement("article");
  card.className = "report-card";

  const title = document.createElement("h3");
  title.textContent = report.fault || "Untitled Report";

  const confidence = document.createElement("p");
  confidence.className = "report-meta";
  confidence.textContent = `Confidence: ${report.confidence ?? "N/A"}%`;

  const date = document.createElement("p");
  date.className = "report-meta";
  date.textContent = `Saved: ${formatDate(report.createdAt)}`;

  const explanation = document.createElement("p");
  explanation.className = "report-meta";
  explanation.textContent = report.explanation || "No explanation available.";

  const steps = document.createElement("pre");
  steps.textContent = report.steps || "No steps recorded.";

  card.append(title, confidence, date, explanation, steps);
  return card;
}

function renderReports(reports) {
  el.reportList.innerHTML = "";

  if (!reports.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No reports found for this account.";
    el.reportList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  reports.forEach((report) => fragment.appendChild(createReportCard(report)));
  el.reportList.appendChild(fragment);
}

function runAI() {
  const selection = el.fault.value;
  const diagnostic = diagnosticsMap[selection];

  if (!diagnostic) {
    el.result.textContent = "Unknown fault selection";
    el.confidence.textContent = "--";
    el.aiExplain.textContent = "No analysis available.";
    el.steps.textContent = "No steps available.";
    lastReport = null;
    return;
  }

  const stepsText = diagnostic.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");

  lastReport = {
    fault: diagnostic.fault,
    confidence: diagnostic.confidence,
    explanation: diagnostic.explanation,
    steps: stepsText
  };

  el.result.textContent = diagnostic.fault;
  el.confidence.textContent = `${diagnostic.confidence}%`;
  el.aiExplain.textContent = diagnostic.explanation;
  el.steps.textContent = stepsText;

  setMessage(el.reportMessage, "Analysis complete.", "success");
}

function analyzeObdCodes() {
  const raw = el.code.value.trim();

  if (!raw) {
    el.codeOut.textContent = "Enter at least one OBD code.";
    return;
  }

  const codes = raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const output = codes.map((code) => {
    const meaning = obdMap[code] || "Code not found in local lookup table.";
    return `${code} = ${meaning}`;
  });

  el.codeOut.textContent = output.join("\n");
}

async function handleLogin() {
  setMessage(el.authMessage, "");
  setLoading(el.loginBtn, true, "Logging in...");

  try {
    const email = el.email.value.trim();
    const password = el.password.value;

    validateCredentials(email, password);
    await loginUser(email, password);

    setMessage(el.authMessage, "Logged in successfully.", "success");
  } catch (error) {
    setMessage(el.authMessage, error.message || "Login failed.", "error");
  } finally {
    setLoading(el.loginBtn, false);
  }
}

async function handleSignup() {
  setMessage(el.authMessage, "");
  setLoading(el.signupBtn, true, "Creating account...");

  try {
    const email = el.email.value.trim();
    const password = el.password.value;

    validateCredentials(email, password);
    await signupUser(email, password);

    setMessage(el.authMessage, "Account created successfully.", "success");
  } catch (error) {
    setMessage(el.authMessage, error.message || "Sign up failed.", "error");
  } finally {
    setLoading(el.signupBtn, false);
  }
}

async function handleLogout() {
  setLoading(el.logoutBtn, true, "Logging out...");

  try {
    await logoutUser();
    setMessage(el.authMessage, "Logged out successfully.", "success");
    setMessage(el.reportMessage, "");
    el.reportList.innerHTML = "";
  } catch (error) {
    setMessage(el.authMessage, error.message || "Logout failed.", "error");
  } finally {
    setLoading(el.logoutBtn, false);
  }
}

async function handleSaveReport() {
  setMessage(el.reportMessage, "");

  if (!lastReport) {
    setMessage(el.reportMessage, "Run an analysis before saving a report.", "error");
    return;
  }

  setLoading(el.saveReportBtn, true, "Saving...");

  try {
    await saveReport(lastReport);
    setMessage(el.reportMessage, "Report saved to the cloud.", "success");
  } catch (error) {
    setMessage(el.reportMessage, error.message || "Failed to save report.", "error");
  } finally {
    setLoading(el.saveReportBtn, false);
  }
}

async function handleLoadReports() {
  setLoading(el.loadReportsBtn, true, "Loading reports...");

  try {
    const reports = await getMyReports();
    renderReports(reports);
  } catch (error) {
    el.reportList.innerHTML = "";
    const errorBox = document.createElement("div");
    errorBox.className = "empty-state";
    errorBox.textContent = error.message || "Failed to load reports.";
    el.reportList.appendChild(errorBox);
  } finally {
    setLoading(el.loadReportsBtn, false);
  }
}

function setupEventListeners() {
  el.loginBtn.addEventListener("click", handleLogin);
  el.signupBtn.addEventListener("click", handleSignup);
  el.logoutBtn.addEventListener("click", handleLogout);
  el.runAiBtn.addEventListener("click", runAI);
  el.saveReportBtn.addEventListener("click", handleSaveReport);
  el.lookupBtn.addEventListener("click", analyzeObdCodes);
  el.loadReportsBtn.addEventListener("click", handleLoadReports);
}

function initializeAuthUI() {
  watchAuthState((user) => {
    if (user) {
      el.userStatus.textContent = `Logged in: ${user.email}`;
      el.logoutBtn.hidden = false;
    } else {
      el.userStatus.textContent = "Not logged in";
      el.logoutBtn.hidden = true;
    }
  });
}

function init() {
  setupEventListeners();
  initializeAuthUI();
  runAI();
}

init();