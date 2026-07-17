// Function to fetch data.json and populate the HTML
async function initializeWebsite() {
    try {
        // Fetch the configuration JSON files
        const [contentRes, uiRes, aiRes, themeRes, onboardingRes] = await Promise.all([
            fetch('data/content.json'),
            fetch('data/ui_text.json'),
            fetch('data/ai_config.json'),
            fetch('data/theme.json'),
            fetch('data/onboarding.json')
        ]);
        
        if (!contentRes.ok || !uiRes.ok || !aiRes.ok || !themeRes.ok || !onboardingRes.ok) {
            throw new Error(`HTTP error! content: ${contentRes.status}, ui: ${uiRes.status}, ai: ${aiRes.status}, theme: ${themeRes.status}, onboarding: ${onboardingRes.status}`);
        }
        
        const content = await contentRes.json();
        const uiText = await uiRes.json();
        const aiConfig = await aiRes.json();
        const themeConfig = await themeRes.json();
        const onboardingConfig = await onboardingRes.json();
        
        // Expose data globally so chat.js doesn't need to re-fetch
        const data = { ...content, uiText, aiConfig, themeConfig, onboardingConfig };
        window.appConfig = data;

        // 0. Setup UI Text Overrides
        if (Object.keys(uiText).length > 0) {
            const setById = (id, text) => { if(text && document.getElementById(id)) document.getElementById(id).textContent = text; };
            setById('settings-btn', uiText.btnAiSettings);
            setById('how-to-use-btn', uiText.btnHowToUse);
            setById('reset-model-btn', uiText.btnResetView);
            setById('model-guide', uiText.modelGuide);
            setById('clear-chat', uiText.chatBtnClear);
            setById('send-btn', uiText.chatBtnSend);
            setById('test-connection-btn', uiText.btnTestConnection);
            setById('ask-hotspot-ai', uiText.hotspotAskAiButton);
            setById('byok-storage-note', uiText.byokStorageNote);
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
            
            const tooltipGuide = document.getElementById('ai-chat-tooltip-label');
            if (tooltipGuide && uiText.chatTooltipGuide) tooltipGuide.textContent = uiText.chatTooltipGuide;
            const aiChatButton = document.getElementById('ai-chat-btn');
            if (aiChatButton) {
                const chatIsOpen = aiChatButton.getAttribute('aria-expanded') === 'true';
                const buttonLabel = chatIsOpen ? uiText.chatButtonCloseLabel : uiText.chatButtonOpenLabel;
                if (buttonLabel) aiChatButton.setAttribute('aria-label', buttonLabel);
            }
            const closeChatButton = document.getElementById('close-chat');
            if (closeChatButton && uiText.chatCloseButtonLabel) closeChatButton.setAttribute('aria-label', uiText.chatCloseButtonLabel);

            const posterText = document.getElementById('poster-text');
            if (posterText && uiText.loadingModelText) posterText.textContent = uiText.loadingModelText;
        }
        populateOnboarding(onboardingConfig);

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
        updateModelControlButtons();

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
                    aiBtn.innerHTML = `<span class="chat-icon-emoji" aria-hidden="true">${activeThemeData.chatIcon}</span><span id="ai-chat-tooltip" class="tooltip" role="tooltip"><span id="ai-chat-tooltip-label" class="ai-chat-tooltip-label">${tooltipText}</span><span id="ai-tooltip-status" class="ai-tooltip-status is-unconfigured">● AI not configured</span></span>`;
                    // Let chat.js restore the current AI status after the themed icon is rendered.
                    window.dispatchEvent(new Event('ai-widget-rendered'));
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
                    const hoverPrompt = uiText.hotspotHoverPrompt || "Click to explore";
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

                // Local feature details work independently of the optional AI guide.
                btn.addEventListener('click', () => {
                    // Restore the model orientation before applying the configured hotspot view.
                    prepareModelForFocusedView();

                    // Orbit Camera and shift Target Focus
                    if (hotspotData.position) {
                        modelViewer.cameraTarget = hotspotData.position;
                    }
                    if (hotspotData.orbit) {
                        modelViewer.cameraOrbit = hotspotData.orbit;
                        modelViewer.fieldOfView = 'auto';
                    }
                    showHotspotInfo(hotspotData);
                });

                modelViewer.appendChild(btn);
            });
        }

        // 5. Generate a grouped image gallery from the configured categories.
        galleryImages = Array.isArray(data.images) ? data.images : [];
        const galleryTotal = document.getElementById('gallery-total');
        if (galleryTotal) {
            const galleryCountFormat = uiText.galleryCountFormat || '{count} photos';
            galleryTotal.textContent = galleryCountFormat.replace('{count}', galleryImages.length);
        }
        renderGallery(galleryImages, data.galleryCategories || {});

        // Reveal the body now that the theme is applied
        document.body.classList.add('theme-loaded');
        window.setTimeout(openOnboardingIfNeeded, 300);

    } catch (error) {
        console.error("Failed to load or parse JSON configs:", error);
        const errText = window.appConfig?.uiText?.errorLoadConfig || "Error: Failed to load configuration data. Check console for details.";
        document.getElementById('page-description').textContent = errText;
        
        // Reveal the body even on error so the user can see the error message
        document.body.classList.add('theme-loaded');
    }
}

