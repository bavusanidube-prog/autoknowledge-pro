/* ==========================================================
   AUTOKNOWLEDGE PRO
   PRODUCTION APPLICATION SCRIPT

   Part 1:
   Application state
   DOM references
   Route navigation
   Checker progress
   Form controls
   Reset and rendering helpers
========================================================== */

/* ==========================================================
   1. APPLICATION CONSTANTS
========================================================== */

const MVE_BASE_URL = "https://motorvehicleexpert.co.uk";

const CHECKER_STEPS = Object.freeze({
  SYSTEM: 1,
  SYMPTOM: 2,
  CONDITIONS: 3,
  SAFETY: 4
});

const CHECKER_STEP_COUNT = 4;

const SUPPORTED_INTERACTIVE_SYSTEMS = new Set([
  "clutch",
  "engine",
  "starting",
  "cooling",
  "brakes"
]);

const GUIDE_ONLY_SYSTEMS = Object.freeze({
  steering: {
    title: "Steering and Suspension Guidance",
    summary:
      "Use the Motor Vehicle Expert diagnostic guides to investigate pulling, knocking, vibration, unstable handling and uneven tyre wear.",
    url: `${MVE_BASE_URL}/diagnostics.html`
  },

  exhaust: {
    title: "Exhaust and Emissions Guidance",
    summary:
      "Use the exhaust, emissions, smoke and warning-light guides to investigate leaks, smells, DPF concerns and exhaust smoke.",
    url: `${MVE_BASE_URL}/diagnostics.html`
  },

  mot: {
    title: "MOT Guidance",
    summary:
      "Use the Motor Vehicle Expert MOT hub to check whether a warning light, symptom or visible defect may affect the test.",
    url: `${MVE_BASE_URL}/does-mot-check.html`
  }
});

/* ==========================================================
   2. APPLICATION STATE
========================================================== */

const state = {
  activeRoute: null,
  activeSystem: null,
  currentStep: CHECKER_STEPS.SYSTEM,

  clutch: {
    symptom: null,
    conditions: [],
    safety: {
      drivePredictable: null,
      persistentHeat: null,
      hydraulicLoss: null,
      faultTiming: null
    }
  },

  warningLight: null,
  lastResult: null
};

/* ==========================================================
   3. DOM REFERENCES
========================================================== */

const dom = {
  routeButtons: Array.from(
    document.querySelectorAll("[data-checker-route]")
  ),

  closeButtons: Array.from(
    document.querySelectorAll("[data-checker-close]")
  ),

  openClutchButtons: Array.from(
    document.querySelectorAll("[data-open-clutch-checker]")
  ),

  checkerProgress: document.getElementById("checker-progress"),
  progressStatus: document.getElementById("progress-status"),
  progressFill: document.getElementById("progress-fill"),
  progressBar: document.querySelector(
    '.progress-track[role="progressbar"]'
  ),

  progressSteps: Array.from(
    document.querySelectorAll(".progress-step")
  ),

  symptomChecker: document.getElementById("symptom-checker"),
  warningChecker: document.getElementById("warning-light-checker"),

  symptomStepSystem: document.getElementById("symptom-step-system"),
  clutchStepSymptom: document.getElementById("clutch-step-symptom"),
  clutchStepConditions: document.getElementById(
    "clutch-step-conditions"
  ),
  clutchStepSafety: document.getElementById("clutch-step-safety"),

  systemRadios: Array.from(
    document.querySelectorAll('input[name="vehicle-system"]')
  ),

  clutchSymptomRadios: Array.from(
    document.querySelectorAll('input[name="clutch-symptom"]')
  ),

  clutchConditionCheckboxes: Array.from(
    document.querySelectorAll('input[name="clutch-condition"]')
  ),

  warningLightRadios: Array.from(
    document.querySelectorAll('input[name="warning-light"]')
  ),

  drivePredictableRadios: Array.from(
    document.querySelectorAll('input[name="drive-predictable"]')
  ),

  persistentHeatRadios: Array.from(
    document.querySelectorAll('input[name="persistent-heat"]')
  ),

  hydraulicLossRadios: Array.from(
    document.querySelectorAll('input[name="hydraulic-loss"]')
  ),

  faultTimingRadios: Array.from(
    document.querySelectorAll('input[name="fault-timing"]')
  ),

  systemContinue: document.getElementById("system-continue"),
  clutchSymptomContinue: document.getElementById(
    "clutch-symptom-continue"
  ),
  clutchConditionsContinue: document.getElementById(
    "clutch-conditions-continue"
  ),
  generateClutchResult: document.getElementById(
    "generate-clutch-result"
  ),
  generateWarningResult: document.getElementById(
    "generate-warning-result"
  ),

  backButtons: Array.from(
    document.querySelectorAll("[data-checker-back]")
  ),

  clutchSafetyMessage: document.getElementById(
    "clutch-safety-message"
  ),

  resultSection: document.getElementById("diagnostic-result"),
  resultEyebrow: document.getElementById("result-eyebrow"),
  resultTitle: document.getElementById("result-title"),
  resultSummary: document.getElementById("result-summary"),

  resultUrgency: document.getElementById("result-urgency"),
  resultUrgencyLabel: document.getElementById(
    "result-urgency-label"
  ),

  resultDirection: document.getElementById("result-direction"),
  resultDirectionCopy: document.getElementById(
    "result-direction-copy"
  ),

  resultDrivingTitle: document.getElementById(
    "result-driving-title"
  ),
  resultDrivingCopy: document.getElementById(
    "result-driving-copy"
  ),

  resultMotTitle: document.getElementById("result-mot-title"),
  resultMotCopy: document.getElementById("result-mot-copy"),

  resultCauses: document.getElementById("result-causes"),
  resultChecks: document.getElementById("result-checks"),
  resultGuideLinks: document.getElementById(
    "result-guide-links"
  ),

  printResult: document.getElementById("print-result"),
  startNewCheck: document.getElementById("start-new-check"),

  resultListItemTemplate: document.getElementById(
    "result-list-item-template"
  ),
  resultGuideLinkTemplate: document.getElementById(
    "result-guide-link-template"
  )
};

/* ==========================================================
   4. GENERAL HELPERS
========================================================== */

function getCheckedValue(inputs) {
  const checked = inputs.find((input) => input.checked);
  return checked ? checked.value : null;
}

function getCheckedValues(inputs) {
  return inputs
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function clearInputs(inputs) {
  inputs.forEach((input) => {
    input.checked = false;
  });
}

function setHidden(element, hidden) {
  if (!element) {
    return;
  }

  element.hidden = hidden;
}

function setButtonDisabled(button, disabled) {
  if (!button) {
    return;
  }

  button.disabled = disabled;
}

function setText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = value;
}

function scrollToElement(element, offset = 18) {
  if (!element) {
    return;
  }

  const top =
    element.getBoundingClientRect().top +
    window.scrollY -
    offset;

  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? "auto" : "smooth"
  });
}

function prefersReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

function focusFirstInput(container) {
  if (!container) {
    return;
  }

  const input = container.querySelector(
    'input:not([disabled]), button:not([disabled]), a[href]'
  );

  if (input) {
    window.setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 100);
  }
}

