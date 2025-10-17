const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');

let uploadedFile = null;
let sessionId = null; // Track conversation session
const API_URL = 'http://127.0.0.1:8000'; // FastAPI backend URL

// Check API connection on load
async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('API Health:', data);
        if (!data.vectorstore_loaded) {
            addMessage('⚠️ Warning: Knowledge base not fully loaded. Responses may be limited.', 'bot');
        }
    } catch (error) {
        console.error('API connection failed:', error);
        addMessage('⚠️ Warning: Cannot connect to the AI backend. Please ensure the server is running at http://127.0.0.1:8000', 'bot');
        addMessage('Run: python server.py', 'bot');
    }
}

// Check connection when page loads
setTimeout(checkAPIConnection, 1000);

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Call the FastAPI backend
        const botResponse = await getBotResponseFromAPI(message);
        removeTypingIndicator(typingIndicator);
        addMessage(botResponse, 'bot');
    } catch (error) {
        removeTypingIndicator(typingIndicator);
        console.error('API Error:', error);
        addMessage('⚠️ Sorry, I cannot reach the AI backend. Please ensure:\n1. The server is running (python server.py)\n2. The server is accessible at http://127.0.0.1:8000\n3. CORS is properly configured', 'bot');
    }
}

async function getBotResponseFromAPI(userMessage) {
    try {
        const response = await fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: userMessage,
                session_id: sessionId
            }),
            mode: 'cors'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Store session ID for conversation continuity
        if (data.session_id) {
            sessionId = data.session_id;
        }
        
        return data.answer || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Failed to get response from API:', error);
        throw error;
    }
}

function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message typing-indicator';
    messageDiv.id = 'typing-indicator';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    let formattedText;
    
    if (sender === 'bot') {
        // Parse Markdown for bot messages
        try {
            // Configure marked options
            marked.setOptions({
                breaks: true,        // Convert \n to <br>
                gfm: true,          // GitHub Flavored Markdown
                headerIds: false,   // Don't add IDs to headers
                mangle: false       // Don't escape autolinked email addresses
            });
            
            formattedText = marked.parse(text);
        } catch (error) {
            console.error('Markdown parsing error:', error);
            // Fallback to simple formatting
            formattedText = text.replace(/\n/g, '<br>');
        }
    } else {
        // Simple formatting for user messages
        formattedText = text.replace(/\n/g, '<br>');
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            ${formattedText}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// File upload
fileInput.addEventListener('change', handleFileUpload);

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--primary)';
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--border)';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    uploadedFile = file;
    addMessage(`📄 Uploaded: ${file.name}`, 'user');
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    // Simulate file processing and ask the bot about resume analysis
    setTimeout(async () => {
        removeTypingIndicator(typingIndicator);
        addMessage(`Great! I've received your resume "${file.name}". Let me analyze it for you... ⚙️`, 'bot');
        
        // Ask the knowledge base about resume best practices
        const analysisPrompt = `I have uploaded a resume for a ${getAssumedRole(file.name)}. 
            Please provide a comprehensive analysis including:
            1. Key skills that should be highlighted
            2. Experience level recommendations
            3. Specific suggestions for improvement
            4. Industry best practices for this role`;
        
        try {
            const typingIndicator2 = addTypingIndicator();
            const analysis = await getBotResponseFromAPI(analysisPrompt);
            removeTypingIndicator(typingIndicator2);
            addMessage(`📊 Resume Analysis Complete!\n\n${analysis}`, 'bot');
        } catch (error) {
            console.error('Resume analysis error:', error);
            addMessage('⚠️ Sorry, I encountered an error analyzing your resume. Please ensure the backend is running and try asking specific questions about resume improvement.', 'bot');
        }
    }, 1000);
}

function getAssumedRole(filename) {
    // Simple heuristic - you could enhance this
    const lower = filename.toLowerCase();
    if (lower.includes('data') && lower.includes('scientist')) return 'Data Scientist';
    if (lower.includes('data') && lower.includes('engineer')) return 'Data Engineer';
    if (lower.includes('data') && lower.includes('analyst')) return 'Data Analyst';
    if (lower.includes('software') || lower.includes('developer')) return 'Software Engineer';
    if (lower.includes('ux') || lower.includes('designer')) return 'UX Designer';
    return 'Software Engineer'; // default
}

function logout() {
    window.location.href = 'index.html';
}
