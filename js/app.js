/* =========================================================
   To-Do Dashboard — single JS file
   Modules:
     1. Storage helpers  (localStorage wrapper)
     2. Theme           (light/dark)
     3. Clock & Greeting (time/date + greeting + custom name)
     4. Focus Timer     (start/pause/reset + custom minutes)
     5. To-Do List      (add/edit/toggle/delete + persist)
     6. Quick Links     (add/open/delete + persist)
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Storage helpers ---------- */
  const Storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        console.warn(`Could not parse "${key}" from localStorage:`, err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn(`Could not save "${key}" to localStorage:`, err);
      }
    },
  };

  /* Storage keys */
  const KEYS = {
    todos: "td_todos",
    links: "td_links",
    theme: "td_theme",
    name: "td_name",
    minutes: "td_minutes",
  };

  /* ---------- 2. Theme ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    Storage.set(KEYS.theme, theme);
  }

  (function initTheme() {
    const saved = Storage.get(KEYS.theme, null);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  })();

  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  /* ---------- 3. Clock & Greeting ---------- */
  const greetingEl = document.getElementById("greeting");
  const datetimeEl = document.getElementById("datetime");
  const nameInput = document.getElementById("nameInput");

  function greetingFor(hour) {
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  function updateClock() {
    const now = new Date();
    const hour = now.getHours();

    const greeting = greetingFor(hour);
    const name = Storage.get(KEYS.name, "");
    const namePart = name ? `, ${name}` : "";
    greetingEl.textContent = `${greeting}${namePart}!`;

    datetimeEl.textContent = now.toLocaleString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Restore saved name into the input
  nameInput.value = Storage.get(KEYS.name, "");

  nameInput.addEventListener("input", () => {
    Storage.set(KEYS.name, nameInput.value.trim());
    updateClock();
  });

  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- 4. Focus Timer ---------- */
  const timerDisplay = document.getElementById("timerDisplay");
  const timerStartBtn = document.getElementById("timerStart");
  const timerStopBtn = document.getElementById("timerStop");
  const timerResetBtn = document.getElementById("timerReset");
  const timerMinutesInput = document.getElementById("timerMinutes");
  const timerApplyBtn = document.getElementById("timerApply");

  let totalSeconds = 0;
  let remainingSeconds = 0;
  let timerId = null;
  let isRunning = false;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function setMinutes(minutes, persist) {
    const safe = Math.min(120, Math.max(1, minutes));
    timerMinutesInput.value = safe;
    totalSeconds = safe * 60;
    remainingSeconds = totalSeconds;
    renderTimer();
    if (persist) Storage.set(KEYS.minutes, safe);
  }

  function tick() {
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds <= 0) {
      stopTimer();
      try {
        // Non-blocking beep via Web Audio (no asset needed)
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 400);
      } catch (e) { /* audio optional */ }
    }
  }

  function startTimer() {
    if (isRunning || remainingSeconds <= 0) return;
    isRunning = true;
    timerId = setInterval(tick, 1000);
    timerStartBtn.disabled = true;
    timerStopBtn.disabled = false;
  }

  function stopTimer() {
    isRunning = false;
    if (timerId) { clearInterval(timerId); timerId = null; }
    timerStartBtn.disabled = false;
    timerStopBtn.disabled = true;
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = totalSeconds;
    renderTimer();
  }

  timerStartBtn.addEventListener("click", startTimer);
  timerStopBtn.addEventListener("click", stopTimer);
  timerResetBtn.addEventListener("click", resetTimer);

  timerApplyBtn.addEventListener("click", () => {
    stopTimer();
    setMinutes(parseInt(timerMinutesInput.value, 10) || 25, true);
  });

  // Restore saved minutes
  setMinutes(Storage.get(KEYS.minutes, 25), false);

  /* ---------- 5. To-Do List ---------- */
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const todoEmpty = document.getElementById("todoEmpty");

  let todos = Storage.get(KEYS.todos, []);

  function saveTodos() { Storage.set(KEYS.todos, todos); }

  function renderTodos() {
    todoList.innerHTML = "";
    todoEmpty.style.display = todos.length === 0 ? "block" : "none";

    todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " done" : "");
      li.dataset.index = index;

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => {
        todos[index].done = checkbox.checked;
        saveTodos();
        li.classList.toggle("done", todo.done);
      });

      // Text (double-click to edit)
      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;
      text.title = "Double-click to edit";
      text.addEventListener("dblclick", () => startEdit(li, index, text));

      // Actions
      const actions = document.createElement("div");
      actions.className = "todo-item__actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "edit-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(li, index, text));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
      });

      actions.append(editBtn, deleteBtn);
      li.append(checkbox, text, actions);
      todoList.appendChild(li);
    });
  }

  function startEdit(li, index, textEl) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo-edit-input";
    editInput.value = todos[index].text;
    editInput.maxLength = 140;

    li.replaceChild(editInput, textEl);
    editInput.focus();
    editInput.select();

    const commit = () => {
      const value = editInput.value.trim();
      if (value) {
        todos[index].text = value;
        saveTodos();
      }
      renderTodos();
    };

    editInput.addEventListener("blur", commit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { renderTodos(); }
    });
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = todoInput.value.trim();
    if (!value) return;
    todos.push({ text: value, done: false });
    saveTodos();
    todoInput.value = "";
    renderTodos();
  });

  renderTodos();

  /* ---------- 6. Quick Links ---------- */
  const linkForm = document.getElementById("linkForm");
  const linkName = document.getElementById("linkName");
  const linkUrl = document.getElementById("linkUrl");
  const linkList = document.getElementById("linkList");
  const linkEmpty = document.getElementById("linkEmpty");

  let links = Storage.get(KEYS.links, []);

  function saveLinks() { Storage.set(KEYS.links, links); }

  function normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }

  function renderLinks() {
    linkList.innerHTML = "";
    linkEmpty.style.display = links.length === 0 ? "block" : "none";

    links.forEach((link, index) => {
      const item = document.createElement("span");
      item.className = "link-item";

      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Remove link";
      deleteBtn.setAttribute("aria-label", `Remove ${link.name}`);
      deleteBtn.addEventListener("click", () => {
        links.splice(index, 1);
        saveLinks();
        renderLinks();
      });

      item.append(anchor, deleteBtn);
      linkList.appendChild(item);
    });
  }

  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = linkName.value.trim();
    const rawUrl = linkUrl.value.trim();
    if (!name || !rawUrl) return;

    links.push({ name, url: normalizeUrl(rawUrl) });
    saveLinks();
    linkForm.reset();
    renderLinks();
  });

  renderLinks();
})();
