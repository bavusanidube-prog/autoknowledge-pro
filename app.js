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

  symptomSelect: document.getElementById("symptomSelect"),
  checkSymptomBtn: document.getElementById("checkSymptomBtn"),
  symptomResult: document.getElementById("symptomResult"),

  warningSearch: document.getElementById("warningSearch"),
  warningCategory: document.getElementById("warningCategory"),
  warningLightResults: document.getElementById("warningLightResults"),

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

const symptomData = {
  overheating: {
    title: "Engine Overheating",
    summary: "Overheating should be treated seriously because continued driving can damage the engine.",
    severity: "High",
    driveClass: "drive-unsafe",
    safe: "Usually not safe to keep driving. Stop when safe, switch the engine off and allow it to cool.",
    mot: "May cause MOT issues if there are coolant leaks, warning lights, emissions problems or visible engine faults.",
    causes: ["Low coolant level", "Coolant leak", "Faulty thermostat", "Radiator fan not working", "Blocked radiator", "Weak water pump", "Possible head gasket fault"],
    checks: ["Check coolant level only when the engine is cold", "Look for coolant leaks under the car", "Check if the radiator fan comes on", "Watch the temperature gauge behaviour", "Do not remove the coolant cap when hot"]
  },
  battery_warning: {
    title: "Battery Warning Light",
    summary: "A battery warning light normally means the vehicle may not be charging correctly.",
    severity: "Medium",
    driveClass: "drive-caution",
    safe: "Short driving may be possible, but the vehicle may cut out if the alternator is not charging.",
    mot: "The light itself is not always a direct MOT failure, but related electrical problems may affect the test.",
    causes: ["Failing alternator", "Weak battery", "Loose auxiliary belt", "Corroded battery terminals", "Charging system fault", "Poor earth connection"],
    checks: ["Check battery terminals for corrosion", "Check if the auxiliary belt is fitted and turning", "Test battery voltage", "Test alternator charging output", "Reduce electrical load if driving to a safe place"]
  },
  clicking_noise: {
    title: "Clicking Noise",
    summary: "Clicking can be electrical, starting-system related, suspension related or drivetrain related.",
    severity: "Medium",
    driveClass: "drive-caution",
    safe: "Depends where the noise comes from. Avoid driving if it comes from wheels, brakes or steering.",
    mot: "Can affect MOT if linked to suspension, steering, CV joints, wheel bearings or braking components.",
    causes: ["Weak battery or starter clicking", "CV joint wear", "Loose wheel component", "Brake hardware movement", "Suspension joint wear", "Relay or electrical clicking"],
    checks: ["Check if clicking happens when starting", "Check if the noise changes when turning", "Inspect tyres and wheel area", "Check battery condition", "Have suspension and steering checked"]
  },
  misfire: {
    title: "Engine Misfire",
    summary: "A misfire can cause rough running, shaking, poor fuel economy and catalytic converter damage.",
    severity: "High",
    driveClass: "drive-unsafe",
    safe: "Avoid driving far. A misfire can damage the catalytic converter and increase emissions.",
    mot: "Likely MOT issue if emissions are affected, the engine runs poorly or the engine warning light is on.",
    causes: ["Spark plug fault", "Ignition coil failure", "Injector issue", "Vacuum leak", "Low compression", "Fuel delivery problem"],
    checks: ["Scan for fault codes such as P0300", "Check spark plugs", "Check ignition coils", "Listen for rough idle", "Avoid hard acceleration"]
  },
  loss_power: {
    title: "Loss of Power",
    summary: "Loss of power can come from fuel, air, ignition, turbo or emissions system faults.",
    severity: "Medium",
    driveClass: "drive-caution",
    safe: "Drive carefully only if the vehicle feels stable. Avoid motorways if power loss is severe.",
    mot: "May affect MOT if emissions are high, smoke is present or engine warning lights are showing.",
    causes: ["Turbo boost leak", "Blocked fuel filter", "MAF sensor fault", "EGR valve fault", "DPF restriction", "Fuel delivery issue", "Ignition fault"],
    checks: ["Check for engine warning lights", "Scan for fault codes", "Check air filter condition", "Listen for boost leaks", "Check for smoke under acceleration"]
  },
  smoke_exhaust: {
    title: "Smoke From Exhaust",
    summary: "Smoke colour gives useful clues. Blue, white and black smoke normally point to different faults.",
    severity: "High",
    driveClass: "drive-unsafe",
    safe: "Not recommended if smoke is heavy, constant or smells strongly of oil, fuel or coolant.",
    mot: "Excessive visible smoke can cause an MOT emissions failure.",
    causes: ["Blue smoke: burning oil", "White smoke: coolant entering the combustion chamber", "Black smoke: over-fuelling or air restriction", "Turbo seal wear", "Injector fault", "DPF or EGR issue"],
    checks: ["Note the smoke colour", "Check oil level", "Check coolant level", "Look for warning lights", "Book an emissions and diagnostic check"]
  },
  wont_start: {
    title: "Car Won't Start",
    summary: "A non-start fault usually needs basic checks before deeper diagnosis.",
    severity: "Medium",
    driveClass: "drive-unsafe",
    safe: "Vehicle is not driveable until the starting fault is found.",
    mot: "A vehicle that cannot start cannot complete an MOT test.",
    causes: ["Flat battery", "Starter motor fault", "Fuel pump issue", "Immobiliser problem", "Bad earth connection", "Crankshaft sensor fault"],
    checks: ["Check dashboard lights", "Listen for clicking when turning the key", "Try a jump start if the battery is flat", "Check fuel level", "Scan for fault codes if possible"]
  },
  rough_idle: {
    title: "Rough Idle",
    summary: "A rough idle means the engine is not running smoothly when stationary. It may shake, dip in revs or feel like it wants to stall.",
    severity: "Medium",
    driveClass: "drive-caution",
    safe: "Short driving may be possible if the car is stable, but avoid driving if it stalls, shakes heavily or warning lights appear.",
    mot: "May affect MOT if emissions are high, the engine warning light is on or the idle is unstable.",
    causes: ["Vacuum leak", "Dirty throttle body", "MAF sensor fault", "Ignition fault", "Injector issue", "EGR valve fault"],
    checks: ["Scan for fault codes", "Check for air leaks", "Clean throttle body", "Check spark plugs and coils", "Check idle speed behaviour"]
  },
  brake_warning: {
    title: "Brake Warning Light",
    summary: "A brake warning light should be taken seriously because it may relate to brake fluid, the handbrake, ABS or the braking system.",
    severity: "High",
    driveClass: "drive-unsafe",
    safe: "No. Do not continue driving until brake fluid level and brake operation have been checked.",
    mot: "Very likely to affect MOT if brake warning lights, low brake fluid or braking faults are present.",
    causes: ["Low brake fluid", "Handbrake switch issue", "Worn brake pads", "ABS fault", "Brake fluid leak", "Brake sensor fault"],
    checks: ["Check brake fluid level", "Check if handbrake is fully released", "Look for brake fluid leaks", "Check brake pedal feel", "Book brake inspection immediately"]
  }
};

