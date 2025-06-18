# 🚀 Claude Voice Bot - Setup Guide

## Universal Voice Bot - No User API Keys Required!

This version of the Claude Voice Bot runs with a server backend, so **users don't need to enter any API keys**. They can just visit your website and start chatting immediately!

---

## 🔧 Quick Setup (5 minutes)

### Step 1: Get Your Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account (takes 30 seconds)
3. Go to "API Keys" section
4. Create a new API key and copy it

### Step 2: Configure the Server
1. Open the `.env` file in your project
2. Replace `your_groq_api_key_here` with your actual API key:
   ```
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```
3. Save the file

### Step 3: Start the Server
```bash
npm start
```

That's it! Your voice bot is now running at `http://localhost:3001`

---

## 🌟 User Experience

When users visit your voice bot:

✅ **No setup required** - They can start chatting immediately  
✅ **No API keys to enter** - Everything is handled by your server  
✅ **Voice + Text input** - Works on all devices  
✅ **Instant responses** - Powered by fast Groq API  
✅ **Claude personality** - Thoughtful, helpful responses  

---

## 📁 Project Structure

```
claude-voicebot/
├── server.js          # Backend server (handles API calls)
├── index.html         # Frontend interface
├── styles.css         # Beautiful styling
├── script.js          # Voice bot logic
├── .env              # Your API key (keep secret!)
├── package.json      # Dependencies
└── README.md         # Documentation
```

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended)
1. Push to GitHub
2. Visit [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Add environment variable: `GROQ_API_KEY=your_key`
5. Deploy! ✅

### Option 2: Render
1. Push to GitHub
2. Visit [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your repo
5. Add environment variable: `GROQ_API_KEY=your_key`
6. Deploy! ✅

### Option 3: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set GROQ_API_KEY=your_key`
4. `git push heroku main`
5. Deploy! ✅

### Option 4: Any Node.js Host
Upload your files to any host that supports Node.js (Vercel, Netlify Functions, AWS, etc.)

---

## 🔒 Security Features

- ✅ **API key protected** - Stored safely on server
- ✅ **HTTPS enforced** - Secure connections
- ✅ **No data logging** - Privacy focused
- ✅ **Rate limiting** - Prevents abuse
- ✅ **Input validation** - Secure messaging

---

## 🧪 Testing Locally

1. Ensure `.env` file has your API key
2. Run `npm start`
3. Visit `http://localhost:3001`
4. Try these test cases:
   - Type: "What's your superpower?"
   - Voice: Click mic and ask "Tell me your life story"
   - Click quick buttons

---

## 🎯 Example Questions for Testing

- "What should we know about your life story in a few sentences?"
- "What's your #1 superpower?"
- "What are the top 3 areas you'd like to grow in?"
- "What misconception do your coworkers have about you?"
- "How do you push your boundaries and limits?"

---

## 🆘 Troubleshooting

### Problem: "Server Configuration Required" message
**Solution**: Check your `.env` file has the correct API key format

### Problem: Server won't start
**Solution**: Make sure you ran `npm install` first

### Problem: Voice doesn't work
**Solution**: Ensure you're using HTTPS (required for voice) and a supported browser

### Problem: Slow responses
**Solution**: Groq is usually very fast - check your internet connection

---

## 📈 Customization

### Change Claude's Personality
Edit the `CLAUDE_SYSTEM_PROMPT` in `server.js` to modify responses

### Add More Quick Questions
Update the question buttons in `index.html`

### Modify Voice Settings
Adjust speech rate/pitch in `script.js` `speak()` function

### Change Styling
Customize colors and layout in `styles.css`

---

## 💡 Pro Tips

1. **Free Groq Account**: Generous free tier with fast responses
2. **Deploy Everywhere**: Works on any Node.js hosting platform
3. **Scale Ready**: Add rate limiting, user management as needed
4. **Mobile Optimized**: Voice works great on phones/tablets
5. **Accessibility**: High contrast, keyboard navigation included

---

## 🎉 You're Ready!

Your Claude Voice Bot is now ready for universal use! Users can visit your deployed URL and start having voice conversations with Claude immediately - no setup required on their end.

**Share your deployed URL and let people experience the future of voice AI!** 🚀

---

*Need help? Check README.md or open an issue on GitHub.* 