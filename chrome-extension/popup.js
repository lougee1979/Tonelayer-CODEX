/*
 * Copyright (c) 2026 Alden Lougee. All rights reserved.
 * ToneLayer(TM) and the ToneLayer butterfly mark are trademarks of Alden Lougee.
 * Unauthorized copying, modification, distribution, or derivative use is prohibited.
 */

const els = {
  profile: document.getElementById("profile"),
  contact: document.getElementById("contact"),
  profileControl: document.getElementById("profileControl"),
  contactControl: document.getElementById("contactControl"),
  levelGroup: document.getElementById("levelGroup"),
  sensitivityGroup: document.getElementById("sensitivityGroup"),
  modeSubtitle: document.getElementById("modeSubtitle"),
  inputLabel: document.getElementById("inputLabel"),
  outputLabel: document.getElementById("outputLabel"),
  input: document.getElementById("input"),
  output: document.getElementById("output"),
  run: document.getElementById("run"),
  copy: document.getElementById("copy"),
  replace: document.getElementById("replace"),
  loadSelection: document.getElementById("loadSelection"),
  resultPanel: document.getElementById("resultPanel"),
  teaching: document.getElementById("teaching"),
  teachingTitle: document.getElementById("teachingTitle"),
  explanation: document.getElementById("explanation"),
  metaPanel: document.getElementById("metaPanel"),
  status: document.getElementById("status"),
  levels: [...document.querySelectorAll(".level")],
  sensitivities: [...document.querySelectorAll(".sensitivity")],
  modeTabs: [...document.querySelectorAll(".mode-tab")]
};

const MODE_COPY = {
  rewrite: {
    subtitle: "ND to NT",
    inputLabel: "Original",
    outputLabel: "Rewrite",
    action: "Rewrite",
    busy: "Rewriting...",
    placeholder: "Select text on a page, then open ToneLayer."
  },
  decode: {
    subtitle: "Pattern Decoder",
    inputLabel: "Message to decode",
    outputLabel: "What it may mean",
    action: "Decode patterns",
    busy: "Decoding...",
    placeholder: "Paste a message you received, or select it on a page."
  },
  ntnd: {
    subtitle: "NT to ND",
    inputLabel: "NT version",
    outputLabel: "ND-readable version",
    action: "Translate to ND",
    busy: "Translating...",
    placeholder: "Paste polished NT wording to make it more direct, explicit, and ND-readable."
  }
};

let selectedLevel = "Medium";
let selectedSensitivity = "Medium";
let currentMode = "rewrite";

window.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  applyMode(currentMode);
  await loadSelection();
});

els.modeTabs.forEach((button) => {
  button.addEventListener("click", async () => {
    currentMode = button.dataset.mode;
    await chrome.storage.sync.set({ mode: currentMode });
    applyMode(currentMode);
  });
});

els.levels.forEach((button) => {
  button.addEventListener("click", async () => {
    selectedLevel = button.dataset.level;
    els.levels.forEach((level) => level.classList.toggle("active", level === button));
    await chrome.storage.sync.set({ level: selectedLevel });
  });
});

els.sensitivities.forEach((button) => {
  button.addEventListener("click", async () => {
    selectedSensitivity = button.dataset.sensitivity;
    els.sensitivities.forEach((item) => item.classList.toggle("active", item === button));
    await chrome.storage.sync.set({ sensitivity: selectedSensitivity });
  });
});

els.profile.addEventListener("change", () => {
  chrome.storage.sync.set({ profile: els.profile.value });
});

els.contact.addEventListener("change", () => {
  chrome.storage.sync.set({ contact: els.contact.value });
});

els.loadSelection.addEventListener("click", loadSelection);
els.run.addEventListener("click", runCurrentMode);
els.copy.addEventListener("click", copyOutput);
els.replace.addEventListener("click", replaceSelection);

async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    profile: "General ND",
    level: "Medium",
    sensitivity: "Medium",
    mode: "rewrite",
    contact: ""
  });
  els.profile.value = settings.profile;
  els.contact.value = settings.contact;
  selectedLevel = settings.level;
  selectedSensitivity = settings.sensitivity;
  currentMode = ["rewrite", "decode", "ntnd"].includes(settings.mode) ? settings.mode : "rewrite";
  els.levels.forEach((button) => button.classList.toggle("active", button.dataset.level === selectedLevel));
  els.sensitivities.forEach((button) => button.classList.toggle("active", button.dataset.sensitivity === selectedSensitivity));
}