function normaliseGuideUrl(path) {
  if (!path) {
    return MVE_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${MVE_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

/* ==========================================================
   5. CHECKER VISIBILITY
========================================================== */

function setRouteExpandedState(activeRoute = null) {
  dom.routeButtons.forEach((button) => {
    const isActive =
      activeRoute !== null &&
      button.dataset.checkerRoute === activeRoute;

    button.setAttribute(
      "aria-expanded",
      String(isActive)
    );
  });
}

function hideAllCheckers() {
  setHidden(dom.symptomChecker, true);
  setHidden(dom.warningChecker, true);
  setHidden(dom.checkerProgress, true);

  setRouteExpandedState();
}

function hideAllSymptomSteps() {
  setHidden(dom.symptomStepSystem, true);
  setHidden(dom.clutchStepSymptom, true);
  setHidden(dom.clutchStepConditions, true);
  setHidden(dom.clutchStepSafety, true);
}

function showSymptomStep(step) {
  hideAllSymptomSteps();

  state.currentStep = step;

  switch (step) {
    case CHECKER_STEPS.SYSTEM:
      setHidden(dom.symptomStepSystem, false);
      updateProgress(CHECKER_STEPS.SYSTEM);
      focusFirstInput(dom.symptomStepSystem);
      break;

    case CHECKER_STEPS.SYMPTOM:
      setHidden(dom.clutchStepSymptom, false);
      updateProgress(CHECKER_STEPS.SYMPTOM);
      focusFirstInput(dom.clutchStepSymptom);
      break;

    case CHECKER_STEPS.CONDITIONS:
      setHidden(dom.clutchStepConditions, false);
      updateProgress(CHECKER_STEPS.CONDITIONS);
      focusFirstInput(dom.clutchStepConditions);
      break;

    case CHECKER_STEPS.SAFETY:
      setHidden(dom.clutchStepSafety, false);
      updateProgress(CHECKER_STEPS.SAFETY);
      focusFirstInput(dom.clutchStepSafety);
      break;

    default:
      showSymptomStep(CHECKER_STEPS.SYSTEM);
  }
}

/* ==========================================================
   6. PROGRESS HANDLING
========================================================== */

function updateProgress(step) {
  const safeStep = Math.min(
    Math.max(Number(step) || 1, 1),
    CHECKER_STEP_COUNT
  );

  const percentage =
    (safeStep / CHECKER_STEP_COUNT) * 100;

  setHidden(dom.checkerProgress, false);
  setText(
    dom.progressStatus,
    `Step ${safeStep} of ${CHECKER_STEP_COUNT}`
  );

  if (dom.progressFill) {
    dom.progressFill.style.width = `${percentage}%`;
  }

  if (dom.progressBar) {
    dom.progressBar.setAttribute(
      "aria-valuenow",
      String(safeStep)
    );
  }

  dom.progressSteps.forEach((progressStep, index) => {
    const stepNumber = index + 1;
    const isCurrent = stepNumber === safeStep;
    const isComplete = stepNumber < safeStep;

    progressStep.classList.toggle(
      "progress-step-active",
      isCurrent
    );

    progressStep.classList.toggle(
      "progress-step-complete",
      isComplete
    );
  });
}

/* ==========================================================
   7. OPEN AND CLOSE ROUTES
========================================================== */

function openRoute(routeName) {
  hideAllCheckers();
  hideResult();

  state.activeRoute = routeName;

  if (routeName === "symptom") {
    setHidden(dom.symptomChecker, false);
    showSymptomStep(CHECKER_STEPS.SYSTEM);

    setRouteExpandedState("symptom");

    scrollToElement(
      dom.checkerProgress || dom.symptomChecker
    );

    return;
  }

  if (routeName === "warning-light") {
    setHidden(dom.warningChecker, false);
    setHidden(dom.checkerProgress, true);

    setRouteExpandedState("warning-light");

    scrollToElement(dom.warningChecker);
    focusFirstInput(dom.warningChecker);

    return;
  }

  state.activeRoute = null;
  setRouteExpandedState();
}

function openClutchChecker() {
  resetSymptomState();

  state.activeRoute = "symptom";
  state.activeSystem = "clutch";

  const clutchSystemRadio = dom.systemRadios.find(
    (radio) => radio.value === "clutch"
  );

  if (clutchSystemRadio) {
    clutchSystemRadio.checked = true;
  }

  hideAllCheckers();
  hideResult();

  setHidden(dom.symptomChecker, false);
  setRouteExpandedState("symptom");

  showSymptomStep(CHECKER_STEPS.SYMPTOM);

  scrollToElement(
    dom.checkerProgress || dom.symptomChecker
  );
}

function closeChecker() {
  hideAllCheckers();
  resetValidationMessages();

  state.activeRoute = null;
  state.currentStep = CHECKER_STEPS.SYSTEM;

  const startSection = document.getElementById("start-check");
  scrollToElement(startSection);
}

/* ==========================================================
   8. SYSTEM SELECTION
========================================================== */

function handleSystemSelection() {
  state.activeSystem = getCheckedValue(dom.systemRadios);

  setButtonDisabled(
    dom.systemContinue,
    !state.activeSystem
  );
}

function continueFromSystem() {
  const selectedSystem = getCheckedValue(dom.systemRadios);

  if (!selectedSystem) {
    setButtonDisabled(dom.systemContinue, true);
    return;
  }

  state.activeSystem = selectedSystem;

  if (selectedSystem === "clutch") {
    showSymptomStep(CHECKER_STEPS.SYMPTOM);
    scrollToElement(dom.checkerProgress);
    return;
  }

  if (GUIDE_ONLY_SYSTEMS[selectedSystem]) {
    renderGuideOnlyResult(
      GUIDE_ONLY_SYSTEMS[selectedSystem]
    );
    return;
  }

  if (SUPPORTED_INTERACTIVE_SYSTEMS.has(selectedSystem)) {
    renderPendingSystemResult(selectedSystem);
  }
}

/* ==========================================================
   9. CLUTCH SYMPTOM SELECTION
========================================================== */

function handleClutchSymptomSelection() {
  state.clutch.symptom = getCheckedValue(
    dom.clutchSymptomRadios
  );

  setButtonDisabled(
    dom.clutchSymptomContinue,
    !state.clutch.symptom
  );
}

function continueFromClutchSymptom() {
  const selectedSymptom = getCheckedValue(
    dom.clutchSymptomRadios
  );

  if (!selectedSymptom) {
    setButtonDisabled(dom.clutchSymptomContinue, true);
    return;
  }

  state.clutch.symptom = selectedSymptom;

  showSymptomStep(CHECKER_STEPS.CONDITIONS);
  scrollToElement(dom.checkerProgress);
}

function continueFromClutchConditions() {
  state.clutch.conditions = getCheckedValues(
    dom.clutchConditionCheckboxes
  );

  showSymptomStep(CHECKER_STEPS.SAFETY);
  scrollToElement(dom.checkerProgress);
}

/* ==========================================================
   10. CLUTCH SAFETY STATE
========================================================== */

function readClutchSafetyAnswers() {
  state.clutch.safety = {
    drivePredictable: getCheckedValue(
      dom.drivePredictableRadios
    ),

    persistentHeat: getCheckedValue(
      dom.persistentHeatRadios
    ),

    hydraulicLoss: getCheckedValue(
      dom.hydraulicLossRadios
    ),

    faultTiming: getCheckedValue(
      dom.faultTimingRadios
    )
  };

  return state.clutch.safety;
}

function validateClutchSafetyAnswers() {
  const answers = readClutchSafetyAnswers();

  const missing = [];

  if (!answers.drivePredictable) {
    missing.push("vehicle behaviour");
  }

  if (!answers.persistentHeat) {
    missing.push("smoke or smell");
  }

  if (!answers.hydraulicLoss) {
    missing.push("hydraulic-fluid level");
  }

  if (!answers.faultTiming) {
    missing.push("when the problem began");
  }

  if (missing.length > 0) {
    showClutchSafetyMessage(
      `Please answer every safety question before generating the result. Missing: ${missing.join(
        ", "
      )}.`
    );

    return false;
  }

  hideClutchSafetyMessage();
  return true;
}

function showClutchSafetyMessage(message) {
  if (!dom.clutchSafetyMessage) {
    return;
  }

  dom.clutchSafetyMessage.textContent = message;
  dom.clutchSafetyMessage.hidden = false;
  dom.clutchSafetyMessage.focus?.();
}

function hideClutchSafetyMessage() {
  if (!dom.clutchSafetyMessage) {
    return;
  }

  dom.clutchSafetyMessage.hidden = true;
  dom.clutchSafetyMessage.textContent = "";
}

function resetValidationMessages() {
  hideClutchSafetyMessage();
}

/* ==========================================================
   11. WARNING-LIGHT SELECTION
========================================================== */

function handleWarningLightSelection() {
  state.warningLight = getCheckedValue(
    dom.warningLightRadios
  );

  setButtonDisabled(
    dom.generateWarningResult,
    !state.warningLight
  );
}

/* ==========================================================
   12. BACK NAVIGATION
========================================================== */

function handleBackNavigation(target) {
  switch (target) {
    case "system":
      showSymptomStep(CHECKER_STEPS.SYSTEM);
      break;

    case "clutch-symptom":
      showSymptomStep(CHECKER_STEPS.SYMPTOM);
      break;

    case "clutch-conditions":
      showSymptomStep(CHECKER_STEPS.CONDITIONS);
      break;

    default:
      showSymptomStep(CHECKER_STEPS.SYSTEM);
  }

  scrollToElement(dom.checkerProgress);
}

/* ==========================================================
   13. RESET STATE
========================================================== */

function resetSymptomState() {
  state.activeSystem = null;
  state.currentStep = CHECKER_STEPS.SYSTEM;

  state.clutch = {
    symptom: null,
    conditions: [],
    safety: {
      drivePredictable: null,
      persistentHeat: null,
      hydraulicLoss: null,
      faultTiming: null
    }
  };

  clearInputs(dom.systemRadios);
  clearInputs(dom.clutchSymptomRadios);
  clearInputs(dom.clutchConditionCheckboxes);
  clearInputs(dom.drivePredictableRadios);
  clearInputs(dom.persistentHeatRadios);
  clearInputs(dom.hydraulicLossRadios);
  clearInputs(dom.faultTimingRadios);

  setButtonDisabled(dom.systemContinue, true);
  setButtonDisabled(dom.clutchSymptomContinue, true);

  resetValidationMessages();
}

function resetWarningState() {
  state.warningLight = null;

  clearInputs(dom.warningLightRadios);
  setButtonDisabled(dom.generateWarningResult, true);
}

function resetApplication() {
  resetSymptomState();
  resetWarningState();

  state.activeRoute = null;
  state.lastResult = null;

  hideAllCheckers();
  hideResult();

  const startSection = document.getElementById("start-check");
  scrollToElement(startSection);
}

/* ==========================================================
   14. RESULT VISIBILITY
========================================================== */

function hideResult() {
  setHidden(dom.resultSection, true);
}

function showResult() {
  setHidden(dom.resultSection, false);
  scrollToElement(dom.resultSection);
}

/* ==========================================================
   15. RESULT RENDERING HELPERS
========================================================== */

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

function appendResultListItems(container, items) {
  clearElement(container);

  if (!container || !Array.isArray(items)) {
    return;
  }

  items.forEach((item) => {
    let listItem;

    if (
      dom.resultListItemTemplate instanceof
      HTMLTemplateElement
    ) {
      const fragment =
        dom.resultListItemTemplate.content.cloneNode(true);

      const textElement = fragment.querySelector(
        "[data-result-item-text]"
      );

      if (textElement) {
        textElement.textContent = item;
      }

      container.appendChild(fragment);
      return;
    }

    listItem = document.createElement("li");
    listItem.className = "generated-result-item";
    listItem.textContent = item;
    container.appendChild(listItem);
  });
}

function appendGuideLinks(container, guides) {
  clearElement(container);

  if (!container || !Array.isArray(guides)) {
    return;
  }

  guides.forEach((guide) => {
    if (
      dom.resultGuideLinkTemplate instanceof
      HTMLTemplateElement
    ) {
      const fragment =
        dom.resultGuideLinkTemplate.content.cloneNode(true);

      const anchor = fragment.querySelector("a");
      const title = fragment.querySelector(
        "[data-guide-title]"
      );

      if (anchor) {
        anchor.href = normaliseGuideUrl(guide.url);
        anchor.setAttribute(
          "aria-label",
          `${guide.title} — opens on Motor Vehicle Expert`
        );
      }

      if (title) {
        title.textContent = guide.title;
      }

      container.appendChild(fragment);
      return;
    }

    const anchor = document.createElement("a");
    anchor.className = "result-guide-link";
    anchor.href = normaliseGuideUrl(guide.url);
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = guide.title;

    container.appendChild(anchor);
  });
}

function setUrgency(level, label) {
  if (!dom.resultUrgency) {
    return;
  }

  dom.resultUrgency.classList.remove(
    "urgency-low",
    "urgency-medium",
    "urgency-high"
  );

  const normalisedLevel =
    level === "high" ||
    level === "medium" ||
    level === "low"
      ? level
      : "medium";

  dom.resultUrgency.classList.add(
    `urgency-${normalisedLevel}`
  );

  setText(dom.resultUrgencyLabel, label);
}

function renderResult(result) {
  if (!result) {
    return;
  }

  state.lastResult = result;

  setText(
    dom.resultEyebrow,
    result.eyebrow || "Diagnostic guidance"
  );

  setText(
    dom.resultTitle,
    result.title || "Vehicle-check result"
  );

  setText(
    dom.resultSummary,
    result.summary || ""
  );

  setUrgency(
    result.urgency?.level,
    result.urgency?.label || "Review required"
  );

  setText(
    dom.resultDirection,
    result.direction?.title || "Diagnostic direction"
  );

  setText(
    dom.resultDirectionCopy,
    result.direction?.copy || ""
  );

  setText(
    dom.resultDrivingTitle,
    result.driving?.title || "Driving guidance"
  );

  setText(
    dom.resultDrivingCopy,
    result.driving?.copy || ""
  );

  setText(
    dom.resultMotTitle,
    result.mot?.title || "MOT relevance"
  );

  setText(
    dom.resultMotCopy,
    result.mot?.copy || ""
  );

  appendResultListItems(
    dom.resultCauses,
    result.causes || []
  );

  appendResultListItems(
    dom.resultChecks,
    result.checks || []
  );

  appendGuideLinks(
    dom.resultGuideLinks,
    result.guides || []
  );

  hideAllCheckers();
  showResult();
}

/* ==========================================================
   16. TEMPORARY ROUTE RESULTS
   These will be replaced by full system logic in later parts.
========================================================== */

function renderGuideOnlyResult(config) {
  renderResult({
    eyebrow: "Specialist guide route",

    title: config.title,

    summary: config.summary,

    urgency: {
      level: "medium",
      label: "Use the specialist guides"
    },

    direction: {
      title: "Symptom-led investigation required",
      copy:
        "The selected category is currently supported through the live Motor Vehicle Expert diagnostic guides rather than an automated diagnosis."
    },

    driving: {
      title: "Assess the symptom carefully",
      copy:
        "Stop driving when steering control, braking, stability, smoke, overheating or fluid loss makes the vehicle unsafe."
    },

    mot: {
      title: "MOT relevance depends on the defect",
      copy:
        "Warning lights, steering, suspension, emissions and visible defects may affect an MOT, but a physical test is required."
    },

    causes: [
      "The selected symptom may involve more than one vehicle system.",
      "A physical inspection may be necessary before fault direction can be narrowed.",
      "Warning lights and fault codes should be treated as evidence rather than automatic parts instructions."
    ],

    checks: [
      "Open the relevant Motor Vehicle Expert guide.",
      "Record when the symptom happens and whether it changes with speed, load or temperature.",
      "Arrange professional inspection when safety, control or fluid loss is involved."
    ],

    guides: [
      {
        title: "Open the relevant diagnostic guidance",
        url: config.url
      },
      {
        title: "Vehicle Diagnostics Hub",
        url: "diagnostics.html"
      }
    ]
  });
}

function renderPendingSystemResult(system) {
  const labels = {
    engine: "Engine and Acceleration Checker",
    starting: "Battery and Starting Checker",
    cooling: "Cooling and Overheating Checker",
    brakes: "Brake Symptom Checker"
  };

  renderResult({
    eyebrow: "Guided diagnostic route",

    title:
      labels[system] || "Vehicle Diagnostic Guidance",

    summary:
      "This category is included in the first release structure and will use dedicated symptom logic in the next application-script parts.",

    urgency: {
      level: system === "brakes" || system === "cooling"
        ? "high"
        : "medium",
      label:
        system === "brakes" || system === "cooling"
          ? "Prioritise safety"
          : "Inspect before replacing parts"
    },

    direction: {
      title: "Use symptom-led diagnosis",
      copy:
        "Start with the exact behaviour, warning light and operating condition rather than assuming one component has failed."
    },

    driving: {
      title:
        system === "brakes" || system === "cooling"
          ? "Stop if the vehicle is unsafe"
          : "Limit driving if the fault worsens",
      copy:
        "Serious brake symptoms, overheating, smoke, fluid loss or unpredictable vehicle behaviour require stopping and professional help."
    },

    mot: {
      title: "MOT relevance requires physical assessment",
      copy:
        "Warning lights and safety-system faults may affect an MOT, but the app cannot confirm the test result."
    },

    causes: [
      "The fault may involve several related components.",
      "The operating conditions are needed to narrow the diagnosis.",
      "A physical inspection and measurements may still be required."
    ],

    checks: [
      "Record the first symptom and any warning light.",
      "Check relevant fluid levels only when safe.",
      "Use the Motor Vehicle Expert diagnostic hub.",
      "Arrange professional testing before replacing parts."
    ],

    guides: [
      {
        title: "Vehicle Diagnostics Hub",
        url: "diagnostics.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  });
}

/* ==========================================================
   17. PRINT
========================================================== */

function printCurrentResult() {
  if (!state.lastResult || dom.resultSection?.hidden) {
    return;
  }

  window.print();
}

/* ==========================================================
   18. EVENT LISTENERS
========================================================== */

function bindEvents() {
  dom.routeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openRoute(button.dataset.checkerRoute);
    });
  });

  dom.closeButtons.forEach((button) => {
    button.addEventListener("click", closeChecker);
  });

  dom.openClutchButtons.forEach((button) => {
    button.addEventListener("click", openClutchChecker);
  });

  dom.systemRadios.forEach((radio) => {
    radio.addEventListener(
      "change",
      handleSystemSelection
    );
  });

  dom.clutchSymptomRadios.forEach((radio) => {
    radio.addEventListener(
      "change",
      handleClutchSymptomSelection
    );
  });

  dom.warningLightRadios.forEach((radio) => {
    radio.addEventListener(
      "change",
      handleWarningLightSelection
    );
  });

  dom.backButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleBackNavigation(button.dataset.checkerBack);
    });
  });

  dom.systemContinue?.addEventListener(
    "click",
    continueFromSystem
  );

  dom.clutchSymptomContinue?.addEventListener(
    "click",
    continueFromClutchSymptom
  );

  dom.clutchConditionsContinue?.addEventListener(
    "click",
    continueFromClutchConditions
  );

  dom.printResult?.addEventListener(
    "click",
    printCurrentResult
  );

  dom.startNewCheck?.addEventListener(
    "click",
    resetApplication
  );
}

