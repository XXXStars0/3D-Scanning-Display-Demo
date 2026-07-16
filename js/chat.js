/**
 * chat.js
 * Handles the AI Guide chat interface, local storage of API settings,
 * and fetching from an OpenAI-compatible API to provide interactive explanations.
 */

const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiUrlInput = document.getElementById('api-url');
const apiKeyInput = document.getElementById('api-key');
const apiModelInput = document.getElementById('api-model');
const settingsForm = document.getElementById('settings-form');
const resetSettingsBtn = document.getElementById('reset-settings-btn');
const testConnectionBtn = document.getElementById('test-connection-btn');
const connectionStatus = document.getElementById('connection-status');
const aiStatusIndicator = document.getElementById('ai-status-indicator');

const floatingChatPanel = document.getElementById('floating-chat-panel');
const aiChatBtn = document.getElementById('ai-chat-btn');
const closeChatBtn = document.getElementById('close-chat');
const clearChatBtn = document.getElementById('clear-chat');

let knowledgeBase = ""; // Will store our knowledge text

// Active configuration state for the current session
let activeApiUrl = 'https://api.deepseek.com/v1/chat/completions';
let activeApiKey = '';
let activeApiModel = 'deepseek-v4-flash';
let lastVerifiedSignature = '';
let currentAiStatus = 'unconfigured';

function getConfigSignature(url = activeApiUrl, key = activeApiKey, model = activeApiModel) {
    return `${url}\u0000${key}\u0000${model}`;
}

function setAiStatus(state) {
    currentAiStatus = state;
    const labels = {
        unconfigured: window.appConfig?.uiText?.aiStatusUnconfigured || 'AI not configured',
        configured: window.appConfig?.uiText?.aiStatusConfigured || 'AI configured; connection not tested',
        verified: window.appConfig?.uiText?.aiStatusVerified || 'AI connection verified',
        error: window.appConfig?.uiText?.aiStatusError || 'AI connection failed'
    };

    // Update the persistent status shown in the AI Guide header.
    if (aiStatusIndicator) {
        aiStatusIndicator.className = `ai-status-indicator is-${state}`;
        aiStatusIndicator.setAttribute('aria-label', labels[state]);
        aiStatusIndicator.title = labels[state];
    }

    // Update the text status shown when the floating AI icon is hovered.
    const tooltipStatus = document.getElementById('ai-tooltip-status');
    if (tooltipStatus) {
        tooltipStatus.className = `ai-tooltip-status is-${state}`;
        tooltipStatus.textContent = `● ${labels[state]}`;
    }
}

function setConnectionFeedback(state = '', message = '') {
    if (!connectionStatus) return;
    connectionStatus.className = `connection-status${state ? ` is-${state}` : ''}`;
    connectionStatus.textContent = message;
}

function getApiErrorMessage(status) {
    const messages = {
        400: 'The request was invalid. Check the Base URL and model name.',
        401: 'The API key is invalid or expired.',
        402: 'The AI account has insufficient balance or credits.',
        403: 'The API key does not have permission to use this model or service.',
        404: 'The API endpoint or model was not found. Check the Base URL and model name.',
        429: 'The AI service rate limit has been reached. Try again shortly.'
    };
    return messages[status] || `The AI service returned an unexpected error (${status}).`;
}

// The themed icon is recreated by script.js, so apply the latest status again.
window.addEventListener('ai-widget-rendered', () => setAiStatus(currentAiStatus));

// Load configuration from LocalStorage
function loadConfig() {
    const savedUrl = localStorage.getItem('ai_api_url');
    const savedKey = localStorage.getItem('ai_api_key');
    const savedModel = localStorage.getItem('ai_api_model');
    if (savedUrl) activeApiUrl = savedUrl;
    if (savedKey) activeApiKey = savedKey;
    if (savedModel) activeApiModel = savedModel;
}

// Function to populate the modal fields with the current active config
function populateSettingsForm() {
    apiUrlInput.value = activeApiUrl;
    apiKeyInput.value = activeApiKey;
    apiModelInput.value = activeApiModel;
}

// Save configuration to LocalStorage and update active state
function saveConfig() {
    activeApiUrl = apiUrlInput.value.trim();
    activeApiKey = apiKeyInput.value.trim();
    activeApiModel = apiModelInput.value.trim();
    
    localStorage.setItem('ai_api_url', activeApiUrl);
    localStorage.setItem('ai_api_key', activeApiKey);
    localStorage.setItem('ai_api_model', activeApiModel);
    setAiStatus(activeApiKey ? (getConfigSignature() === lastVerifiedSignature ? 'verified' : 'configured') : 'unconfigured');
    
    settingsModal.style.display = 'none';
    const msg = window.appConfig?.uiText?.chatSettingsSaved || 'Settings saved successfully! You can now chat.';
    addMessage('System', msg);
}

