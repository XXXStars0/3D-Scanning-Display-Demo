// Function to fetch data.json and populate the HTML
async function initializeWebsite() {
    try {
        // Fetch the configuration JSON file
        const response = await fetch('data/config.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Expose data globally so chat.js doesn't need to re-fetch
        window.appConfig = data;
        const uiText = data.uiText || {};

        // 0. Setup UI Text Overrides
        if (Object.keys(uiText).length > 0) {
            const setById = (id, text) => { if(text && document.getElementById(id)) document.getElementById(id).textContent = text; };
            setById('settings-btn', uiText.btnAiSettings);
            setById('toggle-anchors-btn', uiText.btnToggleHotspots);
            setById('toggle-skybox-btn', uiText.btnToggleBackground);
            setById('clear-chat', uiText.chatBtnClear);
            setById('send-btn', uiText.chatBtnSend);
            if(uiText.chatInputPlaceholder && document.getElementById('chat-input')) {
                document.getElementById('chat-input').placeholder = uiText.chatInputPlaceholder;
            }
            
            const headers = document.querySelectorAll('.panel h2');
            if (headers.length >= 3) {
                if (uiText.sectionDescription) headers[0].textContent = uiText.sectionDescription;
                if (uiText.sectionModel) headers[1].textContent = uiText.sectionModel;
                if (uiText.sectionGallery) headers[2].textContent = uiText.sectionGallery;
            }
            const chatHeader = document.querySelector('.chat-header h2');
            if (chatHeader && uiText.chatTitle) chatHeader.textContent = uiText.chatTitle;
            
            const tooltipGuide = document.querySelector('.ai-chat-btn .tooltip');
            if (tooltipGuide && uiText.chatTooltipGuide) tooltipGuide.textContent = uiText.chatTooltipGuide;
        }

        // 1. Setup Page Title and Description
        document.getElementById('page-title').textContent = data.title;
        document.getElementById('page-description').textContent = data.description;
        document.title = "3D Specimen: " + data.title;

        // 2. Setup Header Banner Background
        if (data.bannerUrl) {
            document.querySelector('.banner').style.backgroundImage = `url('${data.bannerUrl}')`;
        }

        // 3. Apply Theme Configuration
        if (data.theme) {
            if (data.theme.colors) {
                Object.entries(data.theme.colors).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(`--mc-${key}`, value);
                });
            }
            if (data.theme.fonts) {
                let customStyles = "";
                const applyFont = (fontConfig, cssVar) => {
                    if (!fontConfig) return;
                    if (fontConfig.type === "google") {
                        const link = document.createElement('link');
                        link.href = `https://fonts.googleapis.com/css2?family=${fontConfig.family.replace(/ /g, '+')}&display=swap`;
                        link.rel = "stylesheet";
                        document.head.appendChild(link);
                        document.documentElement.style.setProperty(cssVar, `'${fontConfig.family}', sans-serif`);
                    } else if (fontConfig.type === "local") {
                        customStyles += `@font-face { font-family: '${fontConfig.family}'; src: url('${fontConfig.url}'); }\n`;
                        document.documentElement.style.setProperty(cssVar, `'${fontConfig.family}', sans-serif`);
                    }
                };
                applyFont(data.theme.fonts.title, '--font-title');
                applyFont(data.theme.fonts.body, '--font-body');
                
                if (customStyles) {
                    const styleTag = document.createElement('style');
                    styleTag.innerHTML = customStyles;
                    document.head.appendChild(styleTag);
                }
            }
        }

        // 4. Setup 3D Model Viewer
        const modelViewer = document.getElementById('model-viewer');
        if (data.modelUrl) {
            modelViewer.src = data.modelUrl;
        }

        // 4.5 Setup Hotspots
        if (data.hotspots && Array.isArray(data.hotspots)) {
            data.hotspots.forEach(hotspotData => {
                const btn = document.createElement('button');
                btn.className = 'hotspot-btn';
                btn.slot = hotspotData.slot;
                btn.dataset.position = hotspotData.position;
                btn.dataset.normal = hotspotData.normal;
                
                // Use the global tooltip for hover
                const globalTooltip = document.getElementById('global-tooltip');
                btn.addEventListener('mouseenter', () => {
                    const hoverPrompt = uiText.hotspotHoverPrompt || "Click to ask AI";
                    globalTooltip.innerHTML = `<strong>${hotspotData.label}</strong><br><span style="font-size:0.8em;color:#aaa">${hoverPrompt}</span>`;
                    globalTooltip.classList.remove('hidden');
                });
                btn.addEventListener('mousemove', (e) => {
                    let x = e.clientX + 15;
                    let y = e.clientY + 15;
                    if (x + globalTooltip.offsetWidth > window.innerWidth) x = e.clientX - globalTooltip.offsetWidth - 10;
                    if (y + globalTooltip.offsetHeight > window.innerHeight) y = e.clientY - globalTooltip.offsetHeight - 10;
                    globalTooltip.style.left = x + 'px';
                    globalTooltip.style.top = y + 'px';
                });
                btn.addEventListener('mouseleave', () => {
                    globalTooltip.classList.add('hidden');
                });

                // Add click event to trigger AI Guide & Camera Orbit
                btn.addEventListener('click', () => {
                    // Orbit Camera
                    if (hotspotData.orbit) {
                        modelViewer.cameraOrbit = hotspotData.orbit;
                    }
                    // Trigger AI Chat
                    if (hotspotData.prompt && window.triggerHotspotAI) {
                        window.triggerHotspotAI(hotspotData.prompt);
                    }
                });

                modelViewer.appendChild(btn);
            });
        }

        // 5. Generate Image Gallery (6+ faces of the item)
        const galleryGrid = document.getElementById('gallery-grid');
        
        data.images.forEach(imgData => {
            // Create container for gallery item
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            // Create image element
            const img = document.createElement('img');
            img.src = imgData.src;
            img.alt = imgData.label;
            img.loading = "lazy";
            
            // Create label element
            const label = document.createElement('div');
            label.className = 'gallery-label';
            label.textContent = imgData.label;

            // Append elements
            item.appendChild(img);
            item.appendChild(label);
            
            // Setup global floating tooltip
            if (imgData.description) {
                const globalTooltip = document.getElementById('global-tooltip');
                item.addEventListener('mouseenter', () => {
                    globalTooltip.innerHTML = imgData.description;
                    globalTooltip.classList.remove('hidden');
                });
                item.addEventListener('mousemove', (e) => {
                    let x = e.clientX + 15;
                    let y = e.clientY + 15;
                    // Keep tooltip within viewport bounds
                    if (x + globalTooltip.offsetWidth > window.innerWidth) {
                        x = e.clientX - globalTooltip.offsetWidth - 10;
                    }
                    if (y + globalTooltip.offsetHeight > window.innerHeight) {
                        y = e.clientY - globalTooltip.offsetHeight - 10;
                    }
                    globalTooltip.style.left = x + 'px';
                    globalTooltip.style.top = y + 'px';
                });
                item.addEventListener('mouseleave', () => {
                    globalTooltip.classList.add('hidden');
                });
            }
            
            // Add click listener to open the modal preview
            item.addEventListener('click', () => openImageModal(imgData.src, imgData.label, imgData.description, imgData.prompt));

            galleryGrid.appendChild(item);
        });

    } catch (error) {
        console.error("Failed to load or parse data/config.json:", error);
        const errText = window.appConfig?.uiText?.errorLoadConfig || "Error: Failed to load configuration data. Check console for details.";
        document.getElementById('page-description').textContent = errText;
    }
}

