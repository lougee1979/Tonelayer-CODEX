/*
 * Copyright (c) 2026 Alden Lougee. All rights reserved.
 * ToneLayer(TM) and the ToneLayer butterfly mark are trademarks of Alden Lougee.
 * Unauthorized copying, modification, distribution, or derivative use is prohibited.
 */

const CONFIG = {
  rewriteURL: "https://tonelayer-server-production.up.railway.app/rewrite",
  decodeURL: "https://tonelayer-server-production.up.railway.app/decode"
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "TONELAYER_REWRITE") {
    rewrite(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: formatError(error) }));
    return true;
  }

  if (message?.type === "TONELAYER_DECODE") {
    decode(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: formatError(error) }));
    return true;
  }

  return false;
});

async function rewrite(payload) {
  const text = String(payload?.text || "").trim();
  if (!text) {
    throw new Error("No text found. Select or type text first.");
  }

  const json = await postJSON(CONFIG.rewriteURL, {
    text,
    profile: payload.profile || "General ND",
    level: payload.level || "Medium",
    mode: payload.direction === "nt_to_nd" ? "nt_to_nd" : "tonelayer",
    direction: payload.direction || "nd_to_nt"
  });

  const rewriteText = Array.isArray(json.paragraphs) && json.paragraphs.length
    ? json.paragraphs.join("\n\n")
    : String(json.rewrite || json.translation || "");

  if (!rewriteText.trim()) {
    throw new Error("No translation returned.");
  }

  return {
    kind: payload.direction === "nt_to_nd" ? "ntnd" : "rewrite",
    text: rewriteText,
    grammarOnly: String(json.grammar_only || ""),
    explanation: String(json.explanation || json.note || ""),
    distortions: Array.isArray(json.distortions) ? json.distortions : []
  };
}

async function decode(payload) {
  const text = String(payload?.text || "").trim();
  if (!text) {
    throw new Error("No text found. Select or type text first.");
  }

  const json = await postJSON(CONFIG.decodeURL, {
    text,
    contact: String(payload?.contact || "Unknown").trim() || "Unknown",
    sensitivity: payload?.sensitivity || "Medium",
    history: []
  });

  const translation = String(json.translation || json.summary || json.analysis || "").trim();
  if (!translation) {
    throw new Error("No decoder result returned.");
  }

  return {
    kind: "decode",
    text: translation,
    patterns: Array.isArray(json.flags) ? json.flags : (Array.isArray(json.patterns) ? json.patterns : []),
    communicationStyle: String(json.communication_style || ""),
    baseline: String(json.baseline_note || json.baseline || json.note || ""),
    tentative: json.is_definitive === false
  };
}

async function postJSON(url, body) {
  const { appToken = "" } = await chrome.storage.sync.get({ appToken: "" });
  if (!appToken.trim()) {
    throw new Error("Subscribe or sign in, then add your ToneLayer access token in extension options.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-app-token": appToken.trim()
      },
      body: JSON.stringify(body)
    });

    const rawText = await response.text();
    let json = {};
    try {
      json = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new Error("Unexpected server response.");
    }

    if (!response.ok) {
      throw new Error(json.error || `Server error (${response.status})`);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function formatError(error) {
  if (error?.name === "AbortError") {
    return "The request took too long. Try a shorter selection.";
  }
  return error?.message || "ToneLayer could not process that text.";
}