async function testConnection() {
    const apiUrl = apiUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const apiModel = apiModelInput.value.trim();

    if (!apiKey) {
        setConnectionFeedback('error', window.appConfig?.uiText?.chatNoApiKey || 'Please enter an API key before testing.');
        return;
    }

    testConnectionBtn.disabled = true;
    setConnectionFeedback('testing', window.appConfig?.uiText?.aiTestingConnection || 'Testing connection…');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [{ role: 'user', content: 'Reply with OK.' }],
                max_tokens: 1,
                temperature: 0,
                stream: false
            })
        });
        if (!response.ok) throw new Error(getApiErrorMessage(response.status));

        lastVerifiedSignature = getConfigSignature(apiUrl, apiKey, apiModel);
        if (lastVerifiedSignature === getConfigSignature()) setAiStatus('verified');
        setConnectionFeedback('success', window.appConfig?.uiText?.aiConnectionSuccess || 'Connection verified. Save this configuration to use it in the guide.');
    } catch (error) {
        if (getConfigSignature(apiUrl, apiKey, apiModel) === getConfigSignature()) setAiStatus('error');
        setConnectionFeedback('error', error instanceof TypeError
            ? (window.appConfig?.uiText?.aiConnectionNetworkError || 'Could not reach the AI service. Check the Base URL, network, and CORS support.')
            : error.message);
    } finally {
        testConnectionBtn.disabled = false;
    }
}

// Fetch knowledge base content
async function loadKnowledgeBase() {
    try {
        const response = await fetch('data/knowledge.md');
        if (response.ok) {
            knowledgeBase = await response.text();
            console.log("AI Knowledge base loaded successfully.");
        } else {
            console.warn("Knowledge base file not found.");
        }
    } catch (e) {
        console.error("Failed to load knowledge base:", e);
    }
}

// Add a message to the chat UI
function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    // Assign specific classes based on sender for styling
    let cssClass = 'system-message';
    if (sender === 'User') cssClass = 'user-message';
    if (sender === 'AI') cssClass = 'ai-message';
    
    msgDiv.className = `chat-message ${cssClass}`;
    
    // Prefix User messages with '>'
    const prefix = sender === 'User' ? '> ' : (sender === 'AI' ? '[Guide] ' : '[System] ');
    msgDiv.textContent = `${prefix}${text}`;
    
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll to bottom
}

// Send message to LLM via API
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Use the active config state
    const apiUrl = activeApiUrl;
    const apiKey = activeApiKey;
    const apiModel = activeApiModel;

    if (!apiKey) {
        const msg = window.appConfig?.uiText?.chatNoApiKey || 'Please configure your API Key in the settings (gear icon) first.';
        addMessage('System', msg);
        settingsModal.style.display = 'block';
        return;
    }

    // Display user's message
    addMessage('User', text);
    chatInput.value = ''; // Clear input field
    
    // Add typing indicator
    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-message ai-message typing';
    const typingText = window.appConfig?.uiText?.chatTyping || 'typing...';
    typingMsg.textContent = `[Guide] ${typingText}`;
    chatHistory.appendChild(typingMsg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        // Construct the System Prompt with the injected Knowledge Base
        const aiPromptAdds = window.appConfig?.aiConfig?.systemPromptAdditions || '';
        const systemPrompt = `You are an expert museum guide for this 3D specimen display. 
You are enthusiastic, slightly humorous, and speak in a Minecraft-inspired tone.
Answer the user's questions about the specimen based strictly on the following Knowledge Base. 
Do not make up facts outside the knowledge base. Keep your answers concise and engaging.
${aiPromptAdds}

--- KNOWLEDGE BASE ---
${knowledgeBase}`;

        // Prepare the API request
        const requestBody = {
            model: apiModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            max_tokens: 300,
            temperature: 0.7,
            stream: true // Enable streaming for typewriter effect
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Bearer token auth
            },
            body: JSON.stringify(requestBody)
        });

        // Remove typing indicator
        if (chatHistory.contains(typingMsg)) chatHistory.removeChild(typingMsg);

        if (!response.ok) {
            throw new Error(getApiErrorMessage(response.status));
        }

        // Create the message container for streaming
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ai-message markdown-body';
        msgDiv.innerHTML = '<strong>[Guide]</strong> ';
        chatHistory.appendChild(msgDiv);

        // Process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let rawContent = ''; // Accumulate the raw markdown
        let streamBuffer = ''; // Preserve an incomplete SSE line between network chunks
        let hitTokenLimit = false;

        const renderAssistantResponse = () => {
            // Check and execute [ACTION: id] camera commands
            const actionRegex = /\[\s*ACTION\s*:\s*([^\]]+)\s*\]/ig;
            let match;
            let displayContent = rawContent;
            while ((match = actionRegex.exec(rawContent)) !== null) {
                const actionId = match[1].trim();
                const modelViewer = document.getElementById('model-viewer');

                if (modelViewer && window.appConfig) {
                    let targetOrbit = null;

                    // 1. Check if action matches a hotspot ID
                    const hotspots = window.appConfig.hotspots || [];
                    const hotspot = hotspots.find(h => h.id === actionId || h.slot === actionId);
                    if (hotspot) {
                        if (hotspot.position) modelViewer.cameraTarget = hotspot.position;
                        if (hotspot.orbit) targetOrbit = hotspot.orbit;
                    }

                    // 2. Check if action matches aiConfig generic actions
                    if (!hotspot && window.appConfig.aiConfig?.actions) {
                        const actionVal = window.appConfig.aiConfig.actions[actionId];
                        if (actionVal) {
                            modelViewer.cameraTarget = 'auto auto auto';
                            targetOrbit = actionVal;
                        }
                    }

                    if (targetOrbit) {
                        modelViewer.cameraOrbit = targetOrbit;
                        modelViewer.fieldOfView = 'auto';
                    }
                }
                displayContent = displayContent.replace(match[0], '');
            }

            msgDiv.innerHTML = '<strong>[Guide]</strong> <br>' + marked.parse(displayContent);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        };

        const processSseLine = (line) => {
            if (!line.startsWith('data: ') || line.trim() === 'data: [DONE]') return;
            try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices?.[0]?.delta?.content;
                if (data.choices?.[0]?.finish_reason === 'length') hitTokenLimit = true;
                if (delta) {
                    rawContent += delta;
                    renderAssistantResponse();
                }
            } catch (error) {
                // A complete but invalid SSE event is ignored; incomplete events stay buffered below.
                console.warn('Ignored malformed AI stream event.', error);
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split(/\r?\n/);
            streamBuffer = lines.pop();
            lines.forEach(processSseLine);
        }

        streamBuffer += decoder.decode();
        if (streamBuffer.trim()) processSseLine(streamBuffer);
        if (hitTokenLimit) {
            const notice = window.appConfig?.uiText?.chatResponseTruncated || 'The AI response reached its length limit. Ask a follow-up question to continue.';
            addMessage('System', notice);
        }
        setAiStatus('verified');

    } catch (error) {
        // Handle and display errors gracefully
        if(chatHistory.contains(typingMsg)) chatHistory.removeChild(typingMsg);
        const failText = window.appConfig?.uiText?.chatConnectionFailed || 'Connection failed:';
        addMessage('System', `${failText} ${error.message}`);
        setAiStatus('error');
    }
}