/* ==========================================================
   19. INITIALISATION
========================================================== */

function initialiseApplication() {
  resetSymptomState();
  resetWarningState();

  hideAllCheckers();
  hideResult();

  bindEvents();
}

document.addEventListener(
  "DOMContentLoaded",
  initialiseApplication
);
/* ==========================================================
   20. CLUTCH DIAGNOSTIC CONTENT
========================================================== */

const CLUTCH_GUIDES = Object.freeze({
  hub: {
    title: "Clutch Slipping Symptoms",
    url: "clutch-slipping-symptoms.html"
  },

  burningSmell: {
    title: "Clutch Burning Smell",
    url: "clutch-burning-smell.html"
  },

  highBitePoint: {
    title: "High Clutch Bite Point",
    url: "high-clutch-bite-point.html"
  },

  pedalStuckDown: {
    title: "Clutch Pedal Stuck Down",
    url: "clutch-pedal-stuck-down.html"
  },

  pedalFloor: {
    title: "Clutch Pedal Goes to the Floor",
    url: "clutch-pedal-goes-to-floor.html"
  },

  noisePressed: {
    title: "Clutch Makes Noise When Pressed",
    url: "clutch-makes-noise-when-pressed.html"
  },

  highGearSlip: {
    title: "Clutch Slip in High Gears",
    url: "clutch-slip-in-high-gears.html"
  },

  afterReplacement: {
    title: "Clutch Slip After Replacement",
    url: "clutch-slip-after-replacement.html"
  },

  pullAwayJudder: {
    title: "Car Judders When Pulling Away",
    url: "car-judders-when-pulling-away.html"
  },

  revsNoAcceleration: {
    title: "Car Revs but Won't Accelerate",
    url: "car-revs-but-wont-accelerate.html"
  },

  replacementCost: {
    title: "Clutch Replacement Cost UK",
    url: "clutch-replacement-cost-uk.html"
  },

  motClutch: {
    title: "Does the MOT Check the Clutch?",
    url: "does-mot-check-clutch.html"
  }
});

