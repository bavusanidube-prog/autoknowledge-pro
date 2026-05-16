import {
  loginUser,
  signupUser,
  logoutUser,
  watchAuthState,
  saveReport,
  getMyReports
} from "./firebase.js";

/* =========================================================
   DOM
========================================================= */

const el = {
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  userStatus: document.getElementById("userStatus"),
  logoutBtn: document.getElementById("logoutBtn"),

  authMessage: document.getElementById("authMessage"),
  profileMessage: document.getElementById("profileMessage"),
  invoiceMessage: document.getElementById("invoiceMessage"),
  reportMessage: document.getElementById("reportMessage"),

  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  vehicleMake: document.getElementById("vehicleMake"),
  vehicleModel: document.getElementById("vehicleModel"),
  vehicleReg: document.getElementById("vehicleReg"),
  vehicleMileage: document.getElementById("vehicleMileage"),
  serviceNotes: document.getElementById("serviceNotes"),

  symptomSelect: document.getElementById("symptomSelect"),
  symptomResult: document.getElementById("symptomResult"),
  checkSymptomBtn: document.getElementById("checkSymptomBtn"),

  warningSearch: document.getElementById("warningSearch"),
  warningCategory: document.getElementById("warningCategory"),
  warningLightResults: document.getElementById("warningLightResults"),

  fault: document.getElementById("fault"),
  result: document.getElementById("result"),
  confidence: document.getElementById("confidence"),
  aiExplain: document.getElementById("aiExplain"),
  steps: document.getElementById("steps"),

  scanState: document.getElementById("scanState"),
  scanPhase: document.getElementById("scanPhase"),
  scanPercent: document.getElementById("scanPercent"),
  scanProgress: document.getElementById("scanProgress"),

  liveFeed: document.getElementById("liveFeed"),

  moduleEngine: document.getElementById("moduleEngine"),
  moduleIgnition: document.getElementById("moduleIgnition"),
  moduleFuel: document.getElementById("moduleFuel"),
  moduleEmissions: document.getElementById("moduleEmissions"),

  code: document.getElementById("code"),
  codeOut: document.getElementById("codeOut"),

  labourHours: document.getElementById("labourHours"),
  hourlyRate: document.getElementById("hourlyRate"),
  partsCost: document.getElementById("partsCost"),
  vatRate: document.getElementById("vatRate"),
  paymentStatus: document.getElementById("paymentStatus"),

  labourTotal: document.getElementById("labourTotal"),
  subTotal: document.getElementById("subTotal"),
  vatTotal: document.getElementById("vatTotal"),
  grandTotal: document.getElementById("grandTotal"),
  invoiceStatus: document.getElementById("invoiceStatus"),

  totalReports: document.getElementById("totalReports"),
  totalCustomers: document.getElementById("totalCustomers"),
  totalVehicles: document.getElementById("totalVehicles"),
  totalRevenue: document.getElementById("totalRevenue"),

  totalReportsMirror: document.getElementById("totalReportsMirror"),
  totalRevenueMirror: document.getElementById("totalRevenueMirror"),

  avgConfidence: document.getElementById("avgConfidence"),
  topFault: document.getElementById("topFault"),

  recentActivity: document.getElementById("recentActivity"),

  reportSearch: document.getElementById("reportSearch"),
  reportSort: document.getElementById("reportSort"),
  reportList: document.getElementById("reportList"),

  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),

  runAiBtn: document.getElementById("runAiBtn"),
  saveReportBtn: document.getElementById("saveReportBtn"),
  lookupBtn: document.getElementById("lookupBtn"),

  calculateInvoiceBtn: document.getElementById("calculateInvoiceBtn"),

  loadReportsBtn: document.getElementById("loadReportsBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn")
};

/* =========================================================
   APP STATE
========================================================= */

let allReports = [];
let lastReport = null;
let lastInvoice = null;

let activeSessionId = createSessionId();

/* =========================================================
   UTILITIES
========================================================= */

function createSessionId() {
  return `AKP-${Math.floor(1000 + Math.random() * 9000)}`;
}

