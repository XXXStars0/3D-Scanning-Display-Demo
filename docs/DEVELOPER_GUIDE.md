# Developer and Configuration Guide

This is a static HTML, CSS, and JavaScript demo. Content, themes, interface text, and most AI behavior can be changed without editing the main application logic.

## Project Structure

```text
css/          Interface, responsive layout, and theme styles
data/         Exhibit content, text, theme, onboarding, and AI configuration
fonts/        Local theme fonts
img/          Banner, gallery, and interface images
js/           Model viewer, gallery, UI, and AI behavior
models/       Browser-ready 3D models
index.html    Main page structure
```

At startup, `js/script.js` loads the JSON configuration files and builds the interface. Google's `<model-viewer>` renders the optimized GLB model. `js/chat.js` loads `data/knowledge.md` and connects directly to the visitor's OpenAI-compatible endpoint when the optional AI Guide is used.

## Run Locally

Serve the project root through HTTP so the browser can load JSON and Markdown files. In VS Code, the simplest option is to install the **Live Server** extension, open `index.html`, and select **Go Live**.

You can also use Python from the project root:

```bash
python -m http.server
```

Then open the address printed by the server. Opening `index.html` directly from the file system may block configuration requests.

## Configuration Overview

| File | Purpose |
| --- | --- |
| `data/content.json` | Specimen, model, hotspots, gallery categories, and images |
| `data/ui_text.json` | Buttons, status labels, error messages, and other interface text |
| `data/onboarding.json` | How to Use introduction and steps |
| `data/theme.json` | Active theme, colors, fonts, and theme-specific options |
| `data/ai_config.json` | AI response behavior, compatibility settings, and viewer actions |
| `data/knowledge.md` | Curated exhibit knowledge supplied to the AI Guide |

### Exhibit and Gallery Content

Common fields in `data/content.json`:

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Exhibit title |
| `description` | string | Main specimen introduction |
| `modelUrl` | string | Path to the optimized `.glb` model |
| `bannerUrl` | string | Path to the page banner |
| `hotspots` | array | Interactive model features and their camera views |
| `galleryCategories` | object | Gallery headings, descriptions, labels, and order |
| `images` | array | Gallery images and their curated AI context |

Each hotspot should provide a stable `id`, model-viewer `position` and `normal`, a local `description`, an optional AI `prompt`, and the target camera `orbit`. The same hotspot ID becomes an allowed AI viewer action, so keep IDs stable when editing content.

Gallery images should include the following fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable image identifier |
| `src` | Image path |
| `label` | Visible image title |
| `category` | Matching gallery category key |
| `description` | Short local explanation |
| `visualFacts` | Facts a text-only AI may safely use |
| `aiPrompt` | Suggested question for **Ask AI** |

Reference images and creative photographs should use separate categories. Write `visualFacts` as concrete observations rather than asking the model to infer unseen image details.

### Interface Text and Onboarding

Use `data/ui_text.json` for short interface labels, status messages, and reusable error text. Use `data/onboarding.json` for the How to Use title, introduction, ordered steps, and dismiss button. Keeping these strings outside JavaScript makes content updates and future localization easier.

### Themes

Set `activeTheme` in `data/theme.json` to `minecraft`, `cornell`, or another configured theme. Each theme defines its name, colors, fonts, and optional chat icon.

When adding a theme:

1. Add its configuration under `themes`.
2. Reuse the existing CSS variables and component classes.
3. Check model controls, dialogs, gallery navigation, focus styles, and the floating AI panel at narrow widths.

### Site Icon

The browser tab icon is `img/favicon.png`, referenced directly by `index.html`. To change it, replace that file with another compatible PNG while keeping the same filename and path. No JavaScript or JSON configuration changes are required.

### AI Guide

`data/ai_config.json` controls the welcome message, model capabilities, generation settings, extra system instructions, and configured viewer actions.

| Field | Purpose |
| --- | --- |
| `capabilities.vision` | Indicates whether image input is expected; currently `false` |
| `capabilities.galleryContextMode` | Selects curated text context for gallery questions |
| `generation.maxTokens` | Requested response limit |
| `generation.temperature` | Provider-supported response variation |
| `generation.tokenParameter` | `auto`, `max_tokens`, or `max_completion_tokens` |
| `generation.responseInstructions` | Desired response length and completion behavior |
| `actions.default_view` | Default camera orbit used by Reset View and AI actions |

The client supports common OpenAI-compatible Chat Completions APIs and retries known token-parameter or temperature compatibility errors. Providers may still reject browser CORS requests or use a different protocol.

Viewer actions use the text marker `[ACTION: action_id]`. Only configured actions and hotspot IDs are accepted, and only the first valid action in one response is executed.

### Knowledge Base

Keep `data/knowledge.md` focused on verified specimen facts, scan context, visible features, and useful interpretation. Gallery-specific observations belong in the corresponding image's `visualFacts`; this gives non-multimodal models enough context when the visitor selects **Ask AI**.

## Common Update Tasks

### Replace the Specimen

1. Add the browser-ready GLB file under `models/`.
2. Update `modelUrl`, the exhibit title, and description.
3. Rebuild hotspot positions, normals, and camera orbits for the new model.
4. Replace gallery content and update `data/knowledge.md`.
5. Test Reset View, auto-rotation, hotspots, and AI actions together.

The current model is Draco-optimized for web delivery. Keep any large original scan archived separately and publish only the optimized model when possible.

### Add a Gallery Image

1. Add the image under `img/`.
2. Add an entry to `images` with a matching category.
3. Supply a local description, concrete `visualFacts`, and a focused `aiPrompt`.
4. Check the gallery count, modal navigation, and layout at multiple window sizes.

### Add or Rename a Hotspot

Update its content and camera configuration together. If an ID changes, also review prompts or documentation that refer to its viewer action. Selecting a hotspot should pause auto-rotation and focus the intended feature from any previous turntable angle.

## Testing Checklist

* Serve the site through HTTP and check the browser console.
* Parse all files under `data/` after changing JSON.
* Check both Minecraft and Cornell themes.
* Check desktop, narrow-screen, keyboard, and focus behavior.
* Test hotspots after the model has auto-rotated.
* Test gallery navigation and active AI context.
* Test BYOK session storage, remembered storage, connection status, and clearing credentials.
* Never commit `.env`, API keys, or other private credentials.

GitHub Pages can deploy the repository as static files; no build step is required. Keep asset paths relative and preserve filename capitalization for case-sensitive hosting.

## Contributions and Credits

Keep implementation changes small and readable, preserve the existing comment style, and prefer configuration updates over JavaScript changes when the behavior already exists. Test both themes before opening a pull request.

Project participants and their GitHub profiles are listed in the README **Contributors** section. Add asset, model, font, or library attribution to README **Credits** when introducing new material.
