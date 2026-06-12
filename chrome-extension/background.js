const CONFIG = {
  rewriteURL: "https://tonelayer-server-production.up.railway.app/rewrite"
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TONELAYER_REWRITE") {
    return false;
  }

  rewrite(message.payload)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: formatError(error) }));

  return true;
});

async function rewrite(payload) {
  const text = String(payload?.text || "").trim();
  if (!text) {
    throw new Error("No text found. Select or type text first.");
  }

  const { appToken = "" } = await chrome.storage.sync.get({ appToken: "" });
  if (!appToken.trim()) {
    throw new Error("Add the ToneLayer app token in extension options first.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(CONFIG.rewriteURL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-app-token": appToken.trim()
      },
      body: JSON.stringify({
        text,
        profile: payload.profile || "General ND",
        level: payload.level || "Medium",
        mode: "tonelayer"
      })
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

    const rewriteText = Array.isArray(json.paragraphs) && json.paragraphs.length
      ? json.paragraphs.join("\n\n")
      : String(json.rewrite || "");

    if (!rewriteText.trim()) {
      throw new Error("No rewrite returned.");
    }

    return {
      rewrite: rewriteText,
      grammarOnly: String(json.grammar_only || ""),
      explanation: String(json.explanation || ""),
      distortions: Array.isArray(json.distortions) ? json.distortions : []
    };
  } finally {
    clearTimeout(timeout);
  }
}

function formatError(error) {
  if (error?.name === "AbortError") {
    return "The rewrite took too long. Try a shorter selection.";
  }
  return error?.message || "ToneLayer could not rewrite that text.";
}