let galleryImages = [];

// Group gallery items by category so reference views and real-world photos are distinct.
function renderGallery(images, categories) {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    const groupedImages = new Map();
    images.forEach(image => {
        const category = image.category || 'uncategorized';
        if (!groupedImages.has(category)) groupedImages.set(category, []);
        groupedImages.get(category).push(image);
    });

    const orderedCategories = [...groupedImages.keys()].sort((first, second) => {
        const firstOrder = categories[first]?.order ?? Number.MAX_SAFE_INTEGER;
        const secondOrder = categories[second]?.order ?? Number.MAX_SAFE_INTEGER;
        return firstOrder - secondOrder;
    });

    galleryGrid.replaceChildren();
    orderedCategories.forEach(categoryKey => {
        const category = categories[categoryKey] || {};
        const group = document.createElement('section');
        group.className = `gallery-group gallery-group-${categoryKey}`;
        const header = document.createElement('div');
        header.className = 'gallery-group-header';
        const title = document.createElement('h3');
        title.textContent = `${category.title || categoryKey} · ${groupedImages.get(categoryKey).length}`;
        const description = document.createElement('p');
        description.textContent = category.description || '';
        header.append(title, description);
        group.appendChild(header);

        groupedImages.get(categoryKey).forEach(image => group.appendChild(createGalleryItem(image)));
        galleryGrid.appendChild(group);
    });
}

// Create one keyboard-accessible thumbnail and its hover description.
function createGalleryItem(imageData) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = imageData.src;
    img.alt = imageData.label;
    img.loading = 'lazy';
    const label = document.createElement('div');
    label.className = 'gallery-label';
    label.textContent = imageData.label;
    item.append(img, label);

    if (imageData.description) {
        const globalTooltip = document.getElementById('global-tooltip');
        item.addEventListener('mouseenter', () => {
            globalTooltip.textContent = imageData.description;
            globalTooltip.classList.remove('hidden');
        });
        item.addEventListener('mousemove', event => positionTooltip(globalTooltip, event));
        item.addEventListener('mouseleave', () => globalTooltip.classList.add('hidden'));
    }

    item.addEventListener('click', () => openImageModal(imageData));
    return item;
}

