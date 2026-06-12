const appToken = document.getElementById("appToken");
const save = document.getElementById("save");
const status = document.getElementById("status");

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await chrome.storage.sync.get({ appToken: "" });
  appToken.value = settings.appToken;
});

save.addEventListener("click", async () => {
  await chrome.storage.sync.set({ appToken: appToken.value.trim() });
  status.textContent = "Saved.";
});
