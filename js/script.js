// Function to fetch data.json and populate the HTML
async function initializeWebsite() {
    try {
        // Fetch the configuration JSON files
        const [contentRes, uiRes, aiRes, themeRes] = await Promise.all([
            fetch('data/content.json'),
            fetch('data/ui_text.json'),
            fetch('data/ai_config.json'),
            fetch('data/theme.json')
        ]);
        
        if (!contentRes.ok || !uiRes.ok || !aiRes.ok || !themeRes.ok) {
            throw new Error(`HTTP error! content: ${contentRes.status}, ui: ${uiRes.status}, ai: ${aiRes.status}, theme: ${themeRes.status}`);
        }
        
        const content = await contentRes.json();
        const uiText = await uiRes.json();
        const aiConfig = await aiRes.json();
        const themeConfig = await themeRes.json();
        
        // Expose data globally so chat.js doesn't need to re-fetch
        const data = { ...content, uiText, aiConfig, themeConfig };
        window.appConfig = data;

        // 0. Setup UI Text Overrides
        if (Object.keys(uiText).length > 0) {
            const setById = (id, text) => { if(text && document.getElementById(id)) document.getElementById(id).textContent = text; };
            setById('settings-btn', uiText.btnAiSettings);
            setById('settings-btn', uiText.btnAiSettings);
            setById(
                'toggle-anchors-btn',
                uiText.btnHideHotspots || 'Hide Hotspots'
            );
            setById(
                'toggle-skybox-btn',
                uiText.btnEnableEnvironment || 'Enable Environment'
            );
            setById(
                'reset-model-btn',
                uiText.btnResetView || 'Reset View'
            );
            setById(
                'toggle-auto-rotate-btn',
                uiText.btnEnableAutoRotate || 'Enable Auto Rotate'
            );
            setById(
                'model-guide',
                uiText.modelGuide ||
                    'Drag to rotate · Scroll to zoom · Click markers to explore'
            );
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

            const posterText = document.getElementById('poster-text');
            if (posterText && uiText.loadingModelText) posterText.textContent = uiText.loadingModelText;
        }

        // 1. Setup Page Title and Description
        document.getElementById('page-title').textContent = data.title;
        document.getElementById('page-description').textContent = data.description;
        document.title = "3D Specimen: " + data.title;

        // 2. Setup 3D Model
        const modelViewer = document.getElementById('model-viewer');
        if (modelViewer) {
            modelViewer.src = data.modelUrl;
            if (aiConfig?.actions?.default_view) {
                modelViewer.cameraOrbit = aiConfig.actions.default_view;
                modelViewer.fieldOfView = 'auto';
            }
        }

        // 2. Setup Header Banner Background
        if (data.bannerUrl) {
            document.querySelector('.banner').style.backgroundImage = `url('${data.bannerUrl}')`;
        }

        // 3. Apply Theme Configuration
        const activeThemeData = themeConfig.themes[themeConfig.activeTheme];
        
        if (activeThemeData) {
            // Apply theme class name for CSS overrides
            if (activeThemeData.name) {
                document.body.classList.add(`theme-${activeThemeData.name}`);
            }
            
            // Replace chat icon if specified
            if (activeThemeData.chatIcon) {
                const aiBtn = document.getElementById('ai-chat-btn');
                if (aiBtn) {
                    const tooltipText = window.appConfig.uiText?.chatTooltipGuide || 'Click to ask AI';
                    aiBtn.innerHTML = `<div class="chat-icon-emoji">${activeThemeData.chatIcon}</div><div class="tooltip">${tooltipText}</div>`;
                }
            }

            if (activeThemeData.colors) {
                Object.entries(activeThemeData.colors).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(`--mc-${key}`, value);
                });
            }

            if (activeThemeData.fonts) {
                Object.entries(activeThemeData.fonts).forEach(([element, fontConfig]) => {
                    if (fontConfig.type === "local") {
                        const newStyle = document.createElement('style');
                        newStyle.appendChild(document.createTextNode(`
                            @font-face {
                                font-family: '${fontConfig.family}';
                                src: url('${fontConfig.url}') format('truetype');
                            }
                        `));
                        document.head.appendChild(newStyle);
                    } else if (fontConfig.type === "google") {
                        const link = document.createElement('link');
                        link.href = `https://fonts.googleapis.com/css2?family=${fontConfig.family.replace(/ /g, '+')}&display=swap`;
                        link.rel = "stylesheet";
                        document.head.appendChild(link);
                    }
                    
                    if (element === "title") {
                        document.documentElement.style.setProperty('--font-title', `'${fontConfig.family}', sans-serif`);
                    } else if (element === "body") {
                        document.documentElement.style.setProperty('--font-body', `'${fontConfig.family}', sans-serif`);
                    }
                });
            }
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
                    // Orbit Camera and shift Target Focus
                    if (hotspotData.position) {
                        modelViewer.cameraTarget = hotspotData.position;
                    }
                    if (hotspotData.orbit) {
                        modelViewer.cameraOrbit = hotspotData.orbit;
                        modelViewer.fieldOfView = 'auto';
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

        // Reveal the body now that the theme is applied
        document.body.classList.add('theme-loaded');

    } catch (error) {
        console.error("Failed to load or parse JSON configs:", error);
        const errText = window.appConfig?.uiText?.errorLoadConfig || "Error: Failed to load configuration data. Check console for details.";
        document.getElementById('page-description').textContent = errText;
        
        // Reveal the body even on error so the user can see the error message
        document.body.classList.add('theme-loaded');
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


// === Model Control Logic ===

const toggleSkyboxBtn = document.getElementById('toggle-skybox-btn');
const toggleAnchorsBtn = document.getElementById('toggle-anchors-btn');
const resetModelBtn = document.getElementById('reset-model-btn');
const toggleAutoRotateBtn = document.getElementById(
    'toggle-auto-rotate-btn'
);

const modelWrapper = document.getElementById('model-wrapper');
const modelViewer = document.getElementById('model-viewer');


function getModelControlText() {
    const uiText = window.appConfig?.uiText || {};

    return {
        hideHotspots:
            uiText.btnHideHotspots || 'Hide Hotspots',

        showHotspots:
            uiText.btnShowHotspots || 'Show Hotspots',

        enableEnvironment:
            uiText.btnEnableEnvironment || 'Enable Environment',

        disableEnvironment:
            uiText.btnDisableEnvironment || 'Disable Environment',

        enableAutoRotate:
            uiText.btnEnableAutoRotate || 'Enable Auto Rotate',

        disableAutoRotate:
            uiText.btnDisableAutoRotate || 'Disable Auto Rotate'
    };
}


/* ----------------------------------------
   Synchronize initial button states
   ---------------------------------------- */

function updateModelControlButtons() {
    const labels = getModelControlText();

    if (toggleAnchorsBtn && modelWrapper) {
        const hotspotsAreHidden =
            modelWrapper.classList.contains('hide-anchors');

        toggleAnchorsBtn.textContent = hotspotsAreHidden
            ? labels.showHotspots
            : labels.hideHotspots;

        toggleAnchorsBtn.setAttribute(
            'aria-pressed',
            String(!hotspotsAreHidden)
        );
    }

    if (toggleSkyboxBtn && modelWrapper) {
        const environmentIsEnabled =
            modelWrapper.classList.contains('with-skybox');

        toggleSkyboxBtn.textContent = environmentIsEnabled
            ? labels.disableEnvironment
            : labels.enableEnvironment;

        toggleSkyboxBtn.setAttribute(
            'aria-pressed',
            String(environmentIsEnabled)
        );
    }

    if (toggleAutoRotateBtn && modelViewer) {
        const autoRotateIsEnabled =
            modelViewer.hasAttribute('auto-rotate');

        toggleAutoRotateBtn.textContent = autoRotateIsEnabled
            ? labels.disableAutoRotate
            : labels.enableAutoRotate;

        toggleAutoRotateBtn.setAttribute(
            'aria-pressed',
            String(autoRotateIsEnabled)
        );
    }
}


/* ----------------------------------------
   Show / hide hotspots
   ---------------------------------------- */

if (toggleAnchorsBtn && modelWrapper) {
    toggleAnchorsBtn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        modelWrapper.classList.toggle('hide-anchors');
        updateModelControlButtons();
    });
}


