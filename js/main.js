function initSmoothScroll() {
  if (window.__smoothScrollInitialized) return;
  window.__smoothScrollInitialized = true;

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function initEditableText() {
  const editableItems = document.querySelectorAll(".editable-text");

  editableItems.forEach((item) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("title", "Dê dois cliques para editar");

    item.addEventListener("dblclick", (event) => {
      event.preventDefault();
      item.setAttribute("contenteditable", "true");
      item.classList.add("is-editing");
      item.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(item);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || (event.key === "Enter" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        item.blur();
      }
    });

    item.addEventListener("blur", () => {
      item.removeAttribute("contenteditable");
      item.classList.remove("is-editing");
    });
  });
}

function initSectionControls() {
  const toggles = document.querySelectorAll("[data-section-toggle]");

  toggles.forEach((toggle) => {
    const sectionName = toggle.dataset.sectionToggle;
    const section = document.querySelector(`[data-editable-section="${sectionName}"]`);

    if (!section) return;

    toggle.addEventListener("change", () => {
      section.hidden = !toggle.checked;
      section.classList.toggle("is-section-hidden", !toggle.checked);
    });
  });
}

function initColorControls() {
  const colorInputs = document.querySelectorAll("[data-color-var]");

  colorInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const cssVar = input.dataset.colorVar;
      document.documentElement.style.setProperty(cssVar, input.value);

      if (cssVar === "--accent") {
        document.documentElement.style.setProperty("--accent-2", input.value);
      }
    });
  });
}

function initThemeToggle() {
  const toggle = document.querySelector("#themeToggle");
  const label = document.querySelector("[data-theme-label]");

  if (!toggle) return;

  function applyTheme() {
    const theme = toggle.checked ? "light" : "dark";
    document.body.dataset.theme = theme;
    if (label) label.textContent = theme === "light" ? "Claro" : "Escuro";
  }

  toggle.addEventListener("change", applyTheme);
  applyTheme();
}

function initResetButton() {
  const resetButton = document.querySelector("[data-reset-editor]");

  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    document.documentElement.removeAttribute("style");
    document.body.dataset.theme = "dark";

    document.querySelectorAll("[data-color-var]").forEach((input) => {
      const initialValue = input.getAttribute("value");
      if (initialValue) input.value = initialValue;
    });

    const themeToggle = document.querySelector("#themeToggle");
    const themeLabel = document.querySelector("[data-theme-label]");
    if (themeToggle) themeToggle.checked = false;
    if (themeLabel) themeLabel.textContent = "Escuro";

    document.querySelectorAll("[data-section-toggle]").forEach((toggle) => {
      toggle.checked = true;
      const section = document.querySelector(`[data-editable-section="${toggle.dataset.sectionToggle}"]`);
      if (section) {
        section.hidden = false;
        section.classList.remove("is-section-hidden");
      }
    });
  });
}

function initEditableLandingPage() {
  initSmoothScroll();
  initEditableText();
  initSectionControls();
  initColorControls();
  initThemeToggle();
  initResetButton();
}

document.addEventListener("DOMContentLoaded", initEditableLandingPage);
