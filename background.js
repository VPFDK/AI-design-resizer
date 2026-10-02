// Open het zijpaneel automatisch wanneer de gebruiker op het extensie-icoon klikt
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});