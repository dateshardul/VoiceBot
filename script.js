class VoiceBot {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.typingInterval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.checkServerHealth();
    }

    initializeElements() {
        this.elements = {
            messages: document.getElementById('messages'),
            textInput: document.getElementById('textInput'),
            voiceBtn: document.getElementById('voiceBtn'),
            sendBtn: document.getElementById('sendBtn'),
            apiSetup: document.getElementById('apiSetup'),
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
        
        // Voice button - primary interaction method
        this.elements.voiceBtn.addEventListener('click', () => {
            if (this.isSpeaking) {
                this.stopSpeaking();
            } else {
                this.toggleListening();
            }
        });
        
        // Question buttons
        this.elements.questionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.elements.textInput.value = question;
                this.sendMessage();
            });
        });

        // Stop speech when clicking anywhere during speech
        document.addEventListener('click', (e) => {
            if (this.isSpeaking && !e.target.closest('.voice-btn')) {
                this.stopSpeaking();
            }
        });
    }

    async checkServerHealth() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                this.elements.apiSetup.classList.add('hidden');
                this.showStatus('🎤 Ready for voice conversation! Click the mic to start.', 'success');
                setTimeout(() => this.hideStatus(), 4000);
            } else {
                throw new Error('Server health check failed');
            }
        } catch (error) {
            console.error('Server health check failed:', error);
            this.showServerError();
        }
    }

    showServerError() {
        this.elements.apiSetup.innerHTML = `
            <div class="api-card">
                <h3>🔧 Server Configuration Required</h3>
                <p>The Claude Voice Bot server needs to be configured:</p>
                <ol>
                    <li>Get a free Groq API key from <a href="https://console.groq.com" target="_blank" rel="noopener">console.groq.com</a></li>
                    <li>Create a <code>.env</code> file in the project root</li>
                    <li>Add: <code>GROQ_API_KEY=your_api_key_here</code></li>
                    <li>Restart the server with <code>npm start</code></li>
                </ol>
                <p class="note">🔒 The API key will be secure on the server - users won't need to enter anything!</p>
            </div>
        `;
        this.elements.apiSetup.classList.remove('hidden');
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
                this.updateVoiceButton();
                this.showStatus('🎤 Listening... Speak your question!', 'info');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.textInput.value = transcript;
                this.showStatus('✅ Got it! Claude is thinking...', 'success');
                setTimeout(() => this.sendMessage(), 500);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showStatus(`❌ Voice error: ${event.error}. Try again!`, 'error');
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
            // Stop any ongoing speech first
            this.stopSpeaking();
            this.recognition.start();
        }
    }

    stopListening() {
        this.isListening = false;
        this.elements.voiceBtn.classList.remove('listening');
        this.updateVoiceButton();
        this.hideStatus();
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.elements.voiceBtn.classList.remove('speaking');
        this.updateVoiceButton();
        
        // Stop typing effect if active
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
    }

    updateVoiceButton() {
        const micIcon = this.elements.voiceBtn.querySelector('.mic-icon');
        if (this.isListening) {
            micIcon.textContent = '🛑';
            this.elements.voiceBtn.title = 'Stop listening';
        } else if (this.isSpeaking) {
            micIcon.textContent = '🔊';
            this.elements.voiceBtn.title = 'Stop speaking';
        } else {
            micIcon.textContent = '🎤';
            this.elements.voiceBtn.title = 'Click to speak';
        }
    }

    async sendMessage() {
        const message = this.elements.textInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.elements.textInput.value = '';

        // Show thinking status
        this.showStatus('🤔 Claude is thinking...', 'info');

        try {
            const response = await this.callBackendAPI(message);
            
            // Create bot message container first
            const botMessageElement = this.addMessage('', 'bot', true);
            const textElement = botMessageElement.querySelector('.text');
            
            // Start speaking and typing simultaneously
            this.speakWithTyping(response, textElement);
            this.hideStatus();
        } catch (error) {
            console.error('API Error:', error);
            this.showStatus('❌ Sorry, there was an error. Please try again.', 'error');
            this.addMessage('I apologize, but I encountered an error while processing your request. Please try again in a moment.', 'bot');
        }
    }

    async callBackendAPI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Server Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.response;
    }

    addMessage(text, sender, isEmpty = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'bot' ? '🤖' : '👤';
        const avatarClass = sender === 'bot' ? 'bot-avatar' : 'user-avatar';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar ${avatarClass}">${avatar}</div>
                <div class="text">${isEmpty ? '' : text}</div>
            </div>
        `;
        
        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        
        return messageDiv;
    }

    speakWithTyping(text, textElement) {
        // Start speech synthesis
        this.speak(text);
        
        // Start typing effect
        this.typeText(text, textElement);
    }

    speak(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.rate = 0.9;
        this.currentUtterance.pitch = 1;
        this.currentUtterance.volume = 0.8;
        
        // Try to find a good voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') || 
            voice.lang.startsWith('en-')
        );
        
        if (preferredVoice) {
            this.currentUtterance.voice = preferredVoice;
        }
        
        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            this.elements.voiceBtn.classList.add('speaking');
            this.updateVoiceButton();
        };
        
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.elements.voiceBtn.classList.remove('speaking');
            this.updateVoiceButton();
            
            // Auto-start listening after response (Gemini-like behavior)
            setTimeout(() => {
                if (!this.isListening) {
                    this.showStatus('🎤 Ready for your next question...', 'info');
                    setTimeout(() => this.hideStatus(), 2000);
                }
            }, 500);
        };
        
        this.currentUtterance.onerror = () => {
            this.isSpeaking = false;
            this.elements.voiceBtn.classList.remove('speaking');
            this.updateVoiceButton();
        };
        
        this.synthesis.speak(this.currentUtterance);
    }

    typeText(text, element) {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
        }
        
        let index = 0;
        const words = text.split(' ');
        
        // Calculate typing speed to roughly match speech
        const wordsPerSecond = 2.5; // Adjust to match speech rate
        const interval = 1000 / wordsPerSecond;
        
        this.typingInterval = setInterval(() => {
            if (index < words.length) {
                const currentText = words.slice(0, index + 1).join(' ');
                element.textContent = currentText;
                
                // Auto-scroll to bottom
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                
                index++;
            } else {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
                // Ensure full text is displayed
                element.textContent = text;
            }
        }, interval);
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