function applyMode(mode) {
  const copy = MODE_COPY[mode];
  els.modeTabs.forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  els.modeSubtitle.textContent = copy.subtitle;
  els.inputLabel.textContent = copy.inputLabel;
  els.outputLabel.textContent = copy.outputLabel;
  els.input.placeholder = copy.placeholder;
  els.run.textContent = copy.action;
  els.profileControl.classList.toggle("hidden", mode === "decode");
  els.contactControl.classList.toggle("hidden", mode !== "decode");
  els.levelGroup.classList.toggle("hidden", mode === "decode");
  els.sensitivityGroup.classList.toggle("hidden", mode !== "decode");
  els.replace.classList.toggle("hidden", mode === "decode");
  els.resultPanel.classList.add("hidden");
  els.metaPanel.classList.add("hidden");
  els.teaching.classList.add("hidden");
  setStatus("");
}

async function loadSelection() {
  setStatus("Loading selection...");
  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("No active tab found.");
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "TONELAYER_GET_SELECTION" });
    if (response?.text?.trim()) {
      els.input.value = response.text.trim();
      setStatus("Selection loaded.");
    } else {
      setStatus("No selected text found.");
    }
  } catch {
    setStatus("Reload this page, select text, then try again.");
  }
}

async function runCurrentMode() {
  const text = els.input.value.trim();
  if (!text) {
    setStatus("Select or type text first.");
    return;
  }

  setBusy(true);
  setStatus(MODE_COPY[currentMode].busy);

  const response = currentMode === "decode"
    ? await chrome.runtime.sendMessage({
        type: "TONELAYER_DECODE",
        payload: {
          text,
          contact: els.contact.value,
          sensitivity: selectedSensitivity
        }
      })
    : await chrome.runtime.sendMessage({
        type: "TONELAYER_REWRITE",
        payload: {
          text,
          profile: els.profile.value,
          level: selectedLevel,
          direction: currentMode === "ntnd" ? "nt_to_nd" : "nd_to_nt"
        }
      });

  setBusy(false);

  if (!response?.ok) {
    setStatus(response?.error || "ToneLayer failed.");
    return;
  }

  renderResult(response.result);
}

function renderResult(result) {
  els.output.value = result.text || "";
  els.resultPanel.classList.remove("hidden");

  if (result.kind === "decode") {
    renderDecoderMeta(result);
    els.teaching.classList.toggle("hidden", !result.baseline);
    els.teachingTitle.textContent = result.tentative ? "Baseline note" : "Context note";
    els.explanation.textContent = result.baseline;
    setStatus(result.patterns?.length ? "Patterns decoded." : "Decoded with no major pattern flags.");
    return;
  }

  els.metaPanel.classList.toggle("hidden", !result.distortions?.length);
  els.metaPanel.innerHTML = result.distortions?.length
    ? `<h2>Pattern flags</h2><div class="chips">${result.distortions.map(escapeHTML).map((flag) => `<span>${flag}</span>`).join("")}</div>`
    : "";
  els.teaching.classList.toggle("hidden", !result.explanation);
  els.teachingTitle.textContent = result.kind === "ntnd" ? "Translation note" : "Why this change";
  els.explanation.textContent = result.explanation || "";
  setStatus(result.kind === "ntnd" ? "NT-to-ND translation ready." : "Rewrite ready.");
}

function renderDecoderMeta(result) {
  const parts = [];
  if (result.patterns?.length) {
    parts.push(`<h2>Pattern flags</h2><div class="chips">${result.patterns.map(escapeHTML).map((flag) => `<span>${flag}</span>`).join("")}</div>`);
  }
  if (result.communicationStyle) {
    parts.push(`<h2>Communication style</h2><p>${escapeHTML(result.communicationStyle)}</p>`);
  }
  els.metaPanel.innerHTML = parts.join("");
  els.metaPanel.classList.toggle("hidden", parts.length === 0);
}

async function copyOutput() {
  const text = els.output.value.trim();
  if (!text) {
    setStatus("No result to copy.");
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus("Copied.");
}

async function replaceSelection() {
  const text = els.output.value.trim();
  if (!text) {
    setStatus("No translation to insert.");
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id) {
    setStatus("No active tab found.");
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "TONELAYER_REPLACE_SELECTION",
      text
    });
    setStatus(response?.ok ? "Selection replaced." : "Could not replace selection. Copy it instead.");
  } catch {
    setStatus("Could not reach the page. Copy it instead.");
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setBusy(isBusy) {
  els.run.disabled = isBusy;
  els.loadSelection.disabled = isBusy;
  els.run.textContent = isBusy ? MODE_COPY[currentMode].busy : MODE_COPY[currentMode].action;
}

function setStatus(message) {
  els.status.textContent = message;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}
