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

  labourHours: document.getElementById("labourHours"),
  hourlyRate: document.getElementById("hourlyRate"),
  partsCost: document.getElementById("partsCost"),
  vatRate: document.getElementById("vatRate"),
  paymentStatus: document.getElementById("paymentStatus"),
  calculateInvoiceBtn: document.getElementById("calculateInvoiceBtn"),

  labourTotal: document.getElementById("labourTotal"),
  subTotal: document.getElementById("subTotal"),
  vatTotal: document.getElementById("vatTotal"),
  grandTotal: document.getElementById("grandTotal"),
  invoiceStatus: document.getElementById("invoiceStatus"),

  fault: document.getElementById("fault"),
  result: document.getElementById("result"),
  confidence: document.getElementById("confidence"),
  aiExplain: document.getElementById("aiExplain"),
  steps: document.getElementById("steps"),

  code: document.getElementById("code"),
  codeOut: document.getElementById("codeOut"),

  reportSearch: document.getElementById("reportSearch"),
  reportSort: document.getElementById("reportSort"),
  reportList: document.getElementById("reportList"),

  totalReports: document.getElementById("totalReports"),
  totalCustomers: document.getElementById("totalCustomers"),
  totalVehicles: document.getElementById("totalVehicles"),
  avgConfidence: document.getElementById("avgConfidence"),
  topFault: document.getElementById("topFault"),
  totalRevenue: document.getElementById("totalRevenue"),
  recentActivity: document.getElementById("recentActivity"),

  totalReportsMirror: document.getElementById("totalReportsMirror"),
  totalRevenueMirror: document.getElementById("totalRevenueMirror"),

  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  runAiBtn: document.getElementById("runAiBtn"),
  saveReportBtn: document.getElementById("saveReportBtn"),
  lookupBtn: document.getElementById("lookupBtn"),
  loadReportsBtn: document.getElementById("loadReportsBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn")
};

let lastReport = null;
let lastInvoice = null;
let allReports = [];

const diagnostics = {
  overheat: {
    fault: "Cooling System Failure",
    confidence: 92,
    explanation:
      "Likely thermostat, coolant loss, blocked radiator or weak water pump.",
    steps:
      "1. Check coolant level\n2. Check leaks\n3. Test thermostat\n4. Inspect radiator fan\n5. Test water pump"
  },
  no_start: {
    fault: "Starting / Fuel Delivery Fault",
    confidence: 89,
    explanation:
      "Likely battery voltage issue, starter fault, immobilizer or no fuel.",
    steps:
      "1. Check battery voltage\n2. Inspect starter relay\n3. Verify spark\n4. Verify fuel pressure"
  },
  misfire: {
    fault: "Ignition or Fuel Misfire",
    confidence: 94,
    explanation:
      "Likely spark plugs, coils, injectors, vacuum leak or compression issue.",
    steps:
      "1. Check plugs\n2. Test coils\n3. Check injector pulse\n4. Compression test"
  },
  battery: {
    fault: "Battery Drain / Charging Fault",
    confidence: 87,
    explanation:
      "Likely parasitic drain, battery wear or alternator issue.",
    steps:
      "1. Test battery health\n2. Check alternator output\n3. Perform drain test"
  },
  rough_idle: {
    fault: "Idle Air/Fuel Imbalance",
    confidence: 88,
    explanation:
      "Likely vacuum leak, dirty throttle body, MAF issue or weak ignition.",
    steps:
      "1. Inspect vacuum leaks\n2. Clean throttle body\n3. Test MAF\n4. Inspect ignition"
  }
};

const obdCodes = {
  P0300: "Random/Multiple Cylinder Misfire",
  P0171: "System Too Lean Bank 1",
  P0420: "Catalyst Efficiency Below Threshold",
  P0101: "MAF Range / Performance",
  P0500: "Vehicle Speed Sensor Fault"
};

function setMessage(target, text, type = "") {
  if (!target) return;
  target.className = "message";
  if (type) target.classList.add(type);
  target.textContent = text;
}

