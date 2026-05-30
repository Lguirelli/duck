const STORAGE_KEYS = {
  colors: "landing_editor_colors_v1",
  sections: "landing_editor_sections_v1",
  texts: "landing_editor_texts_v1"
};

const DEFAULT_COLORS = {
  "--bg": "#0b0d12",
  "--text": "#f5f7fb",
  "--muted": "#b8c3d6",
  "--primary": "#ffd84d",
  "--accent": "#64f4d0",
  "--surface": "#151923"
};

const PRESETS = {
  "dark-yellow": {
    "--bg": "#0b0d12",
    "--text": "#f5f7fb",
    "--muted": "#b8c3d6",
    "--primary": "#ffd84d",
    "--accent": "#64f4d0",
    "--surface": "#151923"
  },
  "blue-cyan": {
    "--bg": "#07111f",
    "--text": "#f4f8ff",
    "--muted": "#a9bed8",
    "--primary": "#3ea7ff",
    "--accent": "#37f5d1",
    "--surface": "#101b2d"
  },
  "light-clean": {
    "--bg": "#f4f1ea",
    "--text": "#141414",
    "--muted": "#5f6673",
    "--primary": "#ffbf2f",
    "--accent": "#225cff",
    "--surface": "#ffffff"
  },
  "purple-pink": {
    "--bg": "#130b22",
    "--text": "#fff7ff",
    "--muted": "#d4c1e8",
    "--primary": "#b46cff",
    "--accent": "#ff4fb8",
    "--surface": "#20142f"
  }
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function applyColors(colors) {
  Object.entries(colors).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
    const input = document.querySelector(`[data-color="${property}"]`);
    if (input) input.value = value;
  });
}

function initColorEditor() {
  const savedColors = readStorage(STORAGE_KEYS.colors, DEFAULT_COLORS);
  applyColors({ ...DEFAULT_COLORS, ...savedColors });

  document.querySelectorAll("[data-color]").forEach((input) => {
    input.addEventListener("input", () => {
      const colors = readStorage(STORAGE_KEYS.colors, DEFAULT_COLORS);
      colors[input.dataset.color] = input.value;
      writeStorage(STORAGE_KEYS.colors, colors);
      applyColors(colors);
    });
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = PRESETS[button.dataset.preset];
      if (!preset) return;
      writeStorage(STORAGE_KEYS.colors, preset);
      applyColors(preset);
    });
  });
}

function initSectionToggles() {
  const savedState = readStorage(STORAGE_KEYS.sections, {});

  document.querySelectorAll("[data-toggle-section]").forEach((checkbox) => {
    const sectionId = checkbox.dataset.toggleSection;
    const section = document.querySelector(`[data-section-id="${sectionId}"]`);

    if (!section) return;

    if (typeof savedState[sectionId] === "boolean") {
      checkbox.checked = savedState[sectionId];
    }

    section.setAttribute("hidden-section", checkbox.checked ? "false" : "true");

    checkbox.addEventListener("change", () => {
      const currentState = readStorage(STORAGE_KEYS.sections, {});
      currentState[sectionId] = checkbox.checked;
      writeStorage(STORAGE_KEYS.sections, currentState);
      section.setAttribute("hidden-section", checkbox.checked ? "false" : "true");
    });
  });
}

function saveEditableText(element) {
  const key = element.dataset.editable;
  const texts = readStorage(STORAGE_KEYS.texts, {});
  texts[key] = element.innerHTML;
  writeStorage(STORAGE_KEYS.texts, texts);
}

function enableEditing(element) {
  element.setAttribute("contenteditable", "true");
  element.focus();

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function disableEditing(element) {
  element.removeAttribute("contenteditable");
  saveEditableText(element);
}

function initTextEditor() {
  const savedTexts = readStorage(STORAGE_KEYS.texts, {});

  document.querySelectorAll("[data-editable]").forEach((element) => {
    const key = element.dataset.editable;

    if (savedTexts[key]) {
      element.innerHTML = savedTexts[key];
    }

    element.title = "Dê dois cliques para editar";

    element.addEventListener("dblclick", (event) => {
      event.preventDefault();
      enableEditing(element);
    });

    element.addEventListener("blur", () => {
      if (element.isContentEditable) disableEditing(element);
    });

    element.addEventListener("keydown", (event) => {
      if (!element.isContentEditable) return;

      if (event.key === "Escape") {
        element.blur();
      }

      if (event.key === "Enter" && !event.shiftKey && !["P", "DIV", "SECTION", "ARTICLE"].includes(element.tagName)) {
        event.preventDefault();
        element.blur();
      }
    });
  });
}

function initSmoothScroll() {
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

function initResetButtons() {
  const resetButton = document.getElementById("resetEditor");
  const clearTextsButton = document.getElementById("clearTexts");

  resetButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.colors);
    localStorage.removeItem(STORAGE_KEYS.sections);
    location.reload();
  });

  clearTextsButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.texts);
    location.reload();
  });
}

function initLandingEditor() {
  initColorEditor();
  initSectionToggles();
  initTextEditor();
  initSmoothScroll();
  initResetButtons();
}

document.addEventListener("DOMContentLoaded", initLandingEditor);
