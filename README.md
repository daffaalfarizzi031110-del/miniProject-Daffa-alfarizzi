# To-Do Dashboard

A clean, minimal personal dashboard built with plain HTML, CSS, and vanilla JavaScript — no frameworks, no backend. All data is saved in your browser via Local Storage.

## Features

**Required (MVP)**
- **Greeting** — live clock, current date, and a greeting that changes with the time of day.
- **Focus Timer** — a 25-minute Pomodoro timer with Start, Pause, and Reset.
- **To-Do List** — add, edit (double-click a task or press Edit), mark done, and delete tasks. Saved to Local Storage.
- **Quick Links** — buttons that open your favorite sites in a new tab. Saved to Local Storage.

**Bonus**
- **Light / Dark mode** toggle (remembers your choice, and respects your OS preference on first visit).
- **Custom name** in the greeting.
- **Custom Pomodoro time** (1–120 minutes).

## Project Structure

```
miniProject-Daffa alfarizzi/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Run Locally

Just open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

For a local server (optional, handy for testing):

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

## Deploy with GitHub Pages

1. Create a new repository on GitHub.
2. Use **GitHub Desktop** to commit and push this folder to the repository.
3. In the repo on GitHub: **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to `Deploy from a branch`, choose the `main` branch and `/ (root)` folder, then **Save**.
5. Wait a minute — your site will be live at `https://<username>.github.io/<repo>/`.

## Notes

- All data lives only in your browser's Local Storage; clearing site data resets everything.
- No build step, no dependencies, no test setup.