const CLUTCH_SYMPTOM_PROFILES = Object.freeze({
  slipping: {
    title: "Clutch Slip or Engine Rev Flare",

    summary:
      "The selected symptom suggests that engine torque may not be transferring fully through the clutch to the gearbox and road wheels.",

    direction: {
      title: "Possible clutch torque-transfer loss",
      copy:
        "Genuine clutch slip is supported when engine RPM rises cleanly without a matching increase in road speed while the clutch pedal is fully released."
    },

    baseUrgency: "medium",

    causes: [
      "Worn clutch friction material",
      "Reduced pressure-plate clamping force",
      "Oil or hydraulic-fluid contamination on the clutch",
      "Flywheel surface damage or excessive heat marking",
      "Clutch cable or hydraulic system preventing full engagement"
    ],

    checks: [
      "Compare engine RPM with road speed under normal load without deliberately abusing the clutch.",
      "Check whether the symptom is worse in higher gears, uphill or during overtaking.",
      "Confirm that the clutch pedal returns fully and is not being held partially released.",
      "Inspect for engine-oil or gearbox-oil leakage around the bellhousing.",
      "Check clutch and flywheel condition before authorising replacement parts."
    ],

    guides: [
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.highGearSlip,
      CLUTCH_GUIDES.burningSmell,
      CLUTCH_GUIDES.highBitePoint,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "burning-smell": {
    title: "Burning Clutch Smell",

    summary:
      "The selected symptom suggests friction material may be overheating, but the smell source must be confirmed before the clutch is condemned.",

    direction: {
      title: "Possible clutch overheating",
      copy:
        "A sharp friction smell after hill starts, reversing, traffic or heavy load may come from excessive clutch slip. Binding brakes, oil leaks, electrical faults and auxiliary belts can produce different burning smells."
    },

    baseUrgency: "medium",

    causes: [
      "Excessive clutch slipping during manoeuvring",
      "Worn friction plate or weak pressure plate",
      "Clutch held partially engaged by pedal, cable or hydraulic preload",
      "Oil contamination causing repeated slip and heat",
      "Driving conditions that repeatedly overload the clutch"
    ],

    checks: [
      "Identify exactly when the smell appears and whether it follows clutch use.",
      "Check whether engine RPM rises without matching acceleration.",
      "Confirm that no wheel or brake is becoming abnormally hot.",
      "Inspect for oil leakage onto hot exhaust or clutch components.",
      "Stop repeated slip testing because it can cause further damage."
    ],

    guides: [
      CLUTCH_GUIDES.burningSmell,
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.highGearSlip,
      CLUTCH_GUIDES.pullAwayJudder,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "high-bite-point": {
    title: "High Clutch Bite Point",

    summary:
      "A high engagement point can support clutch wear, but pedal position varies between vehicles and is not enough to confirm clutch failure by itself.",

    direction: {
      title: "Clutch wear or operating-system adjustment requires checking",
      copy:
        "The diagnosis becomes stronger when a high bite point is combined with rev flare, burning smells or weak acceleration under load."
    },

    baseUrgency: "low",

    causes: [
      "Normal pedal characteristic for the vehicle",
      "Progressive clutch friction-plate wear",
      "Cable adjustment or self-adjuster condition",
      "Hydraulic clutch operating characteristics",
      "Pressure-plate, release-bearing or flywheel wear"
    ],

    checks: [
      "Compare the current bite point with the vehicle's previous behaviour.",
      "Confirm whether the clutch slips in higher gears or uphill.",
      "Check pedal free movement and full return.",
      "Inspect cable adjustment where the design permits adjustment.",
      "Avoid replacing the clutch on bite-point position alone."
    ],

    guides: [
      CLUTCH_GUIDES.highBitePoint,
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.highGearSlip,
      CLUTCH_GUIDES.burningSmell,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "pedal-stuck-down": {
    title: "Clutch Pedal Stays Down",

    summary:
      "A pedal that remains near the floor or returns slowly points towards a clutch-release or pedal-return fault rather than friction wear alone.",

    direction: {
      title: "Release-system movement or pressure is not returning correctly",
      copy:
        "The problem may be hydraulic, cable-operated or mechanical. The complete path from pedal to pressure plate must be checked before individual components are replaced."
    },

    baseUrgency: "high",

    causes: [
      "Failed clutch master cylinder",
      "Failed or leaking slave cylinder",
      "Air or leakage in the hydraulic circuit",
      "Binding clutch cable or damaged pedal mechanism",
      "Release fork, pivot, bearing or pressure-plate fault"
    ],

    checks: [
      "Check clutch or shared brake-fluid level before further driving.",
      "Inspect around the pedal, master cylinder, pipework and slave cylinder for leakage.",
      "Observe whether the pedal can be lifted manually and whether pressure returns.",
      "Confirm release-fork or slave-cylinder movement where safely accessible.",
      "Do not repeatedly force gear selection if the clutch is not disengaging."
    ],

    guides: [
      CLUTCH_GUIDES.pedalStuckDown,
      CLUTCH_GUIDES.pedalFloor,
      CLUTCH_GUIDES.noisePressed,
      CLUTCH_GUIDES.highBitePoint,
      CLUTCH_GUIDES.motClutch
    ]
  },

  "pedal-floor": {
    title: "Clutch Pedal Goes to the Floor",

    summary:
      "Sudden loss of clutch-pedal pressure strongly suggests hydraulic pressure loss, cable failure or an internal release-system fault.",

    direction: {
      title: "Clutch release pressure or mechanical connection has been lost",
      copy:
        "A pedal with little or no resistance requires the hydraulic circuit, cable or pedal-to-release mechanism to be checked before the vehicle is driven."
    },

    baseUrgency: "high",

    causes: [
      "Clutch master-cylinder internal failure",
      "Slave-cylinder leakage or failure",
      "Hydraulic pipe or hose leak",
      "Air entering the clutch hydraulic circuit",
      "Broken clutch cable, pedal linkage or release mechanism"
    ],

    checks: [
      "Check the clutch-fluid or shared brake-fluid reservoir level.",
      "Look for wetness at the pedal, master cylinder, hydraulic line and slave cylinder.",
      "Do not continue driving if gear engagement or disengagement is unreliable.",
      "Pressure-test or bleed the system only after the leak source has been investigated.",
      "Check internal release components if external hydraulic operation appears normal."
    ],

    guides: [
      CLUTCH_GUIDES.pedalFloor,
      CLUTCH_GUIDES.pedalStuckDown,
      CLUTCH_GUIDES.noisePressed,
      CLUTCH_GUIDES.highBitePoint,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "noise-pressed": {
    title: "Clutch Noise When the Pedal Is Pressed",

    summary:
      "A noise that changes with clutch-pedal position helps narrow the fault towards the release system, pressure plate or gearbox input components.",

    direction: {
      title: "Clutch release-system noise requires mechanical inspection",
      copy:
        "Noise heard while pressing the pedal commonly involves the release bearing, fork, pivot, guide tube or pressure-plate fingers. Noise with the pedal released may point elsewhere."
    },

    baseUrgency: "medium",

    causes: [
      "Worn or dry clutch release bearing",
      "Release fork or pivot wear",
      "Damaged pressure-plate diaphragm fingers",
      "Binding release-bearing guide tube",
      "Gearbox input-shaft bearing or constant release preload"
    ],

    checks: [
      "Record whether the noise begins as the pedal moves, when fully pressed or when released.",
      "Compare the sound with the gearbox in neutral and the vehicle stationary.",
      "Check pedal return and signs of constant release-bearing contact.",
      "Inspect hydraulic or cable operation for incomplete return.",
      "Avoid authorising gearbox removal until the noise condition is reproduced clearly."
    ],

    guides: [
      CLUTCH_GUIDES.noisePressed,
      CLUTCH_GUIDES.pedalStuckDown,
      CLUTCH_GUIDES.pedalFloor,
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "pull-away-judder": {
    title: "Clutch Judder When Pulling Away",

    summary:
      "Pull-away judder suggests that clutch engagement or drivetrain movement is uneven, but the clutch plate is not the only possible cause.",

    direction: {
      title: "Uneven clutch engagement or drivetrain movement",
      copy:
        "The fault may involve clutch contamination, flywheel condition, engine or gearbox mounts, release movement or driveline play."
    },

    baseUrgency: "medium",

    causes: [
      "Oil-contaminated or heat-damaged clutch friction surfaces",
      "Dual-mass or solid flywheel damage",
      "Engine or gearbox mounting wear",
      "Uneven pressure-plate operation",
      "Driveshaft, differential or drivetrain movement"
    ],

    checks: [
      "Confirm whether the judder occurs only during clutch engagement.",
      "Compare cold and hot behaviour.",
      "Inspect engine and gearbox mounts under controlled load.",
      "Check for oil leakage around the bellhousing.",
      "Inspect clutch and flywheel surfaces if gearbox removal becomes necessary."
    ],

    guides: [
      CLUTCH_GUIDES.pullAwayJudder,
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.burningSmell,
      CLUTCH_GUIDES.highBitePoint,
      CLUTCH_GUIDES.replacementCost
    ]
  },

  "after-replacement": {
    title: "Clutch Problem After Replacement",

    summary:
      "A fault that begins after clutch work requires the installation, parts, hydraulics and flywheel condition to be reviewed before normal wear is blamed.",

    direction: {
      title: "Post-repair installation or system fault",
      copy:
        "New clutch slip, noise, smell or pedal trouble may result from contamination, incorrect parts, incomplete release, flywheel problems or installation error."
    },

    baseUrgency: "high",

    causes: [
      "Clutch friction surfaces contaminated during installation",
      "Incorrect or incompatible clutch kit",
      "Flywheel condition not corrected during repair",
      "Hydraulic or cable system holding the clutch partially released",
      "Installation, alignment or fastener problem"
    ],

    checks: [
      "Record the mileage and exact time since the repair.",
      "Return to the repairing garage promptly while evidence is fresh.",
      "Confirm the fitted clutch and flywheel part numbers.",
      "Check pedal free movement and full release-system return.",
      "Inspect for oil leakage, contamination and installation concerns before fitting another clutch."
    ],

    guides: [
      CLUTCH_GUIDES.afterReplacement,
      CLUTCH_GUIDES.hub,
      CLUTCH_GUIDES.highGearSlip,
      CLUTCH_GUIDES.burningSmell,
      CLUTCH_GUIDES.replacementCost
    ]
  }
});

/* ==========================================================
   21. CLUTCH CONDITION DEFINITIONS
========================================================== */

const CLUTCH_CONDITION_DATA = Object.freeze({
  "rpm-flare": {
    score: 3,
    category: "friction",
    cause:
      "Engine rev flare supports loss of clutch torque transfer.",
    check:
      "Compare RPM and road speed under normal load with the pedal fully released."
  },

  "high-gears": {
    score: 2,
    category: "friction",
    cause:
      "Higher-gear slip commonly exposes reduced clutch torque capacity.",
    check:
      "Check whether the fault appears first in fourth, fifth or sixth gear."
  },

  uphill: {
    score: 2,
    category: "friction",
    cause:
      "Uphill or heavy-load operation increases clutch torque demand.",
    check:
      "Record whether the fault becomes worse uphill, when towing or during overtaking."
  },

  "burning-smell": {
    score: 2,
    category: "heat",
    cause:
      "A repeated friction smell supports clutch overheating or excessive slip.",
    check:
      "Confirm that the smell follows clutch use rather than brake, belt, oil or electrical heat."
  },

  "pedal-slow": {
    score: 2,
    category: "release",
    cause:
      "Slow pedal return may prevent the clutch from engaging or disengaging fully.",
    check:
      "Inspect pedal return, hydraulic pressure release, cable movement and pedal springs."
  },

  "fluid-loss": {
    score: 4,
    category: "hydraulic",
    cause:
      "Falling hydraulic-fluid level indicates leakage that requires urgent investigation.",
    check:
      "Inspect the master cylinder, pipework, hose and slave cylinder for leakage."
  },

  "gear-selection": {
    score: 2,
    category: "release",
    cause:
      "Difficulty selecting first or reverse may mean the clutch is not disengaging fully.",
    check:
      "Compare gear selection with the engine running and switched off."
  },

  "noise-pressed": {
    score: 2,
    category: "release",
    cause:
      "Noise changing with pedal position supports a release-system or pressure-plate fault.",
    check:
      "Identify exactly when the noise starts during pedal travel."
  },

  judder: {
    score: 2,
    category: "engagement",
    cause:
      "Pull-away judder supports uneven engagement, contamination, flywheel or mounting problems.",
    check:
      "Inspect clutch engagement, flywheel condition and engine or gearbox mounts."
  },

  "worse-hot": {
    score: 1,
    category: "heat",
    cause:
      "A heat-related change may expose friction, clamping or hydraulic-return problems.",
    check:
      "Compare behaviour from cold with behaviour after normal operating temperature is reached."
  },

  "recent-repair": {
    score: 3,
    category: "repair",
    cause:
      "A recent repair makes installation, parts compatibility and post-repair adjustment important.",
    check:
      "Review the repair invoice, fitted parts and warranty before authorising further work."
  },

  "smoke-loss-drive": {
    score: 6,
    category: "critical",
    cause:
      "Smoke, severe slip or loss of drive indicates a breakdown-level fault.",
    check:
      "Stop driving and arrange recovery rather than performing further road tests."
  }
});

/* ==========================================================
   22. CLUTCH SAFETY SCORING
========================================================== */

function scoreClutchSafety(safety) {
  let score = 0;

  if (safety.drivePredictable === "sometimes") {
    score += 2;
  }

  if (safety.drivePredictable === "no") {
    score += 6;
  }

  if (safety.persistentHeat === "mild") {
    score += 2;
  }

  if (safety.persistentHeat === "severe") {
    score += 6;
  }

  if (safety.hydraulicLoss === "unsure") {
    score += 1;
  }

  if (safety.hydraulicLoss === "yes") {
    score += 5;
  }

  if (safety.faultTiming === "sudden") {
    score += 2;
  }

  if (safety.faultTiming === "after-repair") {
    score += 2;
  }

  return score;
}

function scoreClutchConditions(conditions) {
  return conditions.reduce((total, condition) => {
    return (
      total +
      (CLUTCH_CONDITION_DATA[condition]?.score || 0)
    );
  }, 0);
}

function determineClutchUrgency(
  profile,
  conditions,
  safety
) {
  const conditionScore =
    scoreClutchConditions(conditions);

  const safetyScore =
    scoreClutchSafety(safety);

  const totalScore =
    conditionScore + safetyScore;

  const criticalCondition =
    conditions.includes("smoke-loss-drive");

  const immediateSafetyConcern =
    safety.drivePredictable === "no" ||
    safety.persistentHeat === "severe" ||
    safety.hydraulicLoss === "yes";

  if (
    criticalCondition ||
    immediateSafetyConcern ||
    totalScore >= 10
  ) {
    return {
      level: "high",
      label: "Stop and arrange recovery",
      drivingTitle: "Do not continue driving",
      drivingCopy:
        "Unpredictable drive, severe slip, smoke, persistent burning smell or confirmed hydraulic-fluid loss can cause breakdown or unsafe vehicle behaviour. Stop safely and arrange recovery or professional assistance."
    };
  }

  if (
    profile.baseUrgency === "high" ||
    totalScore >= 5
  ) {
    return {
      level: "high",
      label: "Arrange urgent diagnosis",
      drivingTitle: "Limit or avoid driving",
      drivingCopy:
        "Use the vehicle only when it can be controlled predictably and there is no smoke, major fluid loss or severe slip. Avoid fast roads, overtaking, steep hills and heavy loads until the fault is diagnosed."
    };
  }

  if (
    profile.baseUrgency === "medium" ||
    totalScore >= 2
  ) {
    return {
      level: "medium",
      label: "Book diagnosis promptly",
      drivingTitle: "Drive cautiously if stable",
      drivingCopy:
        "Short, gentle driving may be reasonable only when the pedal returns normally, acceleration remains predictable and there is no smoke, fluid loss or strong persistent smell. Avoid unnecessary clutch load."
    };
  }

  return {
    level: "low",
    label: "Monitor and arrange inspection",
    drivingTitle: "Monitor for progression",
    drivingCopy:
      "The symptom may not require immediate recovery when vehicle control remains normal, but arrange inspection if it worsens, begins slipping under load or develops smell, noise or pedal changes."
  };
}

/* ==========================================================
   23. CLUTCH MOT GUIDANCE
========================================================== */

function buildClutchMotGuidance(
  symptom,
  conditions,
  safety
) {
  const lossOfDrive =
    conditions.includes("smoke-loss-drive") ||
    safety.drivePredictable === "no";

  const hydraulicConcern =
    conditions.includes("fluid-loss") ||
    safety.hydraulicLoss === "yes";

  if (lossOfDrive) {
    return {
      title: "Severe fault may prevent safe MOT testing",
      copy:
        "The clutch is not normally assessed as a standalone MOT item, but a vehicle that cannot be driven or controlled safely may be unsuitable for the test."
    };
  }

  if (hydraulicConcern) {
    return {
      title: "Fluid loss requires repair regardless of MOT status",
      copy:
        "A clutch hydraulic leak may not always be assessed as a separate clutch item, but shared brake-fluid loss or unsafe operation can create wider safety and MOT concerns."
    };
  }

  if (
    symptom === "pedal-stuck-down" ||
    symptom === "pedal-floor"
  ) {
    return {
      title: "Pedal operation is mechanically important",
      copy:
        "The MOT does not confirm overall clutch condition. A pedal fault that prevents safe movement or reliable control should be repaired before the vehicle is presented."
    };
  }

  return {
    title: "Clutch condition is not fully assessed by the MOT",
    copy:
      "Clutch slip, bite point, smell and friction wear are not normally standalone MOT checks. A pass does not prove the clutch is mechanically sound."
  };
}

/* ==========================================================
   24. CLUTCH RESULT CONTENT BUILDERS
========================================================== */

function uniqueStrings(items) {
  return Array.from(
    new Set(
      items.filter(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    )
  );
}

function uniqueGuides(guides) {
  const seen = new Set();

  return guides.filter((guide) => {
    if (!guide?.url || seen.has(guide.url)) {
      return false;
    }

    seen.add(guide.url);
    return true;
  });
}

function buildConditionCauses(conditions) {
  return conditions
    .map(
      (condition) =>
        CLUTCH_CONDITION_DATA[condition]?.cause
    )
    .filter(Boolean);
}

function buildConditionChecks(conditions) {
  return conditions
    .map(
      (condition) =>
        CLUTCH_CONDITION_DATA[condition]?.check
    )
    .filter(Boolean);
}

function buildClutchGuides(
  symptom,
  conditions
) {
  const profile =
    CLUTCH_SYMPTOM_PROFILES[symptom];

  const guides = [
    ...(profile?.guides || [])
  ];

  if (conditions.includes("high-gears")) {
    guides.unshift(CLUTCH_GUIDES.highGearSlip);
  }

  if (conditions.includes("burning-smell")) {
    guides.unshift(CLUTCH_GUIDES.burningSmell);
  }

  if (
    conditions.includes("pedal-slow") ||
    conditions.includes("fluid-loss")
  ) {
    guides.unshift(
      CLUTCH_GUIDES.pedalStuckDown,
      CLUTCH_GUIDES.pedalFloor
    );
  }

  if (conditions.includes("noise-pressed")) {
    guides.unshift(CLUTCH_GUIDES.noisePressed);
  }

  if (conditions.includes("judder")) {
    guides.unshift(CLUTCH_GUIDES.pullAwayJudder);
  }

  if (conditions.includes("recent-repair")) {
    guides.unshift(CLUTCH_GUIDES.afterReplacement);
  }

  guides.push(
    CLUTCH_GUIDES.motClutch,
    CLUTCH_GUIDES.replacementCost
  );

  return uniqueGuides(guides).slice(0, 6);
}

function buildClutchDirectionCopy(
  profile,
  conditions
) {
  const evidence = [];

  if (conditions.includes("rpm-flare")) {
    evidence.push(
      "engine revs rising without matching road speed"
    );
  }

  if (conditions.includes("high-gears")) {
    evidence.push(
      "the fault becoming worse in higher gears"
    );
  }

  if (conditions.includes("fluid-loss")) {
    evidence.push(
      "reported hydraulic-fluid loss"
    );
  }

  if (conditions.includes("pedal-slow")) {
    evidence.push(
      "slow or incomplete pedal return"
    );
  }

  if (conditions.includes("recent-repair")) {
    evidence.push(
      "the symptom beginning after recent repair work"
    );
  }

  if (evidence.length === 0) {
    return profile.direction.copy;
  }

  return `${profile.direction.copy} The selected supporting evidence includes ${formatNaturalList(
    evidence
  )}.`;
}

function formatNaturalList(items) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items
    .slice(0, -1)
    .join(", ")}, and ${items.at(-1)}`;
}

/* ==========================================================
   25. GENERATE CLUTCH RESULT
========================================================== */

function generateClutchDiagnosticResult() {
  if (!validateClutchSafetyAnswers()) {
    return;
  }

  const symptom =
    state.clutch.symptom ||
    getCheckedValue(dom.clutchSymptomRadios);

  if (!symptom) {
    showSymptomStep(CHECKER_STEPS.SYMPTOM);
    return;
  }

  const profile =
    CLUTCH_SYMPTOM_PROFILES[symptom];

  if (!profile) {
    renderGuideOnlyResult({
      title: "Clutch Diagnostic Guidance",
      summary:
        "The selected clutch symptom requires further investigation through the complete clutch diagnostic hub.",
      url: `${MVE_BASE_URL}/clutch-slipping-symptoms.html`
    });

    return;
  }

  state.clutch.symptom = symptom;
  state.clutch.conditions =
    getCheckedValues(
      dom.clutchConditionCheckboxes
    );

  const safety = readClutchSafetyAnswers();

  const urgency =
    determineClutchUrgency(
      profile,
      state.clutch.conditions,
      safety
    );

  const mot =
    buildClutchMotGuidance(
      symptom,
      state.clutch.conditions,
      safety
    );

  const causes = uniqueStrings([
    ...buildConditionCauses(
      state.clutch.conditions
    ),
    ...profile.causes
  ]).slice(0, 7);

  const checks = uniqueStrings([
    urgency.level === "high"
      ? "Do not perform repeated road tests or clutch-slip tests when the vehicle is unsafe."
      : "",
    ...buildConditionChecks(
      state.clutch.conditions
    ),
    ...profile.checks
  ]).slice(0, 8);

  const guides = buildClutchGuides(
    symptom,
    state.clutch.conditions
  );

  renderResult({
    eyebrow: "Clutch diagnostic guidance",

    title: profile.title,

    summary: profile.summary,

    urgency: {
      level: urgency.level,
      label: urgency.label
    },

    direction: {
      title: profile.direction.title,
      copy: buildClutchDirectionCopy(
        profile,
        state.clutch.conditions
      )
    },

    driving: {
      title: urgency.drivingTitle,
      copy: urgency.drivingCopy
    },

    mot,

    causes,
    checks,
    guides
  });
}

/* ==========================================================
   26. CLUTCH EVENT BINDING
========================================================== */

function bindClutchResultEvent() {
  dom.generateClutchResult?.addEventListener(
    "click",
    generateClutchDiagnosticResult
  );
}

bindClutchResultEvent();

/* ==========================================================
   27. WARNING-LIGHT DIAGNOSTIC CONTENT
========================================================== */

const WARNING_LIGHT_PROFILES = Object.freeze({
  "oil-pressure": {
    title: "Oil Pressure Warning Light",

    summary:
      "A red oil-pressure warning can indicate that the engine is not receiving sufficient lubrication pressure.",

    urgency: {
      level: "high",
      label: "Stop the engine immediately"
    },

    direction: {
      title: "Possible engine-lubrication pressure loss",
      copy:
        "The warning may result from low oil level, a pressure-sensor fault, oil-pump failure, blocked oil flow or serious internal engine wear. The light alone cannot identify which cause is present."
    },

    driving: {
      title: "Do not continue driving",
      copy:
        "Stop safely and switch the engine off. Continuing to run an engine with genuinely low oil pressure can cause severe internal damage within a short distance."
    },

    mot: {
      title: "Mechanical urgency is greater than MOT relevance",
      copy:
        "The immediate priority is preventing engine damage. Warning-light operation and visible oil leakage may also affect vehicle condition and testability."
    },

    causes: [
      "Low engine-oil level",
      "Oil-pressure sensor or wiring fault",
      "Oil-pump or pressure-regulation failure",
      "Blocked oil pickup or restricted oil flow",
      "Excessive internal engine-bearing clearance"
    ],

    checks: [
      "Stop the engine and allow the vehicle to stand safely.",
      "Check the oil level using the manufacturer-approved procedure.",
      "Do not restart repeatedly when the oil level is correct but the warning remains.",
      "Measure actual oil pressure with suitable diagnostic equipment.",
      "Inspect for oil leakage and mechanical engine noise."
    ],

    guides: [
      {
        title: "Oil Warning Light Guide",
        url: "oil-warning-light.html"
      },
      {
        title: "Does the MOT Check Engine Oil?",
        url: "does-mot-check-engine-oil.html"
      },
      {
        title: "Vehicle Diagnostics Hub",
        url: "diagnostics.html"
      }
    ]
  },

  "coolant-temperature": {
    title: "Coolant Temperature Warning Light",

    summary:
      "A red coolant-temperature warning indicates overheating or a cooling-system fault that may rapidly damage the engine.",

    urgency: {
      level: "high",
      label: "Stop and allow the engine to cool"
    },

    direction: {
      title: "Possible cooling-system overheating",
      copy:
        "The fault may involve coolant loss, restricted circulation, thermostat failure, cooling-fan failure, water-pump trouble or combustion pressure entering the cooling system."
    },

    driving: {
      title: "Do not continue driving while overheating",
      copy:
        "Stop safely, switch the engine off and allow it to cool. Never remove a hot pressurised coolant cap. Arrange recovery if the warning returns, coolant is lost or steam is present."
    },

    mot: {
      title: "Overheating must be repaired before testing",
      copy:
        "Cooling-system condition is mechanically critical even where the original cause is not a standalone MOT item. Visible leakage, warning lights or unsafe operation may create wider concerns."
    },

    causes: [
      "Low coolant level or active coolant leak",
      "Thermostat stuck closed",
      "Cooling fan or fan-control fault",
      "Water-pump or circulation failure",
      "Radiator restriction or head-gasket-related pressure"
    ],

    checks: [
      "Stop and allow the engine to cool completely.",
      "Check coolant level only when the system is cold.",
      "Inspect for visible leakage, steam or dried coolant residue.",
      "Confirm cooling-fan operation.",
      "Pressure-test the cooling system and verify coolant circulation."
    ],

    guides: [
      {
        title: "Vehicle Overheating Diagnostics",
        url: "diagnostics.html"
      },
      {
        title: "Water Pump Replacement Cost UK",
        url: "water-pump-replacement-cost-uk.html"
      },
      {
        title: "Thermostat Replacement Cost UK",
        url: "thermostat-replacement-cost-uk.html"
      }
    ]
  },

  brake: {
    title: "Brake Warning Light",

    summary:
      "A red brake warning may indicate the parking brake is applied, brake-fluid level is low or a brake-system fault is present.",

    urgency: {
      level: "high",
      label: "Check braking safety before moving"
    },

    direction: {
      title: "Possible brake-fluid or braking-system concern",
      copy:
        "The warning can relate to the parking brake, low fluid, hydraulic pressure, pad monitoring or an electronic braking-system fault depending on the vehicle."
    },

    driving: {
      title: "Do not drive with reduced braking",
      copy:
        "If the pedal is soft, sinks, braking effort is reduced or fluid is low, do not continue driving. Arrange recovery and professional inspection."
    },

    mot: {
      title: "Brake warning lights can affect the MOT",
      copy:
        "Braking performance, hydraulic condition and applicable warning-light operation are safety-critical MOT areas."
    },

    causes: [
      "Parking brake not fully released",
      "Low brake-fluid level",
      "Brake-fluid leak",
      "Hydraulic pressure or master-cylinder fault",
      "Brake pad, sensor or electronic braking-system fault"
    ],

    checks: [
      "Confirm the parking brake is fully released.",
      "Check brake-fluid level without topping up blindly.",
      "Inspect for visible fluid leakage.",
      "Assess pedal firmness and braking response.",
      "Arrange immediate brake inspection if the warning remains."
    ],

    guides: [
      {
        title: "Car Fails MOT on Brakes",
        url: "car-fails-mot-on-brakes.html"
      },
      {
        title: "Disc Brakes Explained",
        url: "disc-brakes-explained.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  },

  "engine-management": {
    title: "Engine Management Light",

    summary:
      "The engine management light indicates that the engine or emissions-control system has detected a fault.",

    urgency: {
      level: "medium",
      label: "Diagnose promptly"
    },

    direction: {
      title: "Engine or emissions fault requires code-guided diagnosis",
      copy:
        "The warning may be caused by ignition, fuelling, airflow, boost, emissions or sensor faults. A fault code provides direction but does not automatically identify the failed part."
    },

    driving: {
      title: "Drive gently only if the vehicle remains stable",
      copy:
        "Avoid hard acceleration and heavy load. Stop if the light flashes, the engine misfires heavily, power falls sharply, smoke appears or the vehicle becomes unsafe."
    },

    mot: {
      title: "An illuminated engine warning can affect the MOT",
      copy:
        "Where the warning indicates an emissions-related malfunction or the vehicle exceeds emissions limits, the vehicle may fail the MOT."
    },

    causes: [
      "Ignition or combustion misfire",
      "Airflow, boost or vacuum fault",
      "Fuel-delivery or mixture-control problem",
      "Emissions-control system fault",
      "Sensor, actuator or wiring fault"
    ],

    checks: [
      "Read stored and pending fault codes.",
      "Record whether the light is steady or flashing.",
      "Check for misfire, smoke, reduced power or unusual noise.",
      "Review live data and freeze-frame information.",
      "Test the affected circuit before replacing sensors or actuators."
    ],

    guides: [
      {
        title: "Fault-Code Checker",
        url: "fault-codes.html"
      },
      {
        title: "Car Diagnostics Explained",
        url: "car-diagnostics-explained.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  },

  abs: {
    title: "ABS Warning Light",

    summary:
      "An illuminated ABS warning indicates that the anti-lock braking system may be unavailable.",

    urgency: {
      level: "medium",
      label: "Arrange brake-system diagnosis"
    },

    direction: {
      title: "Anti-lock braking assistance may be disabled",
      copy:
        "Normal hydraulic braking may remain, but wheel-lock prevention and related stability functions may not operate correctly."
    },

    driving: {
      title: "Drive cautiously only if normal braking remains",
      copy:
        "Increase following distance and avoid harsh braking. Stop if the red brake warning also appears, the pedal feels abnormal or braking performance is reduced."
    },

    mot: {
      title: "The ABS warning light can cause MOT failure",
      copy:
        "Where ABS is fitted and the malfunction warning remains illuminated, this can be an MOT failure."
    },

    causes: [
      "Wheel-speed sensor fault",
      "Damaged sensor ring or wheel bearing encoder",
      "Sensor wiring or connector fault",
      "Low system voltage",
      "ABS control unit or hydraulic-modulator fault"
    ],

    checks: [
      "Read ABS-specific fault codes.",
      "Inspect wheel-speed sensor wiring and connectors.",
      "Compare live wheel-speed data.",
      "Check sensor rings and wheel-bearing condition.",
      "Confirm battery and charging voltage."
    ],

    guides: [
      {
        title: "ABS Warning Light Guide",
        url: "abs-warning-light.html"
      },
      {
        title: "Car Fails MOT on Brakes",
        url: "car-fails-mot-on-brakes.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  },

  airbag: {
    title: "Airbag Warning Light",

    summary:
      "An airbag or SRS warning indicates that part of the supplementary restraint system may be disabled.",

    urgency: {
      level: "medium",
      label: "Arrange diagnosis promptly"
    },

    direction: {
      title: "Restraint-system fault requires specialist testing",
      copy:
        "The fault may involve an airbag, seat-belt pretensioner, occupancy sensor, clock spring, connector, wiring circuit or control module."
    },

    driving: {
      title: "The vehicle may drive normally but protection may be reduced",
      copy:
        "The warning does not usually affect normal engine operation, but one or more restraint components may not operate correctly in a collision."
    },

    mot: {
      title: "An airbag warning can cause MOT failure",
      copy:
        "A supplementary restraint-system malfunction indicator showing a fault can result in an MOT failure."
    },

    causes: [
      "Seat wiring or connector fault",
      "Seat-belt pretensioner fault",
      "Steering-wheel clock spring failure",
      "Occupancy or impact sensor fault",
      "Airbag control-module or power-supply fault"
    ],

    checks: [
      "Read manufacturer-compatible SRS fault codes.",
      "Do not probe airbag circuits with unsuitable equipment.",
      "Inspect seat connectors only with correct safety procedures.",
      "Check battery-voltage history and previous repair work.",
      "Arrange qualified restraint-system diagnosis."
    ],

    guides: [
      {
        title: "Airbag Warning Light Guide",
        url: "airbag-warning-light.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      },
      {
        title: "Vehicle Diagnostics Hub",
        url: "diagnostics.html"
      }
    ]
  },

  battery: {
    title: "Battery or Charging Warning Light",

    summary:
      "A charging warning usually means the alternator is not supplying the electrical system correctly while the engine is running.",

    urgency: {
      level: "high",
      label: "Vehicle may stop without warning"
    },

    direction: {
      title: "Possible charging-system failure",
      copy:
        "The fault may involve the alternator, auxiliary belt, wiring, battery terminals or power-management system."
    },

    driving: {
      title: "Limit driving and prepare to stop",
      copy:
        "The vehicle may continue using stored battery energy but can stop once voltage falls. Stop if steering assistance, cooling or electrical systems begin to fail."
    },

    mot: {
      title: "Electrical faults may affect testable systems",
      copy:
        "The charging fault itself is mechanically urgent. Low voltage may also affect lamps, steering assistance, warning lights and emissions systems."
    },

    causes: [
      "Alternator or regulator failure",
      "Broken or slipping auxiliary belt",
      "Loose or damaged charging cable",
      "Poor battery-terminal connection",
      "Battery or battery-monitoring fault"
    ],

    checks: [
      "Check whether the auxiliary belt is present and intact.",
      "Measure battery voltage with the engine off and running.",
      "Inspect charging cables and battery terminals.",
      "Check alternator output under electrical load.",
      "Avoid repeated restarting if charging has failed."
    ],

    guides: [
      {
        title: "Battery vs Alternator Diagnosis",
        url: "battery-vs-alternator-diagnosis.html"
      },
      {
        title: "Alternator Replacement Cost UK",
        url: "alternator-replacement-cost-uk.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  },

  dpf: {
    title: "DPF Warning Light",

    summary:
      "A diesel particulate filter warning indicates that soot loading, regeneration or the emissions-control system requires attention.",

    urgency: {
      level: "medium",
      label: "Investigate before blockage worsens"
    },

    direction: {
      title: "DPF regeneration or emissions fault",
      copy:
        "The warning may result from interrupted regeneration, excessive soot production, pressure-sensor faults, temperature-sensor faults or an underlying engine problem."
    },

    driving: {
      title: "Follow manufacturer guidance only when the vehicle is stable",
      copy:
        "A normal regeneration drive may be appropriate on some vehicles, but not when warning lights multiply, power is severely reduced, oil level is high or the engine is running poorly."
    },

    mot: {
      title: "DPF and emissions faults can affect the MOT",
      copy:
        "Visible smoke, emissions-system faults, warning lights and evidence that a factory-fitted DPF has been removed or tampered with may cause failure."
    },

    causes: [
      "Repeated short journeys preventing regeneration",
      "Excessive soot production from engine faults",
      "DPF pressure-sensor or hose fault",
      "Exhaust-temperature sensor fault",
      "Heavily blocked or damaged DPF"
    ],

    checks: [
      "Read fault codes and soot-loading data.",
      "Check oil level for fuel dilution.",
      "Inspect DPF pressure hoses and sensors.",
      "Confirm that engine and temperature faults are not preventing regeneration.",
      "Avoid forced regeneration where the underlying fault is unresolved."
    ],

    guides: [
      {
        title: "DPF Warning Light Guide",
        url: "dpf-warning-light-explained.html"
      },
      {
        title: "Car Fails MOT on Emissions",
        url: "car-fails-mot-on-emissions.html"
      },
      {
        title: "Fault-Code Checker",
        url: "fault-codes.html"
      }
    ]
  },

  "tyre-pressure": {
    title: "Tyre Pressure Warning Light",

    summary:
      "The tyre-pressure warning indicates that one or more tyres may be underinflated or that the monitoring system has detected a fault.",

    urgency: {
      level: "medium",
      label: "Check tyre condition promptly"
    },

    direction: {
      title: "Possible pressure loss or TPMS fault",
      copy:
        "The warning may be caused by a puncture, slow leak, temperature-related pressure change, incorrect inflation or a sensor problem."
    },

    driving: {
      title: "Stop if a tyre looks damaged or rapidly deflated",
      copy:
        "Check the tyres before continuing. Do not drive on a visibly flat, damaged or overheating tyre."
    },

    mot: {
      title: "TPMS warning operation can affect the MOT",
      copy:
        "On vehicles subject to TPMS inspection requirements, an illuminated malfunction warning may result in an MOT failure."
    },

    causes: [
      "Puncture or slow air leak",
      "Incorrect tyre pressure",
      "Valve or wheel-rim leakage",
      "Temperature-related pressure change",
      "TPMS sensor or calibration fault"
    ],

    checks: [
      "Inspect all tyres for visible damage.",
      "Measure pressures when the tyres are cold.",
      "Inflate to the vehicle manufacturer's specification.",
      "Check for valve, bead or puncture leakage.",
      "Reset or diagnose the TPMS only after pressures are correct."
    ],

    guides: [
      {
        title: "Tyre Pressure Warning Light",
        url: "tyre-pressure-warning-light.html"
      },
      {
        title: "Car Fails MOT on Tyres",
        url: "car-fails-mot-on-tyres.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  },

  "traction-control": {
    title: "Traction Control Warning Light",

    summary:
      "A flashing traction-control light can indicate active intervention, while a light that stays on may indicate a system fault or disabled function.",

    urgency: {
      level: "medium",
      label: "Check stability-system operation"
    },

    direction: {
      title: "Traction or stability assistance may be reduced",
      copy:
        "The fault may involve wheel-speed sensing, steering-angle data, yaw sensing, ABS communication, engine-management faults or a deliberately switched-off system."
    },

    driving: {
      title: "Drive cautiously, especially in poor conditions",
      copy:
        "Avoid aggressive acceleration and allow extra margin on wet, icy or loose surfaces. Stop if braking or steering warnings also appear."
    },

    mot: {
      title: "Stability-control warnings can affect the MOT",
      copy:
        "Where electronic stability control is fitted and the malfunction indicator remains illuminated, this may result in MOT failure."
    },

    causes: [
      "Wheel-speed sensor or sensor-ring fault",
      "Steering-angle sensor calibration issue",
      "ABS or stability-control module fault",
      "Low battery or charging voltage",
      "Engine-management fault affecting torque control"
    ],

    checks: [
      "Confirm whether the light flashes only during wheel slip.",
      "Check that the system has not been manually switched off.",
      "Read ABS and stability-control fault codes.",
      "Compare wheel-speed and steering-angle data.",
      "Check battery and charging voltage."
    ],

    guides: [
      {
        title: "Traction Control Warning Light",
        url: "traction-control-warning-light.html"
      },
      {
        title: "ABS Warning Light Guide",
        url: "abs-warning-light.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      }
    ]
  }
});

/* ==========================================================
   28. WARNING-LIGHT FALLBACK GUIDES
========================================================== */

function addWarningFallbackGuides(guides) {
  return uniqueGuides([
    ...guides,
    {
      title: "Warning Lights Guide",
      url: "warning-lights.html"
    },
    {
      title: "Vehicle Diagnostics Hub",
      url: "diagnostics.html"
    }
  ]).slice(0, 6);
}

/* ==========================================================
   29. GENERATE WARNING-LIGHT RESULT
========================================================== */

function generateWarningLightResult() {
  const selected =
    state.warningLight ||
    getCheckedValue(dom.warningLightRadios);

  if (!selected) {
    setButtonDisabled(
      dom.generateWarningResult,
      true
    );

    return;
  }

  const profile =
    WARNING_LIGHT_PROFILES[selected];

  if (!profile) {
    renderGuideOnlyResult({
      title: "Dashboard Warning-Light Guidance",
      summary:
        "Use the Motor Vehicle Expert warning-light hub to identify the symbol, urgency and next checks.",
      url: `${MVE_BASE_URL}/warning-lights.html`
    });

    return;
  }

  state.warningLight = selected;

  renderResult({
    eyebrow: "Dashboard warning-light guidance",

    title: profile.title,

    summary: profile.summary,

    urgency: profile.urgency,

    direction: profile.direction,

    driving: profile.driving,

    mot: profile.mot,

    causes: profile.causes,

    checks: profile.checks,

    guides: addWarningFallbackGuides(
      profile.guides || []
    )
  });
}

/* ==========================================================
   30. WARNING-LIGHT EVENT BINDING
========================================================== */

function bindWarningLightResultEvent() {
  dom.generateWarningResult?.addEventListener(
    "click",
    generateWarningLightResult
  );
}

bindWarningLightResultEvent();

/* ==========================================================
   31. RESULT QUALITY SAFEGUARDS
========================================================== */

function validateResultStructure(result) {
  if (!result || typeof result !== "object") {
    return false;
  }

  const requiredTextFields = [
    result.title,
    result.summary,
    result.direction?.title,
    result.direction?.copy,
    result.driving?.title,
    result.driving?.copy,
    result.mot?.title,
    result.mot?.copy,
    result.urgency?.label
  ];

  if (
    requiredTextFields.some(
      (value) =>
        typeof value !== "string" ||
        value.trim().length === 0
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(result.causes) ||
    result.causes.length === 0
  ) {
    return false;
  }

  if (
    !Array.isArray(result.checks) ||
    result.checks.length === 0
  ) {
    return false;
  }

  return true;
}

const originalRenderResult = renderResult;

renderResult = function safeRenderResult(result) {
  if (!validateResultStructure(result)) {
    originalRenderResult({
      eyebrow: "Diagnostic guidance",

      title: "Result Could Not Be Generated",

      summary:
        "The selected pathway did not return enough structured information to produce a safe result.",

      urgency: {
        level: "medium",
        label: "Use the diagnostic guides"
      },

      direction: {
        title: "Further investigation required",
        copy:
          "Use the Motor Vehicle Expert diagnostic hub and arrange professional testing where the fault affects safety or vehicle control."
      },

      driving: {
        title: "Do not ignore serious symptoms",
        copy:
          "Stop driving if braking, steering, overheating, smoke, fluid loss or unpredictable vehicle behaviour is present."
      },

      mot: {
        title: "MOT relevance cannot be confirmed",
        copy:
          "A physical inspection and the official MOT test are required."
      },

      causes: [
        "The selected information was incomplete.",
        "The fault may involve more than one vehicle system."
      ],

      checks: [
        "Restart the checker and review the selected answers.",
        "Open the Motor Vehicle Expert diagnostic hub.",
        "Arrange professional inspection where safety is involved."
      ],

      guides: [
        {
          title: "Vehicle Diagnostics Hub",
          url: "diagnostics.html"
        },
        {
          title: "Warning Lights Guide",
          url: "warning-lights.html"
        }
      ]
    });

    return;
  }

  originalRenderResult(result);
};

/* ==========================================================
   32. APPLICATION ERROR BOUNDARY
========================================================== */

function renderApplicationError() {
  originalRenderResult({
    eyebrow: "Application message",

    title: "The Checker Encountered a Problem",

    summary:
      "The page could not complete the selected diagnostic pathway. No vehicle diagnosis has been confirmed.",

    urgency: {
      level: "medium",
      label: "Use manual guidance"
    },

    direction: {
      title: "Restart the check or use the live guides",
      copy:
        "A technical page error should never be interpreted as a vehicle result."
    },

    driving: {
      title: "Respond to the actual vehicle symptoms",
      copy:
        "Stop driving when braking, steering, overheating, smoke, fluid loss or unpredictable operation makes the vehicle unsafe."
    },

    mot: {
      title: "MOT status cannot be determined here",
      copy:
        "Use the official MOT test and a physical inspection."
    },

    causes: [
      "The browser may have blocked part of the script.",
      "The page may not have loaded completely.",
      "A required interface element may be missing."
    ],

    checks: [
      "Reload the page.",
      "Restart the vehicle check.",
      "Use the Motor Vehicle Expert diagnostic guides.",
      "Arrange professional inspection for urgent symptoms."
    ],

    guides: [
      {
        title: "Vehicle Diagnostics Hub",
        url: "diagnostics.html"
      },
      {
        title: "Warning Lights Guide",
        url: "warning-lights.html"
      },
      {
        title: "Contact Motor Vehicle Expert",
        url: "contact.html"
      }
    ]
  });
}

window.addEventListener("error", (event) => {
  console.error(
    "AutoKnowledge Pro application error:",
    event.error || event.message
  );

  if (
    event.error ||
    String(event.message || "").trim()
  ) {
    renderApplicationError();
  }
});

window.addEventListener(
  "unhandledrejection",
  (event) => {
    console.error(
      "AutoKnowledge Pro promise rejection:",
      event.reason
    );

    renderApplicationError();
  }
);
/* ==========================================================
   33. ENGINE AND ACCELERATION CONTENT
========================================================== */

const ENGINE_SYSTEM_RESULT = Object.freeze({
  eyebrow: "Engine and acceleration guidance",

  title: "Engine and Acceleration Problem",

  summary:
    "Poor acceleration, hesitation, stuttering and power loss can originate from the engine, fuel system, airflow system, boost control, exhaust system or drivetrain. The behaviour of engine RPM is one of the most useful first distinctions.",

  urgency: {
    level: "medium",
    label: "Diagnose before the fault worsens"
  },

  direction: {
    title: "Separate engine power loss from drivetrain slip",
    copy:
      "An engine that cannot raise its RPM smoothly points towards combustion, airflow, fuel, boost or exhaust restriction. Engine RPM rising strongly without matching road speed points more towards clutch or transmission slip."
  },

  driving: {
    title: "Limit load until the cause is known",
    copy:
      "Avoid overtaking, towing, steep hills and fast-road driving when acceleration is unpredictable. Stop if the engine warning light flashes, heavy misfire develops, smoke appears or power falls suddenly."
  },

  mot: {
    title: "Warning lights and emissions may affect the MOT",
    copy:
      "Loss of power is not itself a standalone MOT item, but engine warning lights, emissions faults, smoke and unsafe vehicle operation may result in failure or prevent normal testing."
  },

  causes: [
    "Ignition misfire or poor combustion",
    "Fuel-pressure, injector or mixture-control fault",
    "Airflow-meter, throttle or intake leak",
    "Turbocharger, boost-control or charge-air leak",
    "Blocked exhaust, DPF or catalytic-converter restriction",
    "Clutch or transmission slip rather than engine power loss"
  ],

  checks: [
    "Observe whether engine RPM rises freely when acceleration is weak.",
    "Record whether the fault appears cold, hot, uphill or under heavy load.",
    "Check for smoke, warning lights, misfire and unusual noises.",
    "Read stored and pending fault codes where available.",
    "Inspect intake hoses, boost pipes and vacuum connections.",
    "Use live data and physical testing before replacing sensors."
  ],

  guides: [
    {
      title: "Car Feels Slow to Accelerate",
      url: "car-feels-slow-to-accelerate.html"
    },
    {
      title: "Car Hesitates When Accelerating",
      url: "car-hesitates-when-accelerating.html"
    },
    {
      title: "Car Stutters When Accelerating",
      url: "car-stutters-when-accelerating.html"
    },
    {
      title: "Car Loses Power Uphill",
      url: "car-loses-power-uphill.html"
    },
    {
      title: "Car Revs but Won't Accelerate",
      url: "car-revs-but-wont-accelerate.html"
    },
    {
      title: "Fault-Code Checker",
      url: "fault-codes.html"
    }
  ]
});

/* ==========================================================
   34. BATTERY AND STARTING CONTENT
========================================================== */

const STARTING_SYSTEM_RESULT = Object.freeze({
  eyebrow: "Battery and starting guidance",

  title: "Battery or Starting Problem",

  summary:
    "A vehicle that will not start must first be divided into no-crank, slow-crank, normal-crank and starts-then-stalls conditions. These behaviours lead to different diagnostic paths.",

  urgency: {
    level: "medium",
    label: "Test the starting system"
  },

  direction: {
    title: "Identify what happens when the key is turned",
    copy:
      "Silence, rapid clicking, one heavy click, slow cranking and normal-speed cranking are not the same fault. Battery condition should be measured under load before the starter motor or alternator is condemned."
  },

  driving: {
    title: "Do not rely on repeated restarting",
    copy:
      "A vehicle with charging or intermittent starting trouble may leave the driver stranded. If the charging warning is illuminated while driving, limit electrical load and prepare for the vehicle to stop."
  },

  mot: {
    title: "The vehicle must start and operate for testing",
    copy:
      "A vehicle that cannot start or remain running cannot complete a normal MOT test. Electrical faults may also affect lamps, warning lights and other inspected systems."
  },

  causes: [
    "Discharged, weak or internally failed battery",
    "Loose, corroded or high-resistance battery connection",
    "Starter relay, solenoid or starter-motor fault",
    "Alternator or charging-system failure",
    "Immobiliser, ignition-switch or control-system fault",
    "Fuel, ignition or engine fault where cranking speed is normal"
  ],

  checks: [
    "Record whether the engine does not crank, cranks slowly or cranks normally.",
    "Measure battery open-circuit voltage and voltage during cranking.",
    "Inspect battery terminals, earth straps and main positive cables.",
    "Check starter command and voltage drop under load.",
    "Measure charging voltage after the engine starts.",
    "Do not replace the battery solely because a jump start worked."
  ],

  guides: [
    {
      title: "Battery vs Alternator Diagnosis",
      url: "battery-vs-alternator-diagnosis.html"
    },
    {
      title: "Alternator Charging System",
      url: "alternator-charging-system.html"
    },
    {
      title: "Alternator Replacement Cost UK",
      url: "alternator-replacement-cost-uk.html"
    },
    {
      title: "Battery Warning Light",
      url: "battery-warning-light.html"
    },
    {
      title: "Car Diagnostics Explained",
      url: "car-diagnostics-explained.html"
    },
    {
      title: "Vehicle Diagnostics Hub",
      url: "diagnostics.html"
    }
  ]
});

/* ==========================================================
   35. COOLING AND OVERHEATING CONTENT
========================================================== */

const COOLING_SYSTEM_RESULT = Object.freeze({
  eyebrow: "Cooling-system safety guidance",

  title: "Cooling or Overheating Problem",

  summary:
    "Overheating can cause severe engine damage. Coolant level, circulation, pressure control, airflow and combustion leakage must be considered in a safe diagnostic order.",

  urgency: {
    level: "high",
    label: "Stop if the engine is overheating"
  },

  direction: {
    title: "Possible coolant loss or circulation failure",
    copy:
      "An overheating engine may have low coolant, leakage, thermostat trouble, cooling-fan failure, water-pump failure, radiator restriction or combustion pressure entering the cooling system."
  },

  driving: {
    title: "Do not drive while the temperature is excessive",
    copy:
      "Stop safely and switch the engine off when the temperature warning appears, the gauge enters the hot zone or steam is present. Never remove a pressurised coolant cap while the engine is hot."
  },

  mot: {
    title: "Mechanical urgency comes before the MOT",
    copy:
      "The underlying cooling fault may not always be a standalone MOT item, but visible leakage, warning lights, emissions problems or unsafe operation can affect testing."
  },

  causes: [
    "Low coolant level or external coolant leak",
    "Thermostat stuck closed or opening incorrectly",
    "Cooling fan, relay, control or temperature-sensor fault",
    "Water-pump or drive-belt failure",
    "Restricted radiator or poor coolant circulation",
    "Head-gasket or cylinder-head-related combustion leakage"
  ],

  checks: [
    "Allow the engine to cool fully before inspecting the system.",
    "Check coolant level and condition only when safe.",
    "Inspect hoses, radiator, thermostat housing, pump and expansion tank for leakage.",
    "Confirm cooling-fan operation at the correct temperature.",
    "Pressure-test the system and cap.",
    "Check coolant circulation and test for combustion gases when evidence supports it."
  ],

  guides: [
    {
      title: "Vehicle Diagnostics Hub",
      url: "diagnostics.html"
    },
    {
      title: "Thermostat Replacement Cost UK",
      url: "thermostat-replacement-cost-uk.html"
    },
    {
      title: "Water Pump Replacement Cost UK",
      url: "water-pump-replacement-cost-uk.html"
    },
    {
      title: "Coolant Temperature Warning Light",
      url: "coolant-temperature-warning-light.html"
    },
    {
      title: "Warning Lights Guide",
      url: "warning-lights.html"
    },
    {
      title: "Car Diagnostics Explained",
      url: "car-diagnostics-explained.html"
    }
  ]
});

/* ==========================================================
   36. BRAKE SYSTEM CONTENT
========================================================== */

const BRAKE_SYSTEM_RESULT = Object.freeze({
  eyebrow: "Brake-system safety guidance",

  title: "Brake System Problem",

  summary:
    "Any change in braking effort, pedal feel, vehicle stability, temperature or warning-light operation must be treated as a safety concern until the braking system has been inspected.",

  urgency: {
    level: "high",
    label: "Prioritise braking safety"
  },

  direction: {
    title: "Hydraulic, friction or mechanical brake fault",
    copy:
      "The fault may involve fluid pressure, pads, discs, calipers, hoses, pipes, servo assistance, wheel bearings, ABS components or tyre and suspension conditions."
  },

  driving: {
    title: "Do not drive with reduced or unpredictable braking",
    copy:
      "Stop and arrange recovery if the pedal sinks, feels very soft, braking effort is reduced, the vehicle pulls severely, fluid is leaking or a wheel becomes dangerously hot."
  },

  mot: {
    title: "Brake defects are major MOT safety items",
    copy:
      "Braking performance, hydraulic condition, warning lights, components and imbalance are directly relevant to the MOT."
  },

  causes: [
    "Low brake-fluid level or hydraulic leakage",
    "Worn or contaminated brake pads",
    "Damaged, excessively worn or distorted brake discs",
    "Seized or binding brake caliper",
    "Brake hose, pipe, master-cylinder or servo fault",
    "ABS, wheel-speed sensor, tyre or suspension-related instability"
  ],

  checks: [
    "Assess pedal firmness before moving the vehicle.",
    "Check brake-fluid level without assuming that topping up fixes the cause.",
    "Inspect for leakage at pipes, hoses, calipers, cylinders and the master cylinder.",
    "Compare wheel temperatures only without touching hot components.",
    "Inspect pads, discs and caliper movement.",
    "Perform braking-efficiency and imbalance testing with suitable equipment."
  ],

  guides: [
    {
      title: "Disc Brakes Explained",
      url: "disc-brakes-explained.html"
    },
    {
      title: "Car Fails MOT on Brakes",
      url: "car-fails-mot-on-brakes.html"
    },
    {
      title: "Brake Pad Advisory Explained",
      url: "brake-pad-advisory-explained.html"
    },
    {
      title: "Brake Disc Advisory Explained",
      url: "brake-disc-advisory-explained.html"
    },
    {
      title: "Corroded Brake Pipe Advisory",
      url: "corroded-brake-pipe-advisory.html"
    },
    {
      title: "Warning Lights Guide",
      url: "warning-lights.html"
    }
  ]
});

/* ==========================================================
   37. PRODUCTION SYSTEM RESULT MAP
========================================================== */

const SYSTEM_RESULTS = Object.freeze({
  engine: ENGINE_SYSTEM_RESULT,
  starting: STARTING_SYSTEM_RESULT,
  cooling: COOLING_SYSTEM_RESULT,
  brakes: BRAKE_SYSTEM_RESULT
});

/* ==========================================================
   38. SYSTEM RESULT NORMALISATION
========================================================== */

function cloneResultContent(result) {
  return {
    eyebrow: result.eyebrow,
    title: result.title,
    summary: result.summary,

    urgency: {
      ...result.urgency
    },

    direction: {
      ...result.direction
    },

    driving: {
      ...result.driving
    },

    mot: {
      ...result.mot
    },

    causes: [...result.causes],
    checks: [...result.checks],

    guides: result.guides.map((guide) => ({
      ...guide
    }))
  };
}

function prepareSystemResult(system) {
  const result = SYSTEM_RESULTS[system];

  if (!result) {
    return null;
  }

  const prepared = cloneResultContent(result);

  prepared.guides = uniqueGuides([
    ...prepared.guides,
    {
      title: "Vehicle Diagnostics Hub",
      url: "diagnostics.html"
    }
  ]).slice(0, 6);

  return prepared;
}

/* ==========================================================
   39. REPLACE TEMPORARY SYSTEM RESULTS
========================================================== */

renderPendingSystemResult = function renderProductionSystemResult(
  system
) {
  const result = prepareSystemResult(system);

  if (!result) {
    renderGuideOnlyResult({
      title: "Vehicle Diagnostic Guidance",
      summary:
        "Use the Motor Vehicle Expert diagnostic hub to investigate the selected vehicle system.",
      url: `${MVE_BASE_URL}/diagnostics.html`
    });

    return;
  }

  renderResult(result);
};

/* ==========================================================
   40. ROUTE-SPECIFIC SAFETY OVERRIDES
========================================================== */

function applySystemSafetyOverride(system, result) {
  if (!result) {
    return result;
  }

  const safeResult = cloneResultContent(result);

  if (system === "cooling") {
    safeResult.checks.unshift(
      "Do not open a hot cooling system or continue driving while the engine is overheating."
    );
  }

  if (system === "brakes") {
    safeResult.checks.unshift(
      "Do not road-test the vehicle when the brake pedal or stopping performance is unsafe."
    );
  }

  if (system === "starting") {
    safeResult.checks.unshift(
      "Keep clear of moving belts and electrical short-circuit risks during testing."
    );
  }

  if (system === "engine") {
    safeResult.checks.unshift(
      "Stop diagnosis and switch off the engine if severe knocking, smoke, overheating or a flashing engine warning appears."
    );
  }

  safeResult.checks = uniqueStrings(
    safeResult.checks
  ).slice(0, 8);

  return safeResult;
}

function prepareSafeSystemResult(system) {
  const baseResult = SYSTEM_RESULTS[system];

  if (!baseResult) {
    return null;
  }

  const result = applySystemSafetyOverride(
    system,
    baseResult
  );

  result.guides = uniqueGuides([
    ...result.guides,
    {
      title: "Vehicle Diagnostics Hub",
      url: "diagnostics.html"
    }
  ]).slice(0, 6);

  return result;
}

renderPendingSystemResult = function renderSafeProductionSystemResult(
  system
) {
  const result = prepareSafeSystemResult(system);

  if (!result) {
    renderGuideOnlyResult({
      title: "Vehicle Diagnostic Guidance",
      summary:
        "This category is supported through the live Motor Vehicle Expert diagnostic guides.",
      url: `${MVE_BASE_URL}/diagnostics.html`
    });

    return;
  }

  renderResult(result);
};

/* ==========================================================
   41. LIVE-LINK FALLBACK HANDLING
========================================================== */

function handleGuideLinkError(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }

  anchor.addEventListener("error", () => {
    anchor.href = `${MVE_BASE_URL}/diagnostics.html`;
  });
}

function prepareRenderedGuideLinks() {
  if (!dom.resultGuideLinks) {
    return;
  }

  const links = dom.resultGuideLinks.querySelectorAll(
    "a.result-guide-link"
  );

  links.forEach(handleGuideLinkError);
}

/* ==========================================================
   42. ENHANCE RESULT RENDERING
========================================================== */

const validatedRenderResult = renderResult;

renderResult = function renderEnhancedResult(result) {
  validatedRenderResult(result);
  prepareRenderedGuideLinks();
};

/* ==========================================================
   43. KEYBOARD ESCAPE SUPPORT
========================================================== */

function handleEscapeKey(event) {
  if (event.key !== "Escape") {
    return;
  }

  const checkerOpen =
    !dom.symptomChecker?.hidden ||
    !dom.warningChecker?.hidden;

  if (checkerOpen) {
    closeChecker();
  }
}

document.addEventListener(
  "keydown",
  handleEscapeKey
);

/* ==========================================================
   44. HASH-BASED ENTRY ROUTES
========================================================== */

function openRouteFromHash() {
  const hash = window.location.hash.toLowerCase();

  if (hash === "#clutch-checker") {
    openClutchChecker();
    return;
  }

  if (hash === "#warning-light-checker") {
    openRoute("warning-light");
    return;
  }

  if (hash === "#symptom-checker") {
    openRoute("symptom");
  }
}

window.addEventListener("load", openRouteFromHash);

/* ==========================================================
   45. FINAL PRODUCTION CONFIGURATION
========================================================== */

const APP_CONFIG = Object.freeze({
  name: "AutoKnowledge Pro",
  version: "1.0.0",
  storageKey: "autoknowledge-pro-last-result",
  maxStoredGuides: 6,
  resultScrollOffset: 18
});

let applicationInitialised = false;

/* ==========================================================
   46. SAFE SESSION STORAGE
========================================================== */

function canUseSessionStorage() {
  try {
    const testKey = "__akp_storage_test__";

    window.sessionStorage.setItem(testKey, "1");
    window.sessionStorage.removeItem(testKey);

    return true;
  } catch (error) {
    return false;
  }
}

function createStoredResult(result) {
  if (!result || typeof result !== "object") {
    return null;
  }

  return {
    savedAt: new Date().toISOString(),
    appVersion: APP_CONFIG.version,

    result: {
      eyebrow: result.eyebrow,
      title: result.title,
      summary: result.summary,

      urgency: {
        level: result.urgency?.level,
        label: result.urgency?.label
      },

      direction: {
        title: result.direction?.title,
        copy: result.direction?.copy
      },

      driving: {
        title: result.driving?.title,
        copy: result.driving?.copy
      },

      mot: {
        title: result.mot?.title,
        copy: result.mot?.copy
      },

      causes: Array.isArray(result.causes)
        ? [...result.causes]
        : [],

      checks: Array.isArray(result.checks)
        ? [...result.checks]
        : [],

      guides: Array.isArray(result.guides)
        ? result.guides
            .slice(0, APP_CONFIG.maxStoredGuides)
            .map((guide) => ({
              title: guide.title,
              url: guide.url
            }))
        : []
    }
  };
}

function saveResultToSession(result) {
  if (!canUseSessionStorage()) {
    return;
  }

  const stored = createStoredResult(result);

  if (!stored) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      APP_CONFIG.storageKey,
      JSON.stringify(stored)
    );
  } catch (error) {
    console.warn(
      "AutoKnowledge Pro could not save the current result:",
      error
    );
  }
}

function readResultFromSession() {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(
      APP_CONFIG.storageKey
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      parsed.appVersion !== APP_CONFIG.version ||
      !validateResultStructure(parsed.result)
    ) {
      return null;
    }

    return parsed.result;
  } catch (error) {
    console.warn(
      "AutoKnowledge Pro could not restore the previous result:",
      error
    );

    return null;
  }
}

function clearStoredResult() {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      APP_CONFIG.storageKey
    );
  } catch (error) {
    console.warn(
      "AutoKnowledge Pro could not clear the stored result:",
      error
    );
  }
}

/* ==========================================================
   47. PROGRESS RESET
========================================================== */

function resetProgress() {
  state.currentStep = CHECKER_STEPS.SYSTEM;

  setText(
    dom.progressStatus,
    `Step 1 of ${CHECKER_STEP_COUNT}`
  );

  if (dom.progressFill) {
    dom.progressFill.style.width =
      `${100 / CHECKER_STEP_COUNT}%`;
  }

  if (dom.progressBar) {
    dom.progressBar.setAttribute(
      "aria-valuenow",
      String(CHECKER_STEPS.SYSTEM)
    );
  }
}

/* ==========================================================
   48. RESULT DOCUMENT TITLE
========================================================== */

function updateDocumentTitleForResult(result) {
  if (!result?.title) {
    return;
  }

  document.title =
    `${result.title} | ${APP_CONFIG.name}`;
}

function restoreDefaultDocumentTitle() {
  document.title =
    "AutoKnowledge Pro | Free UK Vehicle Diagnostic Assistant";
}

/* ==========================================================
   49. EXTERNAL LINK SAFETY
========================================================== */

function secureExternalLink(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }

  let url;

  try {
    url = new URL(anchor.href, window.location.href);
  } catch (error) {
    anchor.href = `${MVE_BASE_URL}/diagnostics.html`;
    return;
  }

  const allowedHosts = new Set([
    "motorvehicleexpert.co.uk",
    "www.motorvehicleexpert.co.uk",
    "bavusanidube-prog.github.io"
  ]);

  if (!allowedHosts.has(url.hostname)) {
    anchor.href = `${MVE_BASE_URL}/diagnostics.html`;
  }

  if (
    url.hostname !== window.location.hostname
  ) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
}

function secureRenderedGuideLinks() {
  if (!dom.resultGuideLinks) {
    return;
  }

  dom.resultGuideLinks
    .querySelectorAll("a.result-guide-link")
    .forEach(secureExternalLink);
}

/* ==========================================================
   50. FINAL RESULT RENDERING WRAPPER
========================================================== */

const enhancedResultRenderer = renderResult;

renderResult = function renderFinalProductionResult(
  result,
  options = {}
) {
  enhancedResultRenderer(result);

  const actualResult =
    state.lastResult || result;

  secureRenderedGuideLinks();
  updateDocumentTitleForResult(actualResult);

  if (options.persist !== false) {
    saveResultToSession(actualResult);
  }
};

/* ==========================================================
   51. RESULT RESTORATION
========================================================== */

function restorePreviousResultFromSession() {
  const storedResult = readResultFromSession();

  if (!storedResult) {
    return false;
  }

  renderResult(storedResult, {
    persist: false
  });

  return true;
}

/* ==========================================================
   52. COMPLETE RESET
========================================================== */

const previousResetApplication = resetApplication;

resetApplication = function resetProductionApplication() {
  previousResetApplication();

  resetProgress();
  clearStoredResult();
  restoreDefaultDocumentTitle();

  state.activeRoute = null;
  state.activeSystem = null;
  state.lastResult = null;
};

/* ==========================================================
   53. CLOSE CHECKER WITHOUT LOSING RESULT
========================================================== */

const previousCloseChecker = closeChecker;

closeChecker = function closeProductionChecker() {
  previousCloseChecker();
  resetProgress();
};

/* ==========================================================
   54. OPEN ROUTE STATE CLEANUP
========================================================== */

const previousOpenRoute = openRoute;

openRoute = function openProductionRoute(routeName) {
  resetValidationMessages();
  resetProgress();

  previousOpenRoute(routeName);
};

/* ==========================================================
   55. OPEN CLUTCH CHECKER STATE CLEANUP
========================================================== */

const previousOpenClutchChecker = openClutchChecker;

openClutchChecker = function openProductionClutchChecker() {
  clearStoredResult();
  restoreDefaultDocumentTitle();
  previousOpenClutchChecker();
};

/* ==========================================================
   56. PRINT PREPARATION
========================================================== */

function buildPrintTitle(result) {
  const resultTitle =
    result?.title || "Vehicle Diagnostic Guidance";

  return `${resultTitle} — ${APP_CONFIG.name}`;
}

function preparePrintDocument() {
  if (!state.lastResult) {
    return;
  }

  document.title = buildPrintTitle(
    state.lastResult
  );

  document.documentElement.dataset.printing =
    "true";
}

function restoreAfterPrint() {
  document.documentElement.removeAttribute(
    "data-printing"
  );

  if (state.lastResult) {
    updateDocumentTitleForResult(
      state.lastResult
    );
  } else {
    restoreDefaultDocumentTitle();
  }
}

printCurrentResult = function printProductionResult() {
  if (
    !state.lastResult ||
    dom.resultSection?.hidden
  ) {
    return;
  }

  preparePrintDocument();
  window.print();
};

window.addEventListener(
  "afterprint",
  restoreAfterPrint
);

/* ==========================================================
   57. REQUIRED DOM VALIDATION
========================================================== */

const REQUIRED_ELEMENT_IDS = Object.freeze([
  "symptom-checker",
  "warning-light-checker",
  "system-continue",
  "clutch-symptom-continue",
  "clutch-conditions-continue",
  "generate-clutch-result",
  "generate-warning-result",
  "diagnostic-result",
  "result-title",
  "result-summary",
  "result-causes",
  "result-checks",
  "result-guide-links",
  "print-result",
  "start-new-check"
]);

function findMissingRequiredElements() {
  return REQUIRED_ELEMENT_IDS.filter(
    (id) => !document.getElementById(id)
  );
}

function validateApplicationMarkup() {
  const missing =
    findMissingRequiredElements();

  if (missing.length === 0) {
    return true;
  }

  console.error(
    "AutoKnowledge Pro is missing required HTML elements:",
    missing
  );

  return false;
}

/* ==========================================================
   58. EVENT BINDING GUARD
========================================================== */

function addEventOnce(
  element,
  eventName,
  handler,
  bindingName
) {
  if (!element) {
    return;
  }

  const key =
    `akpBound${bindingName}`;

  if (element.dataset[key] === "true") {
    return;
  }

  element.addEventListener(
    eventName,
    handler
  );

  element.dataset[key] = "true";
}

/* ==========================================================
   59. FINAL EVENT RECONCILIATION
========================================================== */

function reconcileProductionEvents() {
  addEventOnce(
    dom.generateClutchResult,
    "click",
    generateClutchDiagnosticResult,
    "ClutchResult"
  );

  addEventOnce(
    dom.generateWarningResult,
    "click",
    generateWarningLightResult,
    "WarningResult"
  );

  addEventOnce(
    dom.printResult,
    "click",
    printCurrentResult,
    "PrintResult"
  );

  addEventOnce(
    dom.startNewCheck,
    "click",
    resetApplication,
    "NewCheck"
  );
}

/* ==========================================================
   60. INPUT STATE SYNCHRONISATION
========================================================== */

function synchroniseCurrentInputState() {
  state.activeSystem =
    getCheckedValue(dom.systemRadios);

  state.clutch.symptom =
    getCheckedValue(
      dom.clutchSymptomRadios
    );

  state.clutch.conditions =
    getCheckedValues(
      dom.clutchConditionCheckboxes
    );

  state.warningLight =
    getCheckedValue(
      dom.warningLightRadios
    );

  readClutchSafetyAnswers();

  setButtonDisabled(
    dom.systemContinue,
    !state.activeSystem
  );

  setButtonDisabled(
    dom.clutchSymptomContinue,
    !state.clutch.symptom
  );

  setButtonDisabled(
    dom.generateWarningResult,
    !state.warningLight
  );
}

/* ==========================================================
   61. PAGE VISIBILITY RECOVERY
========================================================== */

function handlePageRestore(event) {
  if (!event.persisted) {
    return;
  }

  synchroniseCurrentInputState();

  if (state.lastResult) {
    secureRenderedGuideLinks();
  }
}

window.addEventListener(
  "pageshow",
  handlePageRestore
);

/* ==========================================================
   62. HASH ROUTE CORRECTION
========================================================== */

function normaliseHashRoute() {
  const hash =
    window.location.hash.toLowerCase();

  const supportedHashes = new Set([
    "",
    "#start-check",
    "#symptom-checker",
    "#warning-light-checker",
    "#clutch-checker",
    "#how-it-works",
    "#safety",
    "#limitations",
    "#resources"
  ]);

  if (!supportedHashes.has(hash)) {
    return;
  }

  if (hash === "#clutch-checker") {
    openClutchChecker();
    return;
  }

  if (hash === "#warning-light-checker") {
    openRoute("warning-light");
    return;
  }

  if (hash === "#symptom-checker") {
    openRoute("symptom");
  }
}

window.addEventListener(
  "hashchange",
  normaliseHashRoute
);

/* ==========================================================
   63. FINAL APPLICATION INITIALISATION
========================================================== */

function initialiseProductionApplication() {
  if (applicationInitialised) {
    return;
  }

  applicationInitialised = true;

  if (!validateApplicationMarkup()) {
    renderApplicationError();
    return;
  }

  resetSymptomState();
  resetWarningState();
  resetProgress();

  hideAllCheckers();
  hideResult();

  bindEvents();
  reconcileProductionEvents();
  synchroniseCurrentInputState();

  const restored =
    restorePreviousResultFromSession();

  if (!restored) {
    normaliseHashRoute();
  }
}

/* ==========================================================
   64. REPLACE EARLIER INITIALISATION
========================================================== */

document.removeEventListener(
  "DOMContentLoaded",
  initialiseApplication
);

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialiseProductionApplication,
    {
      once: true
    }
  );
} else {
  initialiseProductionApplication();
}

/* ==========================================================
   65. PUBLIC APP INFORMATION
========================================================== */

window.AutoKnowledgePro = Object.freeze({
  name: APP_CONFIG.name,
  version: APP_CONFIG.version,

  startSymptomCheck() {
    openRoute("symptom");
  },

  startClutchCheck() {
    openClutchChecker();
  },

  startWarningLightCheck() {
    openRoute("warning-light");
  },

  reset() {
    resetApplication();
  }
});

/* ==========================================================
   END OF AUTOKNOWLEDGE PRO PRODUCTION APPLICATION
========================================================== */