/* ----------------------------------------
   Enable / disable environment
   ---------------------------------------- */

if (toggleSkyboxBtn && modelWrapper) {
    toggleSkyboxBtn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        modelWrapper.classList.toggle('with-skybox');
        updateModelControlButtons();
    });
}


/* ----------------------------------------
   Reset camera position
   ---------------------------------------- */

if (resetModelBtn && modelViewer) {
    resetModelBtn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();

        const defaultView =
            window.appConfig?.aiConfig?.actions?.default_view;

        modelViewer.cameraTarget = 'auto auto auto';
        modelViewer.cameraOrbit =
            defaultView || '0deg 75deg 105%';
        modelViewer.fieldOfView = 'auto';

        if (
            typeof modelViewer.jumpCameraToGoal === 'function'
        ) {
            modelViewer.jumpCameraToGoal();
        }
    });
}


/* ----------------------------------------
   Enable / disable automatic rotation
   ---------------------------------------- */

if (toggleAutoRotateBtn && modelViewer) {
    toggleAutoRotateBtn.addEventListener(
        'click',
        function(event) {
            event.preventDefault();
            event.stopPropagation();

            const autoRotateIsEnabled =
                modelViewer.hasAttribute('auto-rotate');

            if (autoRotateIsEnabled) {
                modelViewer.removeAttribute('auto-rotate');
            } else {
                modelViewer.setAttribute('auto-rotate', '');
            }

            updateModelControlButtons();
        }
    );
}


/* Set correct button labels when the page loads */

updateModelControlButtons();


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
                        "id": "hotspot-" + Date.now(),
                        "slot": "hotspot-" + Date.now(),
                        "position": position,
                        "normal": normal,
                        "label": "New Hotspot",
                        "prompt": "Tell me about this part...",
                        "orbit": `0deg 75deg 0.5m`
                    };
                    
                    console.log("📍 [Hotspot Config - Paste into data/content.json]:\n", JSON.stringify(hotspotConfig, null, 2));
                    alert(`Coordinates Picked!\nPosition: ${position}\n(Check Console F12 for JSON)`);
                }
            }
        });
    }
});

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeWebsite);

