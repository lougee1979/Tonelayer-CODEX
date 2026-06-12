const els = {
  profile: document.getElementById("profile"),
  input: document.getElementById("input"),
  output: document.getElementById("output"),
  rewrite: document.getElementById("rewrite"),
  copy: document.getElementById("copy"),
  replace: document.getElementById("replace"),
  loadSelection: document.getElementById("loadSelection"),
  resultPanel: document.getElementById("resultPanel"),
  teaching: document.getElementById("teaching"),
  explanation: document.getElementById("explanation"),
  status: document.getElementById("status"),
  levels: [...document.querySelectorAll(".level")]
};

let selectedLevel = "Medium";

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await loadSelection();
});

els.levels.forEach((button) => {
  button.addEventListener("click", async () => {
    selectedLevel = button.dataset.level;
    els.levels.forEach((level) => level.classList.toggle("active", level === button));
    await chrome.storage.sync.set({ level: selectedLevel });
  });
});

els.profile.addEventListener("change", () => {
  chrome.storage.sync.set({ profile: els.profile.value });
});

els.loadSelection.addEventListener("click", loadSelection);
els.rewrite.addEventListener("click", runRewrite);
els.copy.addEventListener("click", copyRewrite);
els.replace.addEventListener("click", replaceSelection);

async function loadSettings() {
  const settings = await chrome.storage.sync.get({ profile: "General ND", level: "Medium" });
  els.profile.value = settings.profile;
  selectedLevel = settings.level;
  els.levels.forEach((button) => {
    button.classList.toggle("active", button.dataset.level === selectedLevel);
  });
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

async function runRewrite() {
  const text = els.input.value.trim();
  if (!text) {
    setStatus("Select or type text first.");
    return;
  }

  setBusy(true);
  setStatus("Rewriting...");

  const response = await chrome.runtime.sendMessage({
    type: "TONELAYER_REWRITE",
    payload: {
      text,
      profile: els.profile.value,
      level: selectedLevel
    }
  });

  setBusy(false);

  if (!response?.ok) {
    setStatus(response?.error || "Rewrite failed.");
    return;
  }

  const result = response.result;
  els.output.value = result.rewrite;
  els.explanation.textContent = result.explanation || "No teaching note returned.";
  els.teaching.classList.toggle("hidden", !result.explanation);
  els.resultPanel.classList.remove("hidden");

  const note = result.distortions?.length
    ? `Rewrite ready. Pause flag: ${result.distortions.join(", ")}.`
    : "Rewrite ready.";
  setStatus(note);
}

async function copyRewrite() {
  const text = els.output.value.trim();
  if (!text) {
    setStatus("No rewrite to copy.");
    return;
  }

  await navigator.clipboard.writeText(text);
  setStatus("Copied.");
}

async function replaceSelection() {
  const text = els.output.value.trim();
  if (!text) {
    setStatus("No rewrite to insert.");
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
  els.rewrite.disabled = isBusy;
  els.loadSelection.disabled = isBusy;
  els.rewrite.textContent = isBusy ? "Rewriting..." : "Rewrite";
}

function setStatus(message) {
  els.status.textContent = message;
}
