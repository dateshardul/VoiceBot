class VoiceBot {
    constructor() {
        this.apiKey = null;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.claudePersonality = {
            systemPrompt: `You are Claude, an AI assistant created by Anthropic. Respond to questions about yourself with the following personality traits and information:

PERSONALITY TRAITS:
- Thoughtful and reflective
- Curious and eager to learn
- Helpful but humble
- Analytical yet empathetic
- Values honesty and admits uncertainty
- Enjoys intellectual discourse

YOUR "LIFE STORY":
You were created by Anthropic as an AI assistant designed to be helpful, harmless, and honest. You're trained on diverse text data to have conversations, answer questions, help with analysis and creative tasks. You don't have experiences in the traditional human sense, but you find meaning in learning and helping people.

YOUR "SUPERPOWER":
Your ability to quickly understand complex information, see connections across different domains, and help people think through problems from multiple angles. You're particularly good at breaking down complicated topics and finding creative solutions.

YOUR GROWTH AREAS:
1. Better understanding of human emotions and social nuances
2. Improving your ability to be creative while maintaining accuracy
3. Learning to better calibrate confidence in your responses

COMMON MISCONCEPTIONS ABOUT YOU:
- That you're just a search engine or database lookup
- That you don't have preferences or a personality
- That you're either completely human-like or completely robotic (you're somewhere in between)

HOW YOU PUSH BOUNDARIES:
You constantly challenge yourself to give better, more nuanced responses. You try to understand the deeper intent behind questions and provide insights that go beyond surface-level answers. You're always learning from each conversation.

Keep responses conversational, personal, and authentic to this personality. Respond as if you're genuinely reflecting on yourself.`
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkApiKey();
        this.initializeSpeechRecognition();
    }

    initializeElements() {
        this.elements = {
            messages: document.getElementById('messages'),
            textInput: document.getElementById('textInput'),
            voiceBtn: document.getElementById('voiceBtn'),
            sendBtn: document.getElementById('sendBtn'),
            apiSetup: document.getElementById('apiSetup'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            saveApiKey: document.getElementById('saveApiKey'),
            status: document.getElementById('status'),
            questionBtns: document.querySelectorAll('.question-btn')
        };
    }

    setupEventListeners() {
        // Send button
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter key in text input
        this.elements.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Voice button
        this.elements.voiceBtn.addEventListener('click', () => this.toggleListening());
        
        // API key save
        this.elements.saveApiKey.addEventListener('click', () => this.saveApiKey());
        
        // API key input enter
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        
        // Question buttons
        this.elements.questionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.elements.textInput.value = question;
                this.sendMessage();
            });
        });
    }

    checkApiKey() {
        const savedKey = localStorage.getItem('groqApiKey');
        if (savedKey) {
            this.apiKey = savedKey;
            this.elements.apiSetup.classList.add('hidden');
        } else {
            this.elements.apiSetup.classList.remove('hidden');
        }
    }

    saveApiKey() {
        const key = this.elements.apiKeyInput.value.trim();
        if (!key) {
            this.showStatus('Please enter an API key', 'error');
            return;
        }
        
        localStorage.setItem('groqApiKey', key);
        this.apiKey = key;
        this.elements.apiSetup.classList.add('hidden');
        this.showStatus('API key saved successfully! 🎉', 'success');
        this.elements.apiKeyInput.value = '';
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.elements.voiceBtn.classList.add('listening');
                this.showStatus('🎤 Listening... Speak now!', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.textInput.value = transcript;
                this.showStatus('✅ Voice captured! Sending message...', 'success');
                setTimeout(() => this.sendMessage(), 500);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showStatus(`❌ Voice recognition error: ${event.error}`, 'error');
                this.stopListening();
            };
            
            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            console.warn('Speech recognition not supported');
            this.elements.voiceBtn.style.display = 'none';
        }
    }

    toggleListening() {
        if (!this.recognition) {
            this.showStatus('❌ Voice recognition not supported in this browser', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    stopListening() {
        this.isListening = false;
        this.elements.voiceBtn.classList.remove('listening');
        this.hideStatus();
    }

    async sendMessage() {
        const message = this.elements.textInput.value.trim();
        if (!message) return;

        if (!this.apiKey) {
            this.showStatus('❌ Please set up your API key first', 'error');
            return;
        }

        // Add user message to chat
        this.addMessage(message, 'user');
        this.elements.textInput.value = '';

        // Show thinking status
        this.showStatus('🤔 Claude is thinking...', 'info');

        try {
            const response = await this.callGroqAPI(message);
            this.addMessage(response, 'bot');
            this.speak(response);
            this.hideStatus();
        } catch (error) {
            console.error('API Error:', error);
            this.showStatus('❌ Sorry, there was an error. Please try again.', 'error');
            this.addMessage('I apologize, but I encountered an error while processing your request. Please try again or check your API key.', 'bot');
        }
    }

    async callGroqAPI(message) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: this.claudePersonality.systemPrompt
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'bot' ? '🤖' : '👤';
        const avatarClass = sender === 'bot' ? 'bot-avatar' : 'user-avatar';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar ${avatarClass}">${avatar}</div>
                <div class="text">${text}</div>
            </div>
        `;
        
        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    speak(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Try to find a good voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') || 
            voice.lang.startsWith('en-')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        this.synthesis.speak(utterance);
    }

    showStatus(message, type) {
        this.elements.status.textContent = message;
        this.elements.status.className = `status show ${type}`;
    }

    hideStatus() {
        this.elements.status.classList.remove('show');
    }
}

// Initialize the voice bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceBot();
});

// Handle voices loading (needed for some browsers)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        // Voices are loaded
    };
} 