const warningLightData = [
  {
    title: "Engine Management Light",
    category: "engine",
    severity: "Amber",
    colourClass: "warning-amber",
    description: "The engine management light means the engine control system has detected a fault.",
    safe: "You may be able to drive carefully if the car feels normal, but avoid hard acceleration and get it checked soon.",
    mot: "May fail MOT if the light stays on, emissions are affected or the engine runs poorly.",
    causes: ["Faulty oxygen sensor", "Misfire", "MAF sensor fault", "EGR fault", "Catalyst issue"],
    steps: ["Scan for fault codes", "Check for rough running", "Check fuel economy changes", "Book diagnostic inspection"]
  },
  {
    title: "Battery Warning Light",
    category: "battery",
    severity: "Red",
    colourClass: "warning-red",
    description: "This usually means the battery is not charging correctly while the engine is running.",
    safe: "Not safe for long. The car may cut out once battery power drops.",
    mot: "May affect MOT if electrical systems or warning lights are not operating correctly.",
    causes: ["Alternator fault", "Broken auxiliary belt", "Weak battery", "Wiring fault", "Poor earth connection"],
    steps: ["Turn off unnecessary electrics", "Check auxiliary belt", "Test alternator output", "Check battery terminals"]
  },
  {
    title: "Brake Warning Light",
    category: "brakes",
    severity: "Red",
    colourClass: "warning-red",
    description: "A brake warning light can point to low brake fluid, handbrake issues or braking system faults.",
    safe: "Do not continue driving until brake fluid level and brake operation are checked.",
    mot: "Very likely to affect MOT if brake warning lights or braking faults are present.",
    causes: ["Low brake fluid", "Handbrake switch", "Brake fluid leak", "Worn pads", "Brake system fault"],
    steps: ["Check handbrake is released", "Check brake fluid", "Look for leaks", "Book brake inspection immediately"]
  },
  {
    title: "Oil Pressure Warning Light",
    category: "oil",
    severity: "Red",
    colourClass: "warning-red",
    description: "This means the engine may not have enough oil pressure to protect internal parts.",
    safe: "Stop safely and switch off the engine. Continuing to drive can destroy the engine.",
    mot: "May affect MOT if there are oil leaks, warning lights or engine running issues.",
    causes: ["Low oil level", "Oil pump fault", "Blocked oil pickup", "Oil pressure sensor fault", "Engine wear"],
    steps: ["Stop engine", "Check oil level", "Do not drive if light remains on", "Arrange recovery or mechanic inspection"]
  },
  {
    title: "Coolant Temperature Warning Light",
    category: "coolant",
    severity: "Red",
    colourClass: "warning-red",
    description: "The engine is too hot or the coolant system has a serious issue.",
    safe: "Stop when safe and let the engine cool. Do not open the coolant cap while hot.",
    mot: "May affect MOT if leaks, overheating, emissions issues or warning lights are present.",
    causes: ["Low coolant", "Coolant leak", "Thermostat fault", "Radiator fan fault", "Water pump fault"],
    steps: ["Stop safely", "Let engine cool", "Check coolant when cold", "Look for leaks", "Book cooling system test"]
  },
  {
    title: "Tyre Pressure Warning Light",
    category: "tyre",
    severity: "Amber",
    colourClass: "warning-amber",
    description: "One or more tyres may be under-inflated or the tyre pressure monitoring system has detected a problem.",
    safe: "Drive carefully to a safe place to check tyre pressures. Avoid high speed if a tyre looks low.",
    mot: "May affect MOT if tyres are damaged, unsafe, below legal tread depth or TPMS fault applies on relevant vehicles.",
    causes: ["Low tyre pressure", "Puncture", "Temperature change", "Faulty TPMS sensor", "Uneven tyre pressure"],
    steps: ["Check all tyre pressures", "Inspect for punctures", "Inflate to correct PSI", "Reset TPMS if needed"]
  },
  {
    title: "ABS Warning Light",
    category: "abs",
    severity: "Amber",
    colourClass: "warning-amber",
    description: "The anti-lock braking system may not work correctly, although normal braking may still remain.",
    safe: "Drive cautiously, but avoid harsh braking. Get it checked soon.",
    mot: "An ABS warning light is likely to fail MOT if it stays on.",
    causes: ["Wheel speed sensor fault", "ABS pump fault", "Damaged wiring", "Reluctor ring issue", "Low voltage"],
    steps: ["Scan ABS codes", "Check wheel speed sensors", "Inspect wiring near wheels", "Book brake system diagnosis"]
  },
  {
    title: "Airbag Warning Light",
    category: "airbag",
    severity: "Amber",
    colourClass: "warning-amber",
    description: "The airbag or seatbelt restraint system has detected a fault.",
    safe: "The car may drive, but airbags or seatbelt pretensioners may not work correctly in a crash.",
    mot: "An airbag/SRS warning light is likely to fail MOT if it stays on.",
    causes: ["Seat wiring fault", "Clock spring fault", "Airbag module issue", "Seatbelt pretensioner fault", "Low battery voltage"],
    steps: ["Do not unplug airbag parts yourself", "Scan SRS system", "Check under-seat wiring", "Book safety system inspection"]
  }
];

