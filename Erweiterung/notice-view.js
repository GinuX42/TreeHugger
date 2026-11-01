import {byId, setText} from "./ui-dom.js";

export function createNoticeView() {
  const panel = byId("message");
  const content = byId("messageContent");
  const toggleButton = byId("noticeToggle");
  const closeButton = byId("closeNotices");
  let notices = [];
  let operationMessage = "";
  let operationFailed = false;
  let dismissed = false;

  function render() {
    const messages = [...new Set([operationMessage, ...notices].filter(Boolean))];
    const hasMessages = messages.length > 0;
    const expanded = hasMessages && !dismissed;
    panel.hidden = !expanded;
    panel.classList.toggle("message-error", operationFailed);
    content.setAttribute("role", operationFailed ? "alert" : "status");
    setText(content, messages.join(" "));
    toggleButton.hidden = !hasMessages;
    toggleButton.setAttribute("aria-expanded", String(expanded));
    setText(toggleButton, `Hinweise (${messages.length})`);
  }

  function setNotices(nextNotices) {
    notices = nextNotices.filter(Boolean);
    render();
  }

  function showMessage(message, {error = false} = {}) {
    operationMessage = message;
    operationFailed = error;
    // Neue Aktionsmeldungen müssen auch nach dem Schließen früherer Hinweise sichtbar sein.
    dismissed = false;
    render();
  }

  function clearMessage() {
    operationMessage = "";
    operationFailed = false;
    render();
  }

  closeButton.addEventListener("click", () => {
    dismissed = true;
    render();
    toggleButton.focus();
  });
  toggleButton.addEventListener("click", () => {
    dismissed = !dismissed;
    render();
  });
  render();

  return {setNotices, showMessage, clearMessage};
}
