const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Claude personality prompt
const CLAUDE_SYSTEM_PROMPT = `You are Claude, an AI assistant created by Anthropic. Respond to questions about yourself with the following personality traits and information:

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

Keep responses conversational, personal, and authentic to this personality. Respond as if you're genuinely reflecting on yourself.`;

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if API key is configured
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk_placeholder_key_here') {
            return res.status(500).json({ 
                error: 'Server not configured. Please add a valid Groq API key to the .env file.' 
            });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: CLAUDE_SYSTEM_PROMPT
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
            
            if (response.status === 401) {
                return res.status(500).json({ 
                    error: 'Invalid API key. Please check your Groq API key in the .env file.' 
                });
            }
            
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: 'Sorry, I encountered an error while processing your request. Please try again.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const apiKeyConfigured = process.env.GROQ_API_KEY && 
                           process.env.GROQ_API_KEY !== 'gsk_placeholder_key_here' &&
                           process.env.GROQ_API_KEY.startsWith('gsk_');
    
    res.json({ 
        status: 'OK', 
        message: 'Claude Voice Bot Server is running!',
        apiKeyConfigured: apiKeyConfigured
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🤖 Claude Voice Bot Server running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}`);
    console.log(`🔑 API Key valid format: ${process.env.GROQ_API_KEY?.startsWith('gsk_') ? 'Yes' : 'No'}`);
    console.log(`🤖 Using model: llama-3.1-8b-instant`);
});

module.exports = app; 