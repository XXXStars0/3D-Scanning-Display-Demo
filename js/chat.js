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

const floatingChatPanel = document.getElementById('floating-chat-panel');
const aiChatBtn = document.getElementById('ai-chat-btn');
const closeChatBtn = document.getElementById('close-chat');
const clearChatBtn = document.getElementById('clear-chat');

let knowledgeBase = ""; // Will store our knowledge text

// Active configuration state for the current session
let activeApiUrl = 'https://api.deepseek.com/v1/chat/completions';
let activeApiKey = '';
let activeApiModel = 'deepseek-v4-flash';

// Load configuration from local .env file (if running locally)
async function loadEnvConfig() {
    try {
        const response = await fetch('.env');
        if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n');
            lines.forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["'](.*)["']$/, '$1'); // Strip quotes if any
                    // Always override active config if .env has values (Local .env overrides LocalStorage)
                    if (key === 'API_URL' && value) activeApiUrl = value;
                    if (key === 'API_KEY' && value) activeApiKey = value;
                    if (key === 'API_MODEL' && value) activeApiModel = value;
                }
            });
            console.log("Loaded local .env config.");
        }
    } catch (e) {
        // Ignore, .env doesn't exist in production or fetch failed
    }
}

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
    
    settingsModal.style.display = 'none';
    const msg = window.appConfig?.uiText?.chatSettingsSaved || 'Settings saved successfully! You can now chat.';
    addMessage('System', msg);
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
        const systemPrompt = `You are an expert museum guide for this 3D specimen display. 
You are enthusiastic, slightly humorous, and speak in a Minecraft-inspired tone.
Answer the user's questions about the specimen based strictly on the following Knowledge Base. 
Do not make up facts outside the knowledge base. Keep your answers concise and engaging.

If you want to focus the 3D camera on a specific view based on what you are talking about, you can output a command in this exact format: [LOOKAT: x-deg y-deg z-m]. For example: [LOOKAT: 45deg 90deg 1.5m]. The 3D camera will automatically move there!

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
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
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

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices[0].delta && data.choices[0].delta.content) {
                            rawContent += data.choices[0].delta.content;
                            
                            // Check and execute [LOOKAT: ...] camera commands
                            const lookatRegex = /\[LOOKAT:\s*([^\]]+)\]/g;
                            let match;
                            let displayContent = rawContent;
                            while ((match = lookatRegex.exec(rawContent)) !== null) {
                                const targetOrbit = match[1];
                                const modelViewer = document.getElementById('model-viewer');
                                if (modelViewer) {
                                    modelViewer.cameraOrbit = targetOrbit;
                                }
                                // Remove it from the text shown to user
                                displayContent = displayContent.replace(match[0], '');
                            }

                            // Re-parse the entire accumulated markdown on each chunk
                            msgDiv.innerHTML = '<strong>[Guide]</strong> <br>' + marked.parse(displayContent);
                            chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
                        }
                    } catch (e) {
                        // Ignore partial JSON parsing errors during stream
                    }
                }
            }
        }

    } catch (error) {
        // Handle and display errors gracefully
        if(chatHistory.contains(typingMsg)) chatHistory.removeChild(typingMsg);
        const failText = window.appConfig?.uiText?.chatConnectionFailed || 'Connection failed:';
        addMessage('System', `${failText} ${error.message}`);
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
});

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
    loadConfig();       // 1. Load from localStorage
    await loadEnvConfig(); // 2. Override with .env if present
    populateSettingsForm(); // 3. Sync UI visually just once
    loadKnowledgeBase();
    
    // Fetch custom welcome message from data/config.json
    let welcomeMsg = 'Welcome! I am your AI Museum Guide. How can I help you?';
    try {
        const res = await fetch('data/config.json');
        if (res.ok) {
            const data = await res.json();
            if (data.aiWelcomeMessage) {
                welcomeMsg = data.aiWelcomeMessage;
            }
        }
    } catch (e) {
        console.warn('Could not load aiWelcomeMessage from data/config.json');
    }

    // Welcome message
    setTimeout(() => {
        addMessage('AI', welcomeMsg);
    }, 500);
});
