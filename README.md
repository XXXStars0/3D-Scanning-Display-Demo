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
* **Orthographic Gallery:** A responsive grid to preview the specimen from all 6 axis angles. Clicking on any thumbnail opens a clean modal overlay for higher resolution viewing.
* **Minecraft GUI Aesthetic:** Custom styled UI with authentic pixel fonts and embossed panels mimicking classic gaming interfaces.
* **Lightweight & Vanilla:** Built with pure HTML, CSS, and JavaScript without any heavy frameworks, allowing for instant loading and simple hosting.

## 🛠️ Production Workflow

The digital assets used in this demo were created using the following workflow:

1. **Scanning:** The 3D models were scanned and processed using the [Apple Reality Composer](https://apps.apple.com/us/app/reality-composer/id1462358802) app on iOS.
2. **Rendering & Processing:** The 6-sided orthographic screenshots with transparent backgrounds were generated using Unity.

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
    { "id": "front", "src": "img/path_to_front.png", "label": "Front View" }
    // Add up to 6 image objects here
  ]
}
```

## 🌐 Deployment (GitHub Pages)

This project is deployed and hosted for free via **GitHub Pages**. 

The live site is automatically built and updated from the `main` branch: [https://xxxstars0.github.io/3D-Scanning-Display-Demo/](https://xxxstars0.github.io/3D-Scanning-Display-Demo/)

## 📝 Future Roadmap & Planned Features

*   **Interactive Hotspots & Guides:** Add clickable annotation points directly on the 3D model that pop up specific anatomical or structure explanations.
*   **AI LLM Integration:** Embed a chatbot sidebar powered by a Large Language Model to act as a virtual tour guide/specimen expert, allowing users to ask questions about the scanned item.
*   **Dynamic Multi-Specimen Support:** Refactor the codebase to support multiple items using a central config routing system.