// Event Listeners for UI interaction
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

settingsBtn.addEventListener('click', () => {
    populateSettingsForm(); // Re-populate with active config to discard any unsaved edits
    settingsModal.style.display = 'block';
});
closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveConfig();
});

resetSettingsBtn.addEventListener('click', () => {
    // Only resets the input fields in the UI. User must click Save to apply.
    apiUrlInput.value = 'https://api.deepseek.com/v1/chat/completions';
    apiKeyInput.value = '';
    apiModelInput.value = 'deepseek-v4-flash';
    setConnectionFeedback();
});

testConnectionBtn.addEventListener('click', testConnection);

// Close settings modal if clicking outside the modal content
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Floating Widget Logic
aiChatBtn.addEventListener('click', () => {
    floatingChatPanel.classList.toggle('hidden');
    if (!floatingChatPanel.classList.contains('hidden')) {
        chatInput.focus();
    }
});

closeChatBtn.addEventListener('click', () => {
    floatingChatPanel.classList.add('hidden');
});

clearChatBtn.addEventListener('click', () => {
    chatHistory.innerHTML = '';
    const msg = window.appConfig?.uiText?.chatCleared || 'Chat cleared! How can I help you?';
    addMessage('AI', msg);
});

// Global function to allow script.js to trigger the AI via Hotspots
window.triggerHotspotAI = function(promptText) {
    // Open chat panel if closed
    if (floatingChatPanel.classList.contains('hidden')) {
        floatingChatPanel.classList.remove('hidden');
    }
    
    // Set input and send
    chatInput.value = promptText;
    sendMessage();
};

// Initialization on load
document.addEventListener('DOMContentLoaded', async () => {
    loadConfig();
    populateSettingsForm();
    setAiStatus(activeApiKey ? 'configured' : 'unconfigured');
    loadKnowledgeBase();
    
    // Fetch custom welcome message from data/ai_config.json
    let welcomeMsg = 'Welcome! I am your AI Museum Guide. How can I help you?';
    try {
        const res = await fetch('data/ai_config.json');
        if (res.ok) {
            const data = await res.json();
            if (data.aiWelcomeMessage) {
                welcomeMsg = data.aiWelcomeMessage;
            }
        }
    } catch (e) {
        console.warn('Could not load aiWelcomeMessage from data/ai_config.json');
    }

    // Welcome message
    setTimeout(() => {
        addMessage('AI', welcomeMsg);
    }, 500);
});