function positionTooltip(tooltip, event) {
    let x = event.clientX + 15;
    let y = event.clientY + 15;
    if (x + tooltip.offsetWidth > window.innerWidth) x = event.clientX - tooltip.offsetWidth - 10;
    if (y + tooltip.offsetHeight > window.innerHeight) y = event.clientY - tooltip.offsetHeight - 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

// Build extra text context for models that cannot directly inspect images.
function buildGalleryAiContext(imageData) {
    const visualFacts = Array.isArray(imageData.visualFacts) && imageData.visualFacts.length > 0
        ? imageData.visualFacts.map(fact => `- ${fact}`).join('\n')
        : '- No additional visual facts were configured.';

    return `The visitor is viewing a gallery image.

Image title: ${imageData.label}
Image category: ${imageData.category || 'uncategorized'}
Curated image description: ${imageData.description || 'No description provided.'}

Curated visible details:
${visualFacts}

Use the curated image context above together with the specimen Knowledge Base. Do not claim that you directly viewed the image. Clearly identify any inference and do not invent visual details.`;
}

// Build local feature context before asking the optional AI guide.
function buildHotspotAiContext(hotspotData) {
    return `The visitor selected a hotspot on the 3D specimen.

Feature: ${hotspotData.label}
Curated feature description: ${hotspotData.description || 'No description provided.'}

Use this hotspot context together with the specimen Knowledge Base. Do not invent details that are not documented.`;
}

// === Local Hotspot Details ===
const hotspotInfoCard = document.getElementById('hotspot-info-card');
const hotspotInfoTitle = document.getElementById('hotspot-info-title');
const hotspotInfoDescription = document.getElementById('hotspot-info-description');
const closeHotspotInfoBtn = document.getElementById('close-hotspot-info');
const askHotspotAiBtn = document.getElementById('ask-hotspot-ai');
let activeHotspot = null;

function showHotspotInfo(hotspotData) {
    if (!hotspotInfoCard) return;
    activeHotspot = hotspotData;
    hotspotInfoTitle.textContent = hotspotData.label || 'Feature details';
    hotspotInfoDescription.textContent = hotspotData.description || 'Explore this feature in the 3D model.';
    askHotspotAiBtn.hidden = !hotspotData.prompt;
    hotspotInfoCard.classList.remove('hidden');
}

if (closeHotspotInfoBtn) {
    closeHotspotInfoBtn.addEventListener('click', () => hotspotInfoCard.classList.add('hidden'));
}

if (askHotspotAiBtn) {
    askHotspotAiBtn.addEventListener('click', () => {
        if (activeHotspot?.prompt && window.triggerHotspotAI) {
            window.triggerHotspotAI(activeHotspot.prompt, buildHotspotAiContext(activeHotspot), {
                type: 'hotspot',
                title: activeHotspot.label
            });
        }
    });
}

// === First-visit Onboarding ===
const onboardingModal = document.getElementById('onboarding-modal');
const onboardingOpenBtn = document.getElementById('how-to-use-btn');
const onboardingCloseBtn = document.getElementById('close-onboarding');
const onboardingDismissBtn = document.getElementById('dismiss-onboarding');
const ONBOARDING_STORAGE_KEY = 'specimen_onboarding_seen';
let onboardingReturnFocus = null;

function populateOnboarding(config = {}) {
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element && value) element.textContent = value;
    };
    setText('onboarding-title', config.title);
    setText('onboarding-intro', config.intro);
    setText('dismiss-onboarding', config.dismissLabel);

    const stepsList = document.getElementById('onboarding-steps');
    if (stepsList && Array.isArray(config.steps)) {
        stepsList.replaceChildren();
        config.steps.forEach(step => {
            const item = document.createElement('li');
            item.textContent = step;
            stepsList.appendChild(item);
        });
    }
}

function openOnboarding() {
    if (!onboardingModal) return;
    onboardingReturnFocus = document.activeElement;
    onboardingModal.style.display = 'block';
    onboardingModal.setAttribute('aria-hidden', 'false');
    onboardingCloseBtn?.focus();
}

function closeOnboarding(remember = false) {
    if (!onboardingModal) return;
    if (remember) localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onboardingModal.style.display = 'none';
    onboardingModal.setAttribute('aria-hidden', 'true');
    onboardingReturnFocus?.focus?.();
}

function openOnboardingIfNeeded() {
    if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) openOnboarding();
}