const diagnostics = {
  overheat: {
    fault: "Cooling System Failure",
    confidence: 92,
    explanation: "Likely thermostat, coolant loss, blocked radiator or weak water pump.",
    steps: "1. Check coolant level\n2. Check leaks\n3. Test thermostat\n4. Inspect radiator fan\n5. Test water pump"
  },
  no_start: {
    fault: "Starting / Fuel Delivery Fault",
    confidence: 89,
    explanation: "Likely battery voltage issue, starter fault, immobilizer or no fuel.",
    steps: "1. Check battery voltage\n2. Inspect starter relay\n3. Verify spark\n4. Verify fuel pressure"
  },
  misfire: {
    fault: "Ignition or Fuel Misfire",
    confidence: 94,
    explanation: "Likely spark plugs, coils, injectors, vacuum leak or compression issue.",
    steps: "1. Check plugs\n2. Test coils\n3. Check injector pulse\n4. Compression test"
  },
  battery: {
    fault: "Battery Drain / Charging Fault",
    confidence: 87,
    explanation: "Likely parasitic drain, battery wear or alternator issue.",
    steps: "1. Test battery health\n2. Check alternator output\n3. Perform drain test"
  },
  rough_idle: {
    fault: "Idle Air/Fuel Imbalance",
    confidence: 88,
    explanation: "Likely vacuum leak, dirty throttle body, MAF issue or weak ignition.",
    steps: "1. Inspect vacuum leaks\n2. Clean throttle body\n3. Test MAF\n4. Inspect ignition"
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
  if (typeof value.toDate === "function") return value.toDate().toLocaleString();
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function setText(target, value) {
  if (target) target.textContent = value;
}

function severityClass(level) {
  if (level === "High") return "severity-high";
  if (level === "Medium") return "severity-medium";
  return "severity-low";
}

function renderSymptomResult() {
  if (!el.symptomSelect || !el.symptomResult) return;

  const data = symptomData[el.symptomSelect.value];

  if (!data) {
    el.symptomResult.className = "symptom-result empty-state";
    el.symptomResult.textContent = "Select a symptom to see possible causes, severity, MOT impact and next checks.";
    return;
  }

  el.symptomResult.className = "symptom-result";
  el.symptomResult.innerHTML = `
    <div class="symptom-card">
      <h3>${escapeHtml(data.title)}</h3>
      <p class="symptom-summary">${escapeHtml(data.summary)}</p>

      <div class="symptom-badges">
        <span class="symptom-badge ${severityClass(data.severity)}">Severity: ${escapeHtml(data.severity)}</span>
        <span class="symptom-badge ${escapeHtml(data.driveClass)}">Safe to drive guidance</span>
        <span class="symptom-badge">UK MOT aware</span>
      </div>

      <div class="symptom-info-grid">
        <div class="symptom-info">
          <h4>Possible Causes</h4>
          <ul>${data.causes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>

        <div class="symptom-info">
          <h4>Safe To Drive?</h4>
          <p>${escapeHtml(data.safe)}</p>
        </div>

        <div class="symptom-info">
          <h4>MOT Implications</h4>
          <p>${escapeHtml(data.mot)}</p>
        </div>

        <div class="symptom-info">
          <h4>Recommended Next Checks</h4>
          <ul>${data.checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderWarningLights() {
  if (!el.warningLightResults) return;

  const search = (el.warningSearch?.value || "").toLowerCase();
  const category = el.warningCategory?.value || "all";

  const filtered = warningLightData.filter((item) => {
    const text = `${item.title} ${item.category} ${item.description} ${item.causes.join(" ")} ${item.steps.join(" ")}`.toLowerCase();
    const matchesSearch = text.includes(search);
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    el.warningLightResults.innerHTML = `
      <div class="no-warning-results">
        No warning lights found. Try searching engine, oil, ABS, brakes, tyre, coolant or battery.
      </div>
    `;
    return;
  }

  el.warningLightResults.innerHTML = filtered.map((item) => `
    <div class="warning-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="warning-desc">${escapeHtml(item.description)}</p>

      <div class="warning-badges">
        <span class="warning-badge ${escapeHtml(item.colourClass)}">Severity: ${escapeHtml(item.severity)}</span>
        <span class="warning-badge">Category: ${escapeHtml(item.category.toUpperCase())}</span>
      </div>

      <div class="warning-info-grid">
        <div class="warning-info">
          <h4>Safe To Drive?</h4>
          <p>${escapeHtml(item.safe)}</p>
        </div>

        <div class="warning-info">
          <h4>MOT Implications</h4>
          <p>${escapeHtml(item.mot)}</p>
        </div>

        <div class="warning-info">
          <h4>Possible Causes</h4>
          <ul>${item.causes.map((cause) => `<li>${escapeHtml(cause)}</li>`).join("")}</ul>
        </div>

        <div class="warning-info">
          <h4>Recommended Next Steps</h4>
          <ul>${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>
        </div>
      </div>
    </div>
  `).join("");
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
    el.invoiceStatus.style.color = invoice.paymentStatus === "Paid" ? "#22c55e" : "#f59e0b";
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
    if (message.includes("Customer") || message.includes("Vehicle") || message.includes("Registration")) {
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
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
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
    list = list.filter((r) =>
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
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return aTime - bTime;
    });
  } else {
    list.sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  renderReports(list);
}

function lookup() {
  const codes = (el.code?.value || "").split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);

  if (!codes.length) {
    el.codeOut.textContent = "Enter a code.";
    return;
  }

  el.codeOut.textContent = codes.map((code) => `${code} = ${obdCodes[code] || "Unknown code"}`).join("\n");
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

  const revenue = allReports.reduce((sum, report) => sum + Number(report.grandTotal || 0), 0);

  const cards = allReports.map((report, index) => `
    <div class="pdf-card">
      <h2>${index + 1}. ${escapeHtml(report.fault)}</h2>
      ${createProfileHtml(report)}
      ${createInvoiceHtml(report)}
      <p><strong>Confidence:</strong> ${escapeHtml(report.confidence)}%</p>
      <p><strong>Saved:</strong> ${escapeHtml(formatDate(report.createdAt))}</p>
      <p><strong>Explanation:</strong> ${escapeHtml(report.explanation)}</p>
      <pre>${escapeHtml(report.steps)}</pre>
    </div>
  `).join("");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en-GB">
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
        .pdf-card p,.pdf-card div{margin:6px 0;line-height:1.5;}
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
      <script>window.onload = function(){ window.print(); };<\/script>
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

if (el.checkSymptomBtn) el.checkSymptomBtn.onclick = renderSymptomResult;
if (el.symptomSelect) el.symptomSelect.onchange = renderSymptomResult;
if (el.warningSearch) el.warningSearch.oninput = renderWarningLights;
if (el.warningCategory) el.warningCategory.onchange = renderWarningLights;

if (el.saveReportBtn) el.saveReportBtn.disabled = true;

calculateInvoice();
updateDashboardStats([]);
renderRecentActivity([]);
renderSymptomResult();
renderWarningLights();
runAI();
