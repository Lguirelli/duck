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
      event.stopPropagation();

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

    function applyVisibility() {
      section.hidden = !toggle.checked;
      section.classList.toggle("is-section-hidden", !toggle.checked);
    }

    toggle.addEventListener("change", applyVisibility);
    applyVisibility();
  });
}

function initColorControls() {
  const colorInputs = document.querySelectorAll("[data-color-var]");

  colorInputs.forEach((input) => {
    input.dataset.defaultValue = input.value;

    input.addEventListener("input", () => {
      const cssVar = input.dataset.colorVar;
      document.body.style.setProperty(cssVar, input.value);

      if (cssVar === "--accent") {
        document.body.style.setProperty("--accent-2", input.value);
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

  const switchTrack = document.querySelector(".theme-switch-track");
  if (switchTrack) {
    let isDragging = false;

    const updateFromPointer = (event) => {
      const rect = switchTrack.getBoundingClientRect();
      const clientX = event.touches?.[0]?.clientX ?? event.clientX;
      toggle.checked = clientX > rect.left + rect.width / 2;
      applyTheme();
    };

    switchTrack.addEventListener("pointerdown", (event) => {
      isDragging = true;
      switchTrack.setPointerCapture(event.pointerId);
      updateFromPointer(event);
    });

    switchTrack.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      updateFromPointer(event);
    });

    switchTrack.addEventListener("pointerup", () => {
      isDragging = false;
    });

    switchTrack.addEventListener("pointercancel", () => {
      isDragging = false;
    });
  }

  applyTheme();
}

function initResetButton() {
  const resetButton = document.querySelector("[data-reset-editor]");

  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    document.body.removeAttribute("style");
    document.body.dataset.theme = "dark";

    document.querySelectorAll("[data-color-var]").forEach((input) => {
      input.value = input.dataset.defaultValue || input.getAttribute("value") || input.value;
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

function initStaticButtons() {
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
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
  initStaticButtons();
}

document.addEventListener("DOMContentLoaded", initEditableLandingPage);