// === Modal Logic for Fullscreen Image Viewing ===

const modal = document.getElementById("image-modal");
const modalImg = document.getElementById("modal-img");
const captionText = document.getElementById("modal-caption");
const closeBtn = document.getElementById("close-modal");

// Opens the modal with the specified image source, caption, and description
function openImageModal(src, caption, description, prompt) {
    modal.style.display = "block";
    modalImg.src = src;
    
    let html = `<strong>${caption}</strong><br><span class="modal-desc">${description || ''}</span>`;
    
    const uiText = window.appConfig?.uiText || {};
    const askPrefix = uiText.modalAskAIPrefix || "Can you tell me more about the photo: ";
    const btnAskAI = uiText.modalBtnAskAI || "Ask AI About This";

    const askPrompt = prompt ? prompt : `${askPrefix}${caption}?`;
    // We leave the modal open so the user can look at the photo while the AI answers
    html += `<br><button class="mc-button" onclick="window.triggerHotspotAI('${askPrompt.replace(/'/g, "\\'")}')" style="margin-top: 15px; font-size: 0.85rem;">${btnAskAI}</button>`;
    
    captionText.innerHTML = html;
}

// Close the modal when the 'X' button is clicked
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && modal.style.display === "block") {
        modal.style.display = "none";
    }
});

// Skybox Toggle Logic
const toggleSkyboxBtn = document.getElementById('toggle-skybox-btn');
const toggleAnchorsBtn = document.getElementById('toggle-anchors-btn');
const modelWrapper = document.getElementById('model-wrapper');

if (toggleSkyboxBtn && modelWrapper) {
    toggleSkyboxBtn.addEventListener('click', () => {
        modelWrapper.classList.toggle('with-skybox');
    });
}

if (toggleAnchorsBtn && modelWrapper) {
    toggleAnchorsBtn.addEventListener('click', () => {
        modelWrapper.classList.toggle('hide-anchors');
    });
}

// === Hotspot Coordinate Picker (Developer Mode) ===
// Set this to true to enable Alt+Click coordinate picking on the 3D model
const DEBUG_MODE = true; 

document.addEventListener('DOMContentLoaded', () => {
    const modelViewer = document.querySelector('#model-viewer');
    if (modelViewer) {
        modelViewer.addEventListener('click', (event) => {
            if (DEBUG_MODE && event.altKey) {
                const hit = modelViewer.positionAndNormalFromPoint(event.clientX, event.clientY);
                if (hit) {
                    const position = `${hit.position.x.toFixed(3)} ${hit.position.y.toFixed(3)} ${hit.position.z.toFixed(3)}`;
                    const normal = `${hit.normal.x.toFixed(3)} ${hit.normal.y.toFixed(3)} ${hit.normal.z.toFixed(3)}`;
                    
                    const hotspotConfig = {
                        "slot": "hotspot-" + Date.now(),
                        "position": position,
                        "normal": normal,
                        "label": "New Hotspot",
                        "prompt": "Tell me about this part...",
                        "orbit": `${hit.position.x.toFixed(1)}deg ${hit.position.y.toFixed(1)}deg 2m`
                    };
                    
                    console.log("📍 [Hotspot Config - Paste into data.json]:\n", JSON.stringify(hotspotConfig, null, 2));
                    alert(`Coordinates Picked!\nPosition: ${position}\n(Check Console F12 for JSON)`);
                }
            }
        });
    }
});

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeWebsite);

