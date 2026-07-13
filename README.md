# 3D Specimen Display Demo

![Banner](img/1.21.6_ChaseTheSkies_Header.png)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)]()
[![model-viewer](https://img.shields.io/badge/model--viewer-Google-4285F4?style=flat&logo=google&logoColor=white)]()

A lightweight, fully responsive frontend demo designed to elegantly display 3D scanned models. This project utilizes a retro, Minecraft-inspired GUI aesthetic combined with modern WebGL rendering to create an interactive gallery experience.

🔗 **Live Demo:** [Explore the Specimen Here](https://xxxstars0.github.io/3D-Scanning-Display-Demo/)

## ✨ Highlights

* **Interactive 3D Preview:** Utilizes Google's `<model-viewer>` component for native, high-performance `.glb` rendering with orbit and zoom controls.
* **Decoupled Configuration:** Text, image paths, and model URLs are completely separated from the code via a `data.json` configuration file, making updates effortless.
* **Photo Gallery:** A scrollable, responsive grid to display an arbitrary number of specimen photos. Hovering over a thumbnail reveals a Minecraft-style tooltip description, and clicking opens a high-res modal overlay.
* **Minecraft GUI Aesthetic:** Custom styled UI with authentic pixel fonts and embossed panels mimicking classic gaming interfaces.
* **Lightweight & Vanilla:** Built with pure HTML, CSS, and JavaScript without any heavy frameworks, allowing for instant loading and simple hosting.

## 🛠️ Production Workflow

The digital assets used in this demo were created using the following workflow:

1. **Scanning:** The 3D models were scanned and processed using the [Apple Reality Composer](https://apps.apple.com/us/app/reality-composer/id1462358802) app on iOS.
2. **Rendering & Processing:** The 6-sided orthographic screenshots with transparent backgrounds were generated using Unity.

## 🚀 Performance Optimization

To ensure fast load times and a smooth user experience, the 3D models have been heavily optimized:

* **Dual Compression Strategy:** The 3D model uses both **Draco compression** (for geometry/meshes) and **WebP compression** (for embedded textures) using the `@gltf-transform/cli` tool.
* **Massive Size Reduction:** The final model size was reduced by over **96%** (from 13.8 MB down to 532 KB) while remaining visually lossless.
* *Note: The original uncompressed model (`Happy Ghast in a Box_9746.glb`) is kept in the `models/` directory strictly as a high-fidelity reference for future edits.*

## ⚙️ Usage & Configuration

Because this project dynamically loads local JSON data and 3D models, it must be run through a local web server to bypass browser CORS security restrictions.

### How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/XXXStars0/3D-Scanning-Display-Demo.git
   ```
   (Or download the ZIP archive from the GitHub project page).
2. Serve the root directory using any local web server. For example:
   * **Python:** Run `python -m http.server` (or `python3`) in the terminal and visit `http://localhost:8000`.
   * **VS Code:** Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".
   * **Node.js:** Run `npx serve .`

### How to Configure Content

You do not need to modify any HTML or JS files to change the displayed content. Simply edit the `js/data.json` file:

```json
{
  "title": "Happy Ghast Specimen",
  "description": "Your detailed description here...",
  "modelUrl": "models/Your_Model.glb",
  "bannerUrl": "img/Your_Banner.png",
  "images": [
    { 
      "id": "front", 
      "src": "img/path_to_img.png", 
      "label": "Front View",
      "description": "Optional text that appears on hover and in the modal."
    }
    // Add as many image objects as you want! The gallery automatically adds a scrollbar.
  ],
  "theme": {
    "colors": {
      "bg-color": "#c6c6c6",
      "text-dark": "#3f3f3f"
    },
    "fonts": {
      "title": { "type": "local", "family": "MinecraftTitle", "url": "fonts/...ttf" },
      "body": { "type": "google", "family": "Press Start 2P" }
    }
  }
}
```

*Note: The `theme` block dynamically overrides CSS variables, allowing you to easily reskin the entire page and swap fonts (both local files and Google Fonts) without touching `style.css`!*

## 🤖 AI Guide Integration (Pure Frontend)

This project features a fully client-side AI integration allowing users to chat with an intelligent "Museum Guide".
* **User-Configurable API:** Because this is a static site, users must provide their own OpenAI-compatible API credentials via the "⚙ AI Settings" button.
* **Security & Fallback:** API credentials are saved securely in `localStorage`. For local development, simply create a `.env` file (e.g. `API_KEY=sk-xxx`, `API_MODEL=deepseek-v4-flash`). It's ignored by Git and will be auto-loaded securely.

### 📚 Dynamic Knowledge Base
The AI does not hallucinate facts. It acts as an expert museum guide by loading context directly from `data/knowledge.md`. 
To teach the AI new facts or change its persona:
1. Open `data/knowledge.md`.
2. Edit the markdown file with any new facts, dimensions, lore, or rules.
3. The Chat UI will automatically parse this and inject it into the system prompt.

*Note: Future optimizations may include advanced chunking and RAG (Retrieval-Augmented Generation) if the knowledge base outgrows the current system prompt injection approach.*

## 🌐 Deployment (GitHub Pages)

This project is deployed and hosted for free via **GitHub Pages**. 

The live site is automatically built and updated from the `main` branch: [https://xxxstars0.github.io/3D-Scanning-Display-Demo/](https://xxxstars0.github.io/3D-Scanning-Display-Demo/)

## 📝 Future Roadmap & Planned Features

*   **Interactive Hotspots & Guides:** Add clickable annotation points directly on the 3D model that pop up specific anatomical or structure explanations.
*   **AI LLM Integration:** Embed a chatbot sidebar powered by a Large Language Model to act as a virtual tour guide/specimen expert, allowing users to ask questions about the scanned item.
*   **Dynamic Multi-Specimen Support:** Refactor the codebase to support multiple items using a central config routing system.