onboardingOpenBtn?.addEventListener('click', openOnboarding);
onboardingCloseBtn?.addEventListener('click', () => closeOnboarding(false));
onboardingDismissBtn?.addEventListener('click', () => closeOnboarding(true));
onboardingModal?.addEventListener('click', (event) => {
    if (event.target === onboardingModal) closeOnboarding(false);
});

// === Modal Logic for Fullscreen Image Viewing ===

const modal = document.getElementById("image-modal");
const modalImg = document.getElementById("modal-img");
const captionText = document.getElementById("modal-caption");
const closeBtn = document.getElementById("close-modal");
const modalMeta = document.getElementById('modal-meta');
const previousImageBtn = document.getElementById('prev-image-btn');
const nextImageBtn = document.getElementById('next-image-btn');
let activeGalleryIndex = -1;

// Opens the modal and prepares a text-only AI context for this image.
function openImageModal(imageData) {
    const imageIndex = galleryImages.indexOf(imageData);
    showGalleryImage(imageIndex >= 0 ? imageIndex : 0);
}

// Render the selected image, type label, count, and navigation state.
function showGalleryImage(index) {
    if (index < 0 || index >= galleryImages.length) return;
    activeGalleryIndex = index;
    const imageData = galleryImages[activeGalleryIndex];
    modal.style.display = "block";
    modalImg.src = imageData.src;

    const category = window.appConfig?.galleryCategories?.[imageData.category] || {};
    const imageType = category.shortLabel || imageData.category || 'Gallery Image';
    modalMeta.textContent = `${imageType} · ${activeGalleryIndex + 1} / ${galleryImages.length}`;
    previousImageBtn.disabled = activeGalleryIndex === 0;
    nextImageBtn.disabled = activeGalleryIndex === galleryImages.length - 1;

    const uiText = window.appConfig?.uiText || {};
    const askPrefix = uiText.modalAskAIPrefix || "Can you tell me more about the photo: ";
    const btnAskAI = uiText.modalBtnAskAI || "Ask AI About This";
    const question = imageData.aiPrompt || imageData.prompt || `${askPrefix}${imageData.label}?`;
    const aiContext = buildGalleryAiContext(imageData);

    // Create caption content without inserting configuration text as HTML.
    const title = document.createElement('strong');
    title.textContent = imageData.label;
    const description = document.createElement('span');
    description.className = 'modal-desc';
    description.textContent = imageData.description || '';
    const askButton = document.createElement('button');
    askButton.className = 'mc-button';
    askButton.style.marginTop = '15px';
    askButton.style.fontSize = '0.85rem';
    askButton.textContent = btnAskAI;
    askButton.addEventListener('click', () => {
        if (window.triggerHotspotAI) window.triggerHotspotAI(question, aiContext, {
            type: 'gallery',
            title: imageData.label
        });
    });

    // We leave the modal open so the user can look at the photo while the AI answers
    captionText.replaceChildren(title, document.createElement('br'), description, document.createElement('br'), askButton);
}

// Close the modal when the 'X' button is clicked
closeBtn.onclick = function() {
    modal.style.display = "none";
}

previousImageBtn.addEventListener('click', () => showGalleryImage(activeGalleryIndex - 1));
nextImageBtn.addEventListener('click', () => showGalleryImage(activeGalleryIndex + 1));

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape" && onboardingModal?.style.display === "block") {
        closeOnboarding(false);
    }
    if (event.key === "Escape" && modal.style.display === "block") {
        modal.style.display = "none";
    }
    if (modal.style.display === "block" && event.key === "ArrowLeft") {
        showGalleryImage(activeGalleryIndex - 1);
    }
    if (modal.style.display === "block" && event.key === "ArrowRight") {
        showGalleryImage(activeGalleryIndex + 1);
    }
});

// Model Viewer Controls
const toggleSkyboxBtn = document.getElementById('toggle-skybox-btn');
const toggleAnchorsBtn = document.getElementById('toggle-anchors-btn');
const resetModelBtn = document.getElementById('reset-model-btn');
const toggleAutoRotateBtn = document.getElementById('toggle-auto-rotate-btn');
const modelWrapper = document.getElementById('model-wrapper');
const controlledModelViewer = document.getElementById('model-viewer');

