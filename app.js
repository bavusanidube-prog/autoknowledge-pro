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
  workshopAdvice: document.getElementById("workshopAdvice"),
  steps: document.getElementById("steps"),

  code: document.getElementById("code"),
  codeOut: document.getElementById("codeOut"),
  obdTip: document.getElementById("obdTip"),

  reportList: document.getElementById("reportList"),
  reportSearch: document.getElementById("reportSearch"),
  reportSort: document.getElementById("reportSort"),

  reportsCount: document.getElementById("reportsCount"),
  selectedFaultLabel: document.getElementById("selectedFaultLabel"),
  heroConfidence: document.getElementById("heroConfidence"),
  confidenceRing: document.getElementById("confidenceRing"),
  confidenceRingValue: document.getElementById("confidenceRingValue"),

  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  runAiBtn: document.getElementById("runAiBtn"),
  saveReportBtn: document.getElementById("saveReportBtn"),
  lookupBtn: document.getElementById("lookupBtn"),
  loadReportsBtn: document.getElementById("loadReportsBtn")
};

let lastReport = null;
let allReports = [];

const diagnosticsMap = {
  overheat: {
    label: "Overheating",
    fault: "Cooling System Failure",
    confidence: 92,
    explanation:
      "The symptom pattern suggests the cooling system is not regulating temperature correctly. Common causes include low coolant level, thermostat failure, radiator airflow restriction, or a weak water pump.",
    advice:
      "Start with coolant level, leaks, thermostat behaviour, and radiator fan operation before replacing major components.",
    steps: [
      "Inspect coolant level and check for visible leaks.",
      "Test thermostat opening temperature.",
      "Inspect radiator fans, relay operation, and airflow path.",
      "Check water pump operation and belt condition.",
      "Pressure test the cooling system."
    ]
  },
  no_start: {
    label: "No Start",
    fault: "Starting System or Fuel Delivery Fault",
    confidence: 89,
    explanation:
      "A no-start condition often comes from battery voltage issues, starter circuit faults, immobilizer problems, or lack of spark or fuel delivery.",
    advice:
      "Confirm battery and starter health first, then separate spark, fuel, and immobilizer issues to avoid guesswork.",
    steps: [
      "Measure battery voltage under load.",
      "Inspect starter motor, relay, and crank signal.",
      "Verify fuel pump prime and fuel pressure.",
      "Check ignition spark quality.",
      "Scan for immobilizer and ECU faults."
    ]
  },
  misfire: {
    label: "Misfire",
    fault: "Ignition or Fuel Misfire",
    confidence: 94,
    explanation:
      "Misfires are commonly caused by worn spark plugs, weak ignition coils, vacuum leaks, injector imbalance, or compression issues.",
    advice:
      "Use live data and cylinder-specific checks before replacing multiple ignition parts at once.",
    steps: [
      "Scan live misfire counters.",
      "Inspect spark plugs and ignition coils.",
      "Check injector pulse and fuel trims.",
      "Inspect intake for vacuum leaks.",
      "Perform compression test if needed."
    ]
  },
  battery: {
    label: "Battery Drain",
    fault: "Parasitic Draw or Charging System Issue",
    confidence: 87,
    explanation:
      "Battery drain usually points to excessive key-off current draw, failing battery health, or poor charging system performance.",
    advice:
      "Separate charging faults from key-off current draw before replacing the battery unnecessarily.",
    steps: [
      "Test battery state of health.",
      "Measure charging voltage with engine running.",
      "Perform a parasitic draw test.",
      "Isolate draining circuits by pulling fuses one at a time.",
      "Inspect alternator output and grounding points."
    ]
  },
  rough_idle: {
    label: "Rough Idle",
    fault: "Air-Fuel Balance or Idle Control Issue",
    confidence: 88,
    explanation:
      "Rough idle often indicates dirty throttle components, vacuum leaks, MAF contamination, weak ignition, or unstable fuel delivery.",
    advice:
      "Check airflow measurement and intake sealing before replacing fuel components.",
    steps: [
      "Inspect and clean throttle body if required.",
      "Check for intake and vacuum leaks.",
      "Review short-term and long-term fuel trims.",
      "Test MAF sensor readings.",
      "Inspect ignition system condition."
    ]
  }
};

const obdMap = {
  P0101: "Mass Air Flow Sensor Range/Performance Problem",
  P0118: "Engine Coolant Temperature Circuit High Input",
  P0171: "System Too Lean (Bank 1)",
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0442: "Evaporative Emission System Leak Detected (Small Leak)",
  P0455: "Evaporative Emission System Leak Detected (Large Leak)",
  P0500: "Vehicle Speed Sensor Malfunction"
};

