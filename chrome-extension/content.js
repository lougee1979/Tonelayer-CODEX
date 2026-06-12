chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "TONELAYER_GET_SELECTION") {
    sendResponse({ text: getSelectedText() });
    return false;
  }

  if (message?.type === "TONELAYER_REPLACE_SELECTION") {
    const ok = replaceSelectedText(String(message.text || ""));
    sendResponse({ ok });
    return false;
  }

  return false;
});

function getSelectedText() {
  const active = document.activeElement;
  if (isTextInput(active)) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    if (end > start) {
      return active.value.slice(start, end);
    }
  }

  const selection = window.getSelection();
  return selection ? selection.toString() : "";
}

function replaceSelectedText(text) {
  const active = document.activeElement;

  if (isTextInput(active)) {
    const start = active.selectionStart ?? active.value.length;
    const end = active.selectionEnd ?? active.value.length;
    const before = active.value.slice(0, start);
    const after = active.value.slice(end);
    active.value = `${before}${text}${after}`;
    const cursor = start + text.length;
    active.selectionStart = cursor;
    active.selectionEnd = cursor;
    active.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  selection.removeAllRanges();
  return true;
}

function isTextInput(element) {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (!(element instanceof HTMLInputElement)) return false;
  return ["", "text", "search", "email", "url", "tel", "password"].includes(element.type);
}