function getModelControlText() {
    const uiText = window.appConfig?.uiText || {};
    return {
        hideHotspots: uiText.btnHideHotspots || 'Hide Hotspots',
        showHotspots: uiText.btnShowHotspots || 'Show Hotspots',
        enableEnvironment: uiText.btnEnableEnvironment || 'Enable Environment',
        disableEnvironment: uiText.btnDisableEnvironment || 'Disable Environment',
        enableAutoRotate: uiText.btnEnableAutoRotate || 'Enable Auto Rotate',
        disableAutoRotate: uiText.btnDisableAutoRotate || 'Disable Auto Rotate'
    };
}

function updateModelControlButtons() {
    const labels = getModelControlText();

    if (toggleAnchorsBtn && modelWrapper) {
        const hotspotsVisible = !modelWrapper.classList.contains('hide-anchors');
        toggleAnchorsBtn.textContent = hotspotsVisible ? labels.hideHotspots : labels.showHotspots;
        toggleAnchorsBtn.setAttribute('aria-pressed', String(hotspotsVisible));
    }

    if (toggleSkyboxBtn && modelWrapper) {
        const environmentEnabled = modelWrapper.classList.contains('with-skybox');
        toggleSkyboxBtn.textContent = environmentEnabled ? labels.disableEnvironment : labels.enableEnvironment;
        toggleSkyboxBtn.setAttribute('aria-pressed', String(environmentEnabled));
    }

    if (toggleAutoRotateBtn && controlledModelViewer) {
        const autoRotateEnabled = controlledModelViewer.hasAttribute('auto-rotate');
        toggleAutoRotateBtn.textContent = autoRotateEnabled ? labels.disableAutoRotate : labels.enableAutoRotate;
        toggleAutoRotateBtn.setAttribute('aria-pressed', String(autoRotateEnabled));
    }
}

function pauseModelAutoRotate() {
    if (!controlledModelViewer?.hasAttribute('auto-rotate')) return;

    controlledModelViewer.removeAttribute('auto-rotate');
    updateModelControlButtons();
}

function prepareModelForFocusedView() {
    pauseModelAutoRotate();

    // Auto-rotate uses a separate turntable angle that cameraOrbit does not reset.
    if (typeof controlledModelViewer?.resetTurntableRotation === 'function') {
        controlledModelViewer.resetTurntableRotation(0);
    }
}

// Let AI camera actions follow the same behavior as local hotspot clicks.
window.pauseModelAutoRotate = pauseModelAutoRotate;
window.prepareModelForFocusedView = prepareModelForFocusedView;

if (toggleSkyboxBtn && modelWrapper) {
    toggleSkyboxBtn.addEventListener('click', () => {
        modelWrapper.classList.toggle('with-skybox');
        updateModelControlButtons();
    });
}

if (toggleAnchorsBtn && modelWrapper) {
    toggleAnchorsBtn.addEventListener('click', () => {
        modelWrapper.classList.toggle('hide-anchors');
        updateModelControlButtons();
    });
}

if (toggleAutoRotateBtn && controlledModelViewer) {
    toggleAutoRotateBtn.addEventListener('click', () => {
        controlledModelViewer.toggleAttribute('auto-rotate');
        updateModelControlButtons();
    });
}

if (resetModelBtn && controlledModelViewer) {
    resetModelBtn.addEventListener('click', () => {
        // Reset both the camera and any turntable rotation created by auto-rotate.
        prepareModelForFocusedView();

        controlledModelViewer.cameraTarget = 'auto auto auto';
        controlledModelViewer.cameraOrbit = window.appConfig?.aiConfig?.actions?.default_view || '0deg 80deg 1.4m';
        controlledModelViewer.fieldOfView = 'auto';
        if (typeof controlledModelViewer.jumpCameraToGoal === 'function') {
            controlledModelViewer.jumpCameraToGoal();
        }
        updateModelControlButtons();
    });
}

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