function setLoading(button, state, loadingText = "Loading...") {
  if (!button) return;

  if (state) {
    button.dataset.old = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.old || button.textContent;
    button.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "Unknown date";

  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function setText(target, value) {
  if (target) target.textContent = value;
}

function getProfileData() {
  return {
    customerName: el.customerName?.value.trim() || "",
    customerPhone: el.customerPhone?.value.trim() || "",
    vehicleMake: el.vehicleMake?.value.trim() || "",
    vehicleModel: el.vehicleModel?.value.trim() || "",
    vehicleReg: el.vehicleReg?.value.trim() || "",
    vehicleMileage: el.vehicleMileage?.value.trim() || "",
    serviceNotes: el.serviceNotes?.value.trim() || ""
  };
}

function validateProfile(profile) {
  if (!profile.customerName) throw new Error("Customer name is required.");
  if (!profile.vehicleMake) throw new Error("Vehicle make is required.");
  if (!profile.vehicleModel) throw new Error("Vehicle model is required.");
  if (!profile.vehicleReg) throw new Error("Registration number is required.");
}

function getInvoiceData() {
  const labourHours = Number(el.labourHours?.value || 0);
  const hourlyRate = Number(el.hourlyRate?.value || 0);
  const partsCost = Number(el.partsCost?.value || 0);
  const vatRate = Number(el.vatRate?.value || 0);

  const labourTotal = labourHours * hourlyRate;
  const subTotal = labourTotal + partsCost;
  const vatTotal = subTotal * (vatRate / 100);
  const grandTotal = subTotal + vatTotal;

  return {
    labourHours,
    hourlyRate,
    partsCost,
    vatRate,
    labourTotal,
    subTotal,
    vatTotal,
    grandTotal,
    paymentStatus: el.paymentStatus?.value || "Unpaid"
  };
}

function updateInvoiceUI(invoice) {
  setText(el.labourTotal, money(invoice.labourTotal));
  setText(el.subTotal, money(invoice.subTotal));
  setText(el.vatTotal, money(invoice.vatTotal));
  setText(el.grandTotal, money(invoice.grandTotal));

  if (el.invoiceStatus) {
    el.invoiceStatus.textContent = invoice.paymentStatus;
    el.invoiceStatus.style.color =
      invoice.paymentStatus === "Paid" ? "#22c55e" : "#f59e0b";
  }
}

function calculateInvoice() {
  lastInvoice = getInvoiceData();
  updateInvoiceUI(lastInvoice);
  setMessage(el.invoiceMessage, "Invoice calculated.", "success");
}

function runAI() {
  const item = diagnostics[el.fault?.value];
  if (!item) return;

  lastReport = item;

  setText(el.result, item.fault);
  setText(el.confidence, `${item.confidence}%`);
  setText(el.aiExplain, item.explanation);
  setText(el.steps, item.steps);

  if (el.saveReportBtn) el.saveReportBtn.disabled = false;

  setMessage(el.reportMessage, "Analysis complete. Ready to save.", "success");
}

async function login() {
  setLoading(el.loginBtn, true, "Logging in...");

  try {
    await loginUser(el.email.value, el.password.value);
    setMessage(el.authMessage, "Logged in successfully.", "success");
  } catch (error) {
    setMessage(el.authMessage, error.message || "Login failed.", "error");
  } finally {
    setLoading(el.loginBtn, false);
  }
}

async function signup() {
  setLoading(el.signupBtn, true, "Creating...");

  try {
    await signupUser(el.email.value, el.password.value);
    setMessage(el.authMessage, "Account created.", "success");
  } catch (error) {
    setMessage(el.authMessage, error.message || "Sign up failed.", "error");
  } finally {
    setLoading(el.signupBtn, false);
  }
}

async function logout() {
  try {
    await logoutUser();
    setMessage(el.authMessage, "Logged out.", "success");
  } catch (error) {
    setMessage(el.authMessage, error.message || "Logout failed.", "error");
  }
}

async function save() {
  if (!lastReport) {
    setMessage(el.reportMessage, "Run analysis first.", "error");
    return;
  }

  setLoading(el.saveReportBtn, true, "Saving...");

  try {
    const profile = getProfileData();
    validateProfile(profile);

    const invoice = lastInvoice || getInvoiceData();
    lastInvoice = invoice;
    updateInvoiceUI(invoice);

    await saveReport({
      ...lastReport,
      ...profile,
      ...invoice
    });

    setMessage(el.profileMessage, "Customer and vehicle profile attached.", "success");
    setMessage(el.invoiceMessage, "Invoice attached.", "success");
    setMessage(el.reportMessage, "Saved to cloud.", "success");
  } catch (error) {
    const message = error.message || "Save failed.";

    if (
      message.includes("Customer") ||
      message.includes("Vehicle") ||
      message.includes("Registration")
    ) {
      setMessage(el.profileMessage, message, "error");
    } else {
      setMessage(el.reportMessage, message, "error");
    }
  } finally {
    setLoading(el.saveReportBtn, false);
  }
}

function createProfileHtml(report) {
  return `
    <div class="report-meta"><strong>Customer:</strong> ${escapeHtml(report.customerName || "N/A")}</div>
    <div class="report-meta"><strong>Phone:</strong> ${escapeHtml(report.customerPhone || "N/A")}</div>
    <div class="report-meta"><strong>Vehicle:</strong> ${escapeHtml(report.vehicleMake || "")} ${escapeHtml(report.vehicleModel || "")}</div>
    <div class="report-meta"><strong>Registration:</strong> ${escapeHtml(report.vehicleReg || "N/A")}</div>
    <div class="report-meta"><strong>Mileage:</strong> ${escapeHtml(report.vehicleMileage || "N/A")}</div>
    <div class="report-meta"><strong>Service Notes:</strong> ${escapeHtml(report.serviceNotes || "N/A")}</div>
  `;
}

function createInvoiceHtml(report) {
  return `
    <div class="report-meta"><strong>Labour Hours:</strong> ${escapeHtml(report.labourHours ?? 0)}</div>
    <div class="report-meta"><strong>Hourly Rate:</strong> ${money(report.hourlyRate)}</div>
    <div class="report-meta"><strong>Parts Cost:</strong> ${money(report.partsCost)}</div>
    <div class="report-meta"><strong>VAT Rate:</strong> ${escapeHtml(report.vatRate ?? 0)}%</div>
    <div class="report-meta"><strong>Labour Total:</strong> ${money(report.labourTotal)}</div>
    <div class="report-meta"><strong>Subtotal:</strong> ${money(report.subTotal)}</div>
    <div class="report-meta"><strong>VAT Total:</strong> ${money(report.vatTotal)}</div>
    <div class="report-meta"><strong>Grand Total:</strong> ${money(report.grandTotal)}</div>
    <div class="report-meta"><strong>Payment Status:</strong> ${escapeHtml(report.paymentStatus || "Unpaid")}</div>
  `;
}

function renderReports(list) {
  if (!el.reportList) return;
  el.reportList.innerHTML = "";

  if (!list.length) {
    el.reportList.innerHTML = "<p>No reports found.</p>";
    return;
  }

  for (const report of list) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.innerHTML = `
      <h3>${escapeHtml(report.fault)}</h3>
      ${createProfileHtml(report)}
      ${createInvoiceHtml(report)}
      <div class="report-meta"><strong>Confidence:</strong> ${escapeHtml(report.confidence)}%</div>
      <div class="report-meta"><strong>Explanation:</strong> ${escapeHtml(report.explanation)}</div>
      <div class="report-meta"><strong>Saved:</strong> ${escapeHtml(formatDate(report.createdAt))}</div>
      <pre>${escapeHtml(report.steps)}</pre>
    `;
    el.reportList.appendChild(card);
  }
}

function updateDashboardStats(list) {
  const totalReports = list.length;
  const customerSet = new Set();
  const vehicleSet = new Set();
  const faultCount = {};
  let confidenceTotal = 0;
  let revenueTotal = 0;

  for (const report of list) {
    if (report.customerName) customerSet.add(report.customerName.trim().toLowerCase());
    if (report.vehicleReg) vehicleSet.add(report.vehicleReg.trim().toLowerCase());

    confidenceTotal += Number(report.confidence || 0);
    revenueTotal += Number(report.grandTotal || 0);

    const fault = report.fault || "Unknown";
    faultCount[fault] = (faultCount[fault] || 0) + 1;
  }

  let topFaultName = "N/A";
  let topCount = 0;

  for (const [fault, count] of Object.entries(faultCount)) {
    if (count > topCount) {
      topCount = count;
      topFaultName = fault;
    }
  }

  const avg = totalReports ? Math.round(confidenceTotal / totalReports) : 0;

  setText(el.totalReports, String(totalReports));
  setText(el.totalCustomers, String(customerSet.size));
  setText(el.totalVehicles, String(vehicleSet.size));
  setText(el.avgConfidence, `${avg}%`);
  setText(el.topFault, topFaultName);
  setText(el.totalRevenue, money(revenueTotal));
  setText(el.totalReportsMirror, String(totalReports));
  setText(el.totalRevenueMirror, money(revenueTotal));
}

function renderRecentActivity(list) {
  if (!el.recentActivity) return;
  el.recentActivity.innerHTML = "";

  if (!list.length) {
    el.recentActivity.innerHTML = "<p>No recent activity yet.</p>";
    return;
  }

  const recent = [...list]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  for (const report of recent) {
    const card = document.createElement("div");
    card.className = "activity-card";
    card.innerHTML = `
      <h3>${escapeHtml(report.fault)}</h3>
      <div class="report-meta"><strong>Customer:</strong> ${escapeHtml(report.customerName || "N/A")}</div>
      <div class="report-meta"><strong>Vehicle:</strong> ${escapeHtml(report.vehicleMake || "")} ${escapeHtml(report.vehicleModel || "")}</div>
      <div class="report-meta"><strong>Registration:</strong> ${escapeHtml(report.vehicleReg || "N/A")}</div>
      <div class="report-meta"><strong>Total:</strong> ${money(report.grandTotal)}</div>
      <div class="report-meta"><strong>Status:</strong> ${escapeHtml(report.paymentStatus || "Unpaid")}</div>
      <div class="report-meta"><strong>Saved:</strong> ${escapeHtml(formatDate(report.createdAt))}</div>
    `;
    el.recentActivity.appendChild(card);
  }
}

async function loadReports() {
  setLoading(el.loadReportsBtn, true, "Loading...");

  try {
    allReports = await getMyReports();
    applyFilters();
    updateDashboardStats(allReports);
    renderRecentActivity(allReports);
    setMessage(el.reportMessage, "Reports loaded.", "success");
  } catch (error) {
    setMessage(el.reportMessage, error.message || "Failed to load reports.", "error");
  } finally {
    setLoading(el.loadReportsBtn, false);
  }
}

function applyFilters() {
  let list = [...allReports];
  const q = (el.reportSearch?.value || "").toLowerCase();

  if (q) {
    list = list.filter(
      (r) =>
        (r.fault || "").toLowerCase().includes(q) ||
        (r.explanation || "").toLowerCase().includes(q) ||
        (r.steps || "").toLowerCase().includes(q) ||
        (r.customerName || "").toLowerCase().includes(q) ||
        (r.customerPhone || "").toLowerCase().includes(q) ||
        (r.vehicleMake || "").toLowerCase().includes(q) ||
        (r.vehicleModel || "").toLowerCase().includes(q) ||
        (r.vehicleReg || "").toLowerCase().includes(q) ||
        (r.serviceNotes || "").toLowerCase().includes(q) ||
        (r.paymentStatus || "").toLowerCase().includes(q)
    );
  }

  if (el.reportSort?.value === "confidence") {
    list.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  } else if (el.reportSort?.value === "oldest") {
    list.sort((a, b) => {
      const aTime = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime();
      return aTime - bTime;
    });
  } else {
    list.sort((a, b) => {
      const aTime = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  renderReports(list);
}

function lookup() {
  const codes = (el.code?.value || "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);

  if (!codes.length) {
    el.codeOut.textContent = "Enter a code.";
    return;
  }

  const out = codes
    .map((code) => `${code} = ${obdCodes[code] || "Unknown code"}`)
    .join("\n");

  el.codeOut.textContent = out;
}

function exportPDF() {
  if (!allReports.length) {
    setMessage(el.reportMessage, "Load reports first.", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setMessage(el.reportMessage, "Popup blocked. Allow popups and try again.", "error");
    return;
  }

  const revenue = allReports.reduce(
    (sum, report) => sum + Number(report.grandTotal || 0),
    0
  );

  const cards = allReports
    .map(
      (report, index) => `
      <div class="pdf-card">
        <h2>${index + 1}. ${escapeHtml(report.fault)}</h2>
        <p><strong>Customer:</strong> ${escapeHtml(report.customerName || "N/A")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(report.customerPhone || "N/A")}</p>
        <p><strong>Vehicle:</strong> ${escapeHtml(report.vehicleMake || "")} ${escapeHtml(report.vehicleModel || "")}</p>
        <p><strong>Registration:</strong> ${escapeHtml(report.vehicleReg || "N/A")}</p>
        <p><strong>Mileage:</strong> ${escapeHtml(report.vehicleMileage || "N/A")}</p>
        <p><strong>Service Notes:</strong> ${escapeHtml(report.serviceNotes || "N/A")}</p>
        <p><strong>Labour Hours:</strong> ${escapeHtml(report.labourHours ?? 0)}</p>
        <p><strong>Hourly Rate:</strong> ${money(report.hourlyRate)}</p>
        <p><strong>Parts Cost:</strong> ${money(report.partsCost)}</p>
        <p><strong>VAT Rate:</strong> ${escapeHtml(report.vatRate ?? 0)}%</p>
        <p><strong>Labour Total:</strong> ${money(report.labourTotal)}</p>
        <p><strong>Subtotal:</strong> ${money(report.subTotal)}</p>
        <p><strong>VAT Total:</strong> ${money(report.vatTotal)}</p>
        <p><strong>Grand Total:</strong> ${money(report.grandTotal)}</p>
        <p><strong>Payment Status:</strong> ${escapeHtml(report.paymentStatus || "Unpaid")}</p>
        <p><strong>Confidence:</strong> ${escapeHtml(report.confidence)}%</p>
        <p><strong>Saved:</strong> ${escapeHtml(formatDate(report.createdAt))}</p>
        <p><strong>Explanation:</strong> ${escapeHtml(report.explanation)}</p>
        <pre>${escapeHtml(report.steps)}</pre>
      </div>
    `
    )
    .join("");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>AutoKnowledge Pro AI Report Export</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;background:#ffffff;margin:0;padding:24px;}
        .header{margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #0ea5e9;}
        h1{margin:0 0 8px 0;font-size:28px;color:#0369a1;}
        .meta{font-size:14px;color:#475569;margin:4px 0;}
        .pdf-card{border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin-bottom:16px;break-inside:avoid;page-break-inside:avoid;}
        .pdf-card h2{margin:0 0 10px 0;font-size:18px;color:#0f172a;}
        .pdf-card p{margin:6px 0;line-height:1.5;}
        .pdf-card pre{white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;line-height:1.6;}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AutoKnowledge Pro AI</h1>
        <div class="meta">Workshop Report Export</div>
        <div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
        <div class="meta">User: ${escapeHtml(el.userStatus.textContent)}</div>
        <div class="meta">Total Reports: ${allReports.length}</div>
        <div class="meta">Estimated Revenue: ${money(revenue)}</div>
      </div>
      ${cards}
      <script>
        window.onload = function(){ window.print(); };
      <\/script>
    </body>
    </html>
  `);
  printWindow.document.close();

  setMessage(el.reportMessage, "Print dialog opened. Choose Save as PDF.", "success");
}

watchAuthState((user) => {
  if (user) {
    el.userStatus.textContent = `Logged in: ${user.email}`;
    if (el.logoutBtn) el.logoutBtn.hidden = false;
  } else {
    el.userStatus.textContent = "Not logged in";
    if (el.logoutBtn) el.logoutBtn.hidden = true;
  }
});

if (el.loginBtn) el.loginBtn.onclick = login;
if (el.signupBtn) el.signupBtn.onclick = signup;
if (el.logoutBtn) el.logoutBtn.onclick = logout;
if (el.calculateInvoiceBtn) el.calculateInvoiceBtn.onclick = calculateInvoice;
if (el.runAiBtn) el.runAiBtn.onclick = runAI;
if (el.saveReportBtn) el.saveReportBtn.onclick = save;
if (el.lookupBtn) el.lookupBtn.onclick = lookup;
if (el.loadReportsBtn) el.loadReportsBtn.onclick = loadReports;
if (el.exportPdfBtn) el.exportPdfBtn.onclick = exportPDF;
if (el.reportSearch) el.reportSearch.oninput = applyFilters;
if (el.reportSort) el.reportSort.onchange = applyFilters;
if (el.paymentStatus) el.paymentStatus.onchange = calculateInvoice;

if (el.saveReportBtn) el.saveReportBtn.disabled = true;

calculateInvoice();
updateDashboardStats([]);
renderRecentActivity([]);
runAI();