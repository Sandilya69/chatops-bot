# Quick Test Guide

## ✅ Your Bot is Running!

Bot Name: **Chatops Bot#9359**

---

## 🚀 Test These Commands in Discord

### 1. Basic Test

```
/ping
```

Expected: "🏓 Pong!"

---

### 2. Deploy Test

```
/deploy service:chatops-bot env:staging version:main
```

Expected Response:

- Shows commit info (author, message, SHA)
- Triggers GitHub Actions
- Saves to MongoDB

---

### 3. Check Audit Trail

```
/audit limit:5
```

Expected: Shows deployment history

---

## 📸 What to Share With Me

After testing, tell me:

1. **Did /ping work?** (Yes/No)
2. **Did /deploy work?** (Yes/No)
3. **Any error messages?** (Copy/paste them)
4. **What did the bot respond?** (Screenshot or text)

---

## 🐛 Common Issues

**If commands don't appear:**

- Bot might not be in your server
- Commands not registered (run: `npm run deploy:commands`)

**If bot doesn't respond:**

- Check bot is online in Discord
- Check terminal for errors

**If you see errors:**

- Copy the error message
- Share it with me
- I'll help fix it!

---

## 🎯 I'm Here to Help!

Just tell me what's happening and I'll assist! 🚀