function money(v) {
  return `£${Number(v || 0).toFixed(2)}`;
}

function setText(target, value) {
  if (target) target.textContent = value;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setLoading(btn, state, text = "Loading...") {
  if (!btn) return;

  if (state) {
    btn.dataset.old = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.old || btn.textContent;
    btn.disabled = false;
  }
}

function setMessage(target, text, type = "") {
  if (!target) return;

  target.className = "message";

  if (type) target.classList.add(type);

  target.textContent = text;
}

/* =========================================================
   LIVE FEED
========================================================= */

function addFeedLine(text) {
  if (!el.liveFeed) return;

  const line = document.createElement("div");

  line.className = "feed-line";

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  line.innerHTML = `<span>[${time}]</span> ${escapeHtml(text)}`;

  el.liveFeed.appendChild(line);

  el.liveFeed.scrollTop = el.liveFeed.scrollHeight;
}

function resetFeed() {
  if (!el.liveFeed) return;

  el.liveFeed.innerHTML = "";

  addFeedLine("Diagnostic console initialised.");
}

/* =========================================================
   MODULE STATES
========================================================= */

function setModuleState(module, state, label) {
  if (!module) return;

  module.classList.remove(
    "scanning",
    "complete",
    "warning",
    "flagged"
  );

  if (state) {
    module.classList.add(state);
  }

  const strong = module.querySelector("strong");

  if (strong) strong.textContent = label;
}

function resetModules() {
  setModuleState(el.moduleEngine, "", "Waiting");
  setModuleState(el.moduleIgnition, "", "Waiting");
  setModuleState(el.moduleFuel, "", "Waiting");
  setModuleState(el.moduleEmissions, "", "Waiting");
}

/* =========================================================
   SCAN UI
========================================================= */

function setScanProgress(percent, phase) {
  if (el.scanPercent) {
    el.scanPercent.textContent = `${percent}%`;
  }

  if (el.scanProgress) {
    el.scanProgress.style.width = `${percent}%`;
  }

  if (el.scanPhase) {
    el.scanPhase.textContent = phase;
  }
}

/* =========================================================
   WARNING LIGHT DATABASE
========================================================= */

const warningLights = [
  {
    title: "Engine Management Light",
    category: "engine",
    severity: "Amber",
    description: "The engine control system has detected a fault.",
    safe: "Drive carefully and avoid hard acceleration.",
    mot: "May fail MOT if emissions are affected."
  },

  {
    title: "Battery Warning Light",
    category: "battery",
    severity: "Red",
    description: "Charging system issue detected.",
    safe: "Vehicle may stop once battery power drops.",
    mot: "May affect electrical systems and MOT."
  },

  {
    title: "ABS Warning Light",
    category: "abs",
    severity: "Amber",
    description: "ABS system may not function correctly.",
    safe: "Normal braking may remain but ABS assistance may fail.",
    mot: "Likely MOT failure if warning light remains on."
  }
];

/* =========================================================
   DIAGNOSTIC DATABASE
========================================================= */

const diagnosticRules = {
  overheat: {
    title: "Cooling System Fault",
    confidence: 86,
    urgency: "Critical",

    explanation:
      "The cooling system is showing overheating behaviour linked to coolant flow or thermal regulation issues.",

    causes: [
      "Low coolant level",
      "Coolant leak",
      "Thermostat stuck closed",
      "Radiator fan fault",
      "Water pump failure"
    ],

    checks: [
      "Allow engine to cool",
      "Check coolant level",
      "Pressure test cooling system",
      "Check radiator fan operation"
    ]
  },

  misfire: {
    title: "Ignition / Fuel Misfire",
    confidence: 88,
    urgency: "High",

    explanation:
      "Engine misfire behaviour detected. Ignition and fuel systems require inspection.",

    causes: [
      "Ignition coil failure",
      "Spark plug wear",
      "Fuel injector imbalance",
      "Vacuum leak"
    ],

    checks: [
      "Scan for P0300 series codes",
      "Inspect spark plugs",
      "Test ignition coils",
      "Check injector pulse"
    ]
  },

  no_start: {
    title: "Starting System Fault",
    confidence: 81,
    urgency: "High",

    explanation:
      "Vehicle starting failure linked to battery, starter, immobiliser or fuel delivery.",

    causes: [
      "Weak battery",
      "Starter motor failure",
      "Immobiliser fault",
      "Fuel pump issue"
    ],

    checks: [
      "Check battery voltage",
      "Check starter relay",
      "Inspect immobiliser system",
      "Verify fuel pressure"
    ]
  },

  battery: {
    title: "Charging System Fault",
    confidence: 83,
    urgency: "Medium",

    explanation:
      "Charging system irregularities detected. Alternator or battery performance issue likely.",

    causes: [
      "Alternator fault",
      "Weak battery",
      "Broken auxiliary belt",
      "Poor battery terminals"
    ],

    checks: [
      "Check charging voltage",
      "Inspect auxiliary belt",
      "Inspect terminals",
      "Test battery condition"
    ]
  },

  rough_idle: {
    title: "Idle Stability Fault",
    confidence: 74,
    urgency: "Medium",

    explanation:
      "Unstable idle behaviour detected. Air/fuel balance or idle control issue possible.",

    causes: [
      "Dirty throttle body",
      "Vacuum leak",
      "MAF sensor fault",
      "Ignition imbalance"
    ],

    checks: [
      "Inspect throttle body",
      "Check for vacuum leaks",
      "Check live sensor data",
      "Check ignition performance"
    ]
  }
};

/* =========================================================
   SYMPTOM MAP
========================================================= */

const symptomMap = {
  overheating: "overheat",
  battery_warning: "battery",
  clicking_noise: "no_start",
  misfire: "misfire",
  loss_power: "rough_idle",
  smoke_exhaust: "misfire",
  wont_start: "no_start",
  rough_idle: "rough_idle",
  brake_warning: "battery"
};

/* =========================================================
   OBD DATABASE
========================================================= */

const obdCodes = {
  P0300: "Random / Multiple Cylinder Misfire",
  P0171: "System Too Lean",
  P0420: "Catalyst Efficiency Below Threshold",
  P0101: "MAF Sensor Performance Fault"
};

/* =========================================================
   DIAGNOSIS GENERATOR
========================================================= */

function generateDiagnosis(key) {
  const rule = diagnosticRules[key];

  if (!rule) return null;

  return {
    sessionId: activeSessionId,
    ...rule
  };
}

/* =========================================================
   SYMPTOM CHECKER
========================================================= */

function renderSymptomResult() {
  const value = el.symptomSelect?.value;

  if (!value) return;

  const diagnosticKey = symptomMap[value];

  const diagnosis = generateDiagnosis(diagnosticKey);

  if (!diagnosis) return;

  el.symptomResult.innerHTML = `
    <div class="symptom-card">
      <h3>${diagnosis.title}</h3>

      <div class="symptom-meta">
        <span>Confidence ${diagnosis.confidence}%</span>
        <span>${diagnosis.urgency} urgency</span>
      </div>

      <p>${diagnosis.explanation}</p>

      <h4>Likely Causes</h4>

      <ul>
        ${diagnosis.causes
          .map(c => `<li>${c}</li>`)
          .join("")}
      </ul>
    </div>
  `;

  if (el.fault) {
    el.fault.value = diagnosticKey;
  }
}

/* =========================================================
   WARNING LIGHT SEARCH
========================================================= */

function renderWarningLights() {
  const q = (el.warningSearch?.value || "").toLowerCase();

  const category = el.warningCategory?.value || "all";

  const filtered = warningLights.filter(item => {
    const matchText =
      `${item.title} ${item.description}`.toLowerCase();

    const searchMatch = matchText.includes(q);

    const categoryMatch =
      category === "all" ||
      category === item.category;

    return searchMatch && categoryMatch;
  });

  el.warningLightResults.innerHTML = filtered
    .map(item => {
      return `
        <div class="warning-card">
          <h3>${item.title}</h3>

          <div class="warning-meta">
            <span>${item.severity}</span>
            <span>${item.category}</span>
          </div>

          <p>${item.description}</p>

          <h4>Safe To Drive</h4>
          <p>${item.safe}</p>

          <h4>MOT Impact</h4>
          <p>${item.mot}</p>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   OBD LOOKUP
========================================================= */

function lookupCode() {
  const code =
    (el.code?.value || "")
      .trim()
      .toUpperCase();

  if (!code) return;

  const result = obdCodes[code];

  el.codeOut.textContent =
    result || "Unknown fault code";
}

/* =========================================================
   INVOICE
========================================================= */

function calculateInvoice() {
  const labourHours =
    Number(el.labourHours?.value || 0);

  const hourlyRate =
    Number(el.hourlyRate?.value || 0);

  const partsCost =
    Number(el.partsCost?.value || 0);

  const vatRate =
    Number(el.vatRate?.value || 0);

  const labourTotal =
    labourHours * hourlyRate;

  const subTotal =
    labourTotal + partsCost;

  const vatTotal =
    subTotal * (vatRate / 100);

  const grandTotal =
    subTotal + vatTotal;

  lastInvoice = {
    labourTotal,
    subTotal,
    vatTotal,
    grandTotal
  };

  setText(el.labourTotal, money(labourTotal));
  setText(el.subTotal, money(subTotal));
  setText(el.vatTotal, money(vatTotal));
  setText(el.grandTotal, money(grandTotal));

  setText(
    el.invoiceStatus,
    el.paymentStatus?.value || "Unpaid"
  );
}

/* =========================================================
   LIVE DIAGNOSTIC ENGINE
========================================================= */

async function runAI() {
  const selected =
    el.fault?.value || "misfire";

  const diagnosis =
    generateDiagnosis(selected);

  if (!diagnosis) return;

  resetFeed();
  resetModules();

  setLoading(
    el.runAiBtn,
    true,
    "Scanning..."
  );

  setText(el.result, "Scanning...");
  setText(el.confidence, "--");
  setText(el.aiExplain, "");

  if (el.scanState) {
    el.scanState.textContent = "SCANNING";
  }

  setScanProgress(
    6,
    "Initialising vehicle session"
  );

  addFeedLine(
    `Vehicle session ${diagnosis.sessionId} started.`
  );

  await wait(600);

  setScanProgress(
    18,
    "Checking engine control systems"
  );

  setModuleState(
    el.moduleEngine,
    "scanning",
    "Scanning"
  );

  addFeedLine(
    "Reading engine control module response..."
  );

  await wait(700);

  setModuleState(
    el.moduleEngine,
    "complete",
    "Complete"
  );

  setScanProgress(
    34,
    "Analysing ignition behaviour"
  );

  setModuleState(
    el.moduleIgnition,
    "scanning",
    "Analysing"
  );

  addFeedLine(
    "Comparing ignition patterns against known faults..."
  );

  await wait(800);

  if (selected === "misfire") {
    setModuleState(
      el.moduleIgnition,
      "warning",
      "Warning"
    );

    addFeedLine(
      "Ignition instability detected."
    );
  } else {
    setModuleState(
      el.moduleIgnition,
      "complete",
      "Complete"
    );
  }

  setScanProgress(
    57,
    "Checking fuel delivery systems"
  );

  setModuleState(
    el.moduleFuel,
    "scanning",
    "Analysing"
  );

  addFeedLine(
    "Checking fuel trim and injector behaviour..."
  );

  await wait(850);

  setModuleState(
    el.moduleFuel,
    "complete",
    "Complete"
  );

  setScanProgress(
    78,
    "Reviewing emissions and MOT risk"
  );

  setModuleState(
    el.moduleEmissions,
    "scanning",
    "Reviewing"
  );

  addFeedLine(
    "Calculating MOT and emissions impact..."
  );

  await wait(900);

  setModuleState(
    el.moduleEmissions,
    "flagged",
    "Flagged"
  );

  setScanProgress(
    92,
    "Generating workshop report"
  );

  addFeedLine(
    `Primary fault group identified: ${diagnosis.title}`
  );

  addFeedLine(
    `Confidence score updated: ${diagnosis.confidence}%`
  );

  await wait(1000);

  setText(
    el.result,
    diagnosis.title
  );

  setText(
    el.confidence,
    `${diagnosis.confidence}%`
  );

  setText(
    el.aiExplain,
    diagnosis.explanation
  );

  setText(
    el.steps,
    diagnosis.checks
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n")
  );

  setScanProgress(
    100,
    "Diagnostic analysis complete"
  );

  if (el.scanState) {
    el.scanState.textContent = "COMPLETE";
  }

  addFeedLine(
    "Recommended diagnostic workflow generated."
  );

  addFeedLine(
    "Report ready to save."
  );

  lastReport = diagnosis;

  if (el.saveReportBtn) {
    el.saveReportBtn.disabled = false;
  }

  setMessage(
    el.reportMessage,
    "Analysis complete.",
    "success"
  );

  setLoading(el.runAiBtn, false);
}

/* =========================================================
   REPORT SAVE
========================================================= */

async function saveCurrentReport() {
  if (!lastReport) {
    setMessage(
      el.reportMessage,
      "Run analysis first.",
      "error"
    );

    return;
  }

  setLoading(
    el.saveReportBtn,
    true,
    "Saving..."
  );

  try {
    const payload = {
      sessionId: activeSessionId,

      customerName:
        el.customerName?.value || "",

      customerPhone:
        el.customerPhone?.value || "",

      vehicleMake:
        el.vehicleMake?.value || "",

      vehicleModel:
        el.vehicleModel?.value || "",

      vehicleReg:
        el.vehicleReg?.value || "",

      vehicleMileage:
        el.vehicleMileage?.value || "",

      serviceNotes:
        el.serviceNotes?.value || "",

      ...lastReport,

      ...(lastInvoice || {})
    };

    await saveReport(payload);

    setMessage(
      el.reportMessage,
      "Report saved successfully.",
      "success"
    );

    activeSessionId =
      createSessionId();

  } catch (err) {
    setMessage(
      el.reportMessage,
      err.message || "Save failed.",
      "error"
    );
  }

  setLoading(el.saveReportBtn, false);
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports(list) {
  if (!el.reportList) return;

  el.reportList.innerHTML = "";

  if (!list.length) {
    el.reportList.innerHTML =
      "<p>No reports found.</p>";

    return;
  }

  list.forEach(report => {
    const card =
      document.createElement("div");

    card.className = "report-card";

    card.innerHTML = `
      <h3>${escapeHtml(report.title || report.fault || "Diagnostic Report")}</h3>

      <div class="report-meta">
        <strong>Session:</strong>
        ${escapeHtml(report.sessionId || "N/A")}
      </div>

      <div class="report-meta">
        <strong>Vehicle:</strong>
        ${escapeHtml(report.vehicleMake || "")}
        ${escapeHtml(report.vehicleModel || "")}
      </div>

      <div class="report-meta">
        <strong>Registration:</strong>
        ${escapeHtml(report.vehicleReg || "N/A")}
      </div>

      <div class="report-meta">
        <strong>Confidence:</strong>
        ${escapeHtml(report.confidence || 0)}%
      </div>

      <div class="report-meta">
        <strong>Invoice Total:</strong>
        ${money(report.grandTotal || 0)}
      </div>

      <pre>
${escapeHtml(report.explanation || "")}
      </pre>
    `;

    el.reportList.appendChild(card);
  });
}

async function loadReports() {
  setLoading(
    el.loadReportsBtn,
    true,
    "Loading..."
  );

  try {
    allReports =
      await getMyReports();

    renderReports(allReports);

    updateStats();

  } catch (err) {
    setMessage(
      el.reportMessage,
      err.message || "Failed to load reports.",
      "error"
    );
  }

  setLoading(el.loadReportsBtn, false);
}

/* =========================================================
   DASHBOARD STATS
========================================================= */

function updateStats() {
  const totalReports =
    allReports.length;

  let totalRevenue = 0;
  let confidenceTotal = 0;

  const customerSet =
    new Set();

  const vehicleSet =
    new Set();

  const faultCount = {};

  allReports.forEach(report => {
    totalRevenue +=
      Number(report.grandTotal || 0);

    confidenceTotal +=
      Number(report.confidence || 0);

    if (report.customerName) {
      customerSet.add(
        report.customerName
      );
    }

    if (report.vehicleReg) {
      vehicleSet.add(
        report.vehicleReg
      );
    }

    const fault =
      report.title ||
      report.fault ||
      "Unknown";

    faultCount[fault] =
      (faultCount[fault] || 0) + 1;
  });

  let topFault = "N/A";
  let topCount = 0;

  Object.entries(faultCount)
    .forEach(([fault, count]) => {
      if (count > topCount) {
        topFault = fault;
        topCount = count;
      }
    });

  const avg =
    totalReports
      ? Math.round(
          confidenceTotal /
            totalReports
        )
      : 0;

  setText(
    el.totalReports,
    totalReports
  );

  setText(
    el.totalReportsMirror,
    totalReports
  );

  setText(
    el.totalCustomers,
    customerSet.size
  );

  setText(
    el.totalVehicles,
    vehicleSet.size
  );

  setText(
    el.totalRevenue,
    money(totalRevenue)
  );

  setText(
    el.totalRevenueMirror,
    money(totalRevenue)
  );

  setText(
    el.avgConfidence,
    `${avg}%`
  );

  setText(
    el.topFault,
    topFault
  );
}

/* =========================================================
   PDF EXPORT
========================================================= */

function exportPDF() {
  window.print();
}

/* =========================================================
   AUTH
========================================================= */

async function login() {
  setLoading(
    el.loginBtn,
    true,
    "Logging in..."
  );

  try {
    await loginUser(
      el.email.value,
      el.password.value
    );

    setMessage(
      el.authMessage,
      "Logged in.",
      "success"
    );

  } catch (err) {
    setMessage(
      el.authMessage,
      err.message || "Login failed.",
      "error"
    );
  }

  setLoading(el.loginBtn, false);
}

async function signup() {
  setLoading(
    el.signupBtn,
    true,
    "Creating..."
  );

  try {
    await signupUser(
      el.email.value,
      el.password.value
    );

    setMessage(
      el.authMessage,
      "Account created.",
      "success"
    );

  } catch (err) {
    setMessage(
      el.authMessage,
      err.message || "Signup failed.",
      "error"
    );
  }

  setLoading(el.signupBtn, false);
}

async function logout() {
  await logoutUser();
}

watchAuthState(user => {
  if (user) {
    el.userStatus.textContent =
      `Logged in: ${user.email}`;

    if (el.logoutBtn) {
      el.logoutBtn.hidden = false;
    }

  } else {
    el.userStatus.textContent =
      "Not logged in";

    if (el.logoutBtn) {
      el.logoutBtn.hidden = true;
    }
  }
});

/* =========================================================
   EVENTS
========================================================= */

if (el.loginBtn)
  el.loginBtn.onclick = login;

if (el.signupBtn)
  el.signupBtn.onclick = signup;

if (el.logoutBtn)
  el.logoutBtn.onclick = logout;

if (el.checkSymptomBtn)
  el.checkSymptomBtn.onclick =
    renderSymptomResult;

if (el.warningSearch)
  el.warningSearch.oninput =
    renderWarningLights;

if (el.warningCategory)
  el.warningCategory.onchange =
    renderWarningLights;

if (el.lookupBtn)
  el.lookupBtn.onclick =
    lookupCode;

if (el.calculateInvoiceBtn)
  el.calculateInvoiceBtn.onclick =
    calculateInvoice;

if (el.runAiBtn)
  el.runAiBtn.onclick = runAI;

if (el.saveReportBtn)
  el.saveReportBtn.onclick =
    saveCurrentReport;

if (el.loadReportsBtn)
  el.loadReportsBtn.onclick =
    loadReports;

if (el.exportPdfBtn)
  el.exportPdfBtn.onclick =
    exportPDF;

/* =========================================================
   INIT
========================================================= */

resetFeed();
renderWarningLights();
calculateInvoice();

if (el.saveReportBtn) {
  el.saveReportBtn.disabled = true;
}