function setMessage(target, text, type = "") {
  target.textContent = text;
  target.className = "message";
  if (type) {
    target.classList.add(type);
  }
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

  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

function updateConfidenceUI(confidenceValue) {
  const numeric = Number(confidenceValue);
  const safeValue = Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
  const angle = safeValue * 3.6;

  el.confidenceRing.style.background =
    `radial-gradient(circle at center, rgba(6, 11, 23, 0.96) 56%, transparent 57%), conic-gradient(var(--accent) ${angle}deg, rgba(255, 255, 255, 0.08) 0deg)`;

  el.confidenceRingValue.textContent = safeValue ? `${safeValue}%` : "--";
  el.heroConfidence.textContent = safeValue ? `${safeValue}%` : "--";
}

function updateSelectedFaultLabel() {
  const selected = diagnosticsMap[el.fault.value];
  el.selectedFaultLabel.textContent = selected ? selected.label : "Unknown";
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
  el.reportsCount.textContent = String(reports.length);

  if (!reports.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No reports found for this account yet.";
    el.reportList.appendChild(empty);
    return;
  }

  const summary = document.createElement("div");
  summary.className = "empty-state";
  summary.textContent = `${reports.length} report${reports.length === 1 ? "" : "s"} available`;

  const fragment = document.createDocumentFragment();
  fragment.appendChild(summary);

  reports.forEach((report) => {
    fragment.appendChild(createReportCard(report));
  });

  el.reportList.appendChild(fragment);
}

function applyReportFilters() {
  const query = el.reportSearch.value.trim().toLowerCase();
  const sortMode = el.reportSort.value;

  let filtered = [...allReports];

  if (query) {
    filtered = filtered.filter((report) => {
      const haystack = [
        report.fault,
        report.explanation,
        report.steps
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  filtered.sort((a, b) => {
    if (sortMode === "oldest") {
      return new Date(formatDate(a.createdAt)).getTime() - new Date(formatDate(b.createdAt)).getTime();
    }

    if (sortMode === "confidence") {
      return (b.confidence || 0) - (a.confidence || 0);
    }

    return new Date(formatDate(b.createdAt)).getTime() - new Date(formatDate(a.createdAt)).getTime();
  });

  renderReports(filtered);
}

function runAI() {
  const selection = el.fault.value;
  const diagnostic = diagnosticsMap[selection];

  if (!diagnostic) {
    el.result.textContent = "Unknown fault selection";
    el.confidence.textContent = "--";
    el.aiExplain.textContent = "No analysis available.";
    el.workshopAdvice.textContent = "No workshop advice available.";
    el.steps.textContent = "No steps available.";
    lastReport = null;
    el.saveReportBtn.disabled = true;
    updateConfidenceUI(0);
    updateSelectedFaultLabel();
    return;
  }

  const stepsText = diagnostic.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  lastReport = {
    fault: diagnostic.fault,
    confidence: diagnostic.confidence,
    explanation: diagnostic.explanation,
    steps: stepsText
  };

  el.result.textContent = diagnostic.fault;
  el.confidence.textContent = `${diagnostic.confidence}%`;
  el.aiExplain.textContent = diagnostic.explanation;
  el.workshopAdvice.textContent = diagnostic.advice;
  el.steps.textContent = stepsText;
  el.saveReportBtn.disabled = false;

  updateConfidenceUI(diagnostic.confidence);
  updateSelectedFaultLabel();
  setMessage(el.reportMessage, "Analysis complete. You can now save this report.", "success");
}

function analyzeObdCodes() {
  const raw = el.code.value.trim();

  if (!raw) {
    el.codeOut.textContent = "Enter at least one OBD code.";
    el.obdTip.textContent = "Use commas to analyze multiple codes together.";
    return;
  }

  const codes = raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  const output = codes.map((code) => {
    const meaning = obdMap[code] || "Code not found in local lookup table.";
    return `${code} = ${meaning}`;
  });

  el.codeOut.textContent = output.join("\n");

  el.obdTip.textContent = codes.length > 1
    ? "Multiple DTCs often point to a shared upstream cause. Diagnose the root system first."
    : "Single-code analysis is strongest when combined with live data, freeze frame, and symptom history.";
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

    setMessage(el.authMessage, "Account created successfully. You can now use cloud features.", "success");
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
    el.reportsCount.textContent = "0";
    allReports = [];
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
    allReports = await getMyReports();
    applyReportFilters();
  } catch (error) {
    el.reportList.innerHTML = "";
    el.reportsCount.textContent = "0";

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
  el.fault.addEventListener("change", updateSelectedFaultLabel);
  el.reportSearch.addEventListener("input", applyReportFilters);
  el.reportSort.addEventListener("change", applyReportFilters);
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
  el.saveReportBtn.disabled = true;
  updateSelectedFaultLabel();
  updateConfidenceUI(0);
  initializeAuthUI();
  runAI();
}

init();