# 3D Specimen Display Demo

![Banner](img/1.21.6_ChaseTheSkies_Header.png)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]()
[![model-viewer](https://img.shields.io/badge/model--viewer-Google-4285F4?style=flat&logo=google&logoColor=white)]()

A lightweight, responsive frontend demo for presenting 3D-scanned specimens through a Minecraft-inspired interactive gallery.

🔗 **Live Demo:** [Explore the Specimen Here](https://xxxstars0.github.io/3D-Scanning-Display-Demo/)

## ✨ Highlights

* **Interactive 3D Preview:** Google's `<model-viewer>` renders optimized `.glb` models with camera controls, clickable hotspots, reset view, and optional auto-rotation.
* **Local-First Hotspots:** A hotspot focuses the camera and opens a local explanation; visitors can optionally choose **Ask AI for more**.
* **Structured Gallery:** Reference views and real-world plush photographs are grouped separately, with configured labels, modal image counts, and keyboard navigation.
* **Context-Aware AI Guide:** Gallery and hotspot context persists for follow-up questions; text-only models use curated image descriptions rather than image input.
* **Configurable Content:** Specimen content, gallery categories, interface text, AI behavior, and onboarding copy are separated into JSON files for easy updates and future localization.
* **Switchable Themes:** Change the active setting in `data/theme.json` to switch between Minecraft and Cornell visual themes without editing CSS.
* **BYOK AI Guide:** Visitors can provide their own OpenAI-compatible endpoint, key, and model for optional guided exploration.

## 🛠️ Tech Stack

* HTML, CSS, and JavaScript
* [model-viewer](https://modelviewer.dev/) for WebGL 3D rendering
* [Marked](https://marked.js.org/) for AI response Markdown
* [Draco](https://github.com/google/draco) compression for the optimized 3D model; the original model is archived for reference
* JSON and Markdown files for static content and configuration

## ⚙️ Run & Configure

Serve the project root with a local web server:

```bash
python -m http.server
```

Key configuration files:

* `data/content.json` — specimen, model, hotspots, gallery images, and gallery categories
* `data/ui_text.json` — interface text
* `data/onboarding.json` — How to Use overlay text and steps
* `data/ai_config.json` — AI guide behavior, generation settings, and camera actions
* `data/theme.json` — active theme, colors, and fonts

The AI guide deliberately uses BYOK. Visitors provide their own compatible endpoint, key, and model; the repository does not include or read `.env`. `.gitignore` excludes local environment files as an additional safeguard, but this static site has no server-side secret storage. Settings can stay in the current tab or be remembered in browser storage, which is not encrypted.

## 📖 Documentation

* [User Guide](docs/USER_GUIDE.md) — model controls, gallery browsing, AI setup, privacy, and common errors
* [Developer and Configuration Guide](docs/DEVELOPER_GUIDE.md) — project structure, configuration fields, content updates, themes, and testing

## 🔵 Credits

* Built as an interactive 3D display demo for the [Cornell Creative Technology Lab](https://teaching.cornell.edu/learning-technologies/creative-technology-lab).
* 3D rendering is powered by Google's [`<model-viewer>`](https://modelviewer.dev/), AI response Markdown by [Marked](https://marked.js.org/), and model compression by [Google Draco](https://github.com/google/draco).
* The current browser model is an optimized version of the original 3D scan, which is archived separately for reference.
* Minecraft-inspired visual material is used for this educational demonstration; related names and assets belong to their respective owners.

## 👥 Contributors

* [XXXStars0](https://github.com/XXXStars0) — project design, development and maintenance
* **Coworker:** [Yuqing-2434](https://github.com/Yuqing-2434) — project collaborator

---

*2026 Creative Technology Lab · 3D Specimen Display Demo*
