# Manual Testing Guide

## ✅ Bot is Running!

Your bot is currently active and connected to Discord.

---

## 📋 Testing Checklist

### Step 1: Basic Commands

#### Test `/ping`

```
/ping
```

**Expected:** Should reply with "🏓 Pong!" and response time

#### Test `/status`

```
/status
```

**Expected:** Shows current deployment status

#### Test `/metrics`

```
/metrics
```

**Expected:** Shows deployment statistics

---

### Step 2: RBAC Commands

#### Test `/viewroles`

```
/viewroles
```

**Expected:** Lists all users and their roles

#### Test `/addrole`

```
/addrole user:@YourUsername role:developer
```

**Expected:** Adds developer role to user

#### Test `/deleterole`

```
/deleterole user:@YourUsername role:developer
```

**Expected:** Removes developer role from user

---

### Step 3: Core Deployment Feature

#### Test `/deploy`

```
/deploy service:api env:staging version:main
```

**Expected:**

- Shows GitHub commit information (author, message, SHA, URL)
- Creates deployment record in MongoDB
- Triggers GitHub Actions workflow

---

### Step 4: Audit Trail

#### Test `/audit`

```
/audit limit:5
```

**Expected:**

- Shows last 5 deployments
- Displays commit metadata for each
- Shows who deployed, when, and what

---

## 🐛 What to Look For

**For each command, check:**

- ✅ No error messages
- ✅ Response is formatted nicely
- ✅ Data appears correct
- ✅ Response time is reasonable

**Common Issues:**

- ❌ "Unknown interaction" - Command not registered
- ❌ "Missing permissions" - RBAC not configured
- ❌ "GitHub API error" - Token issue
- ❌ "MongoDB error" - Database connection issue

---

## 📝 Report Your Findings

**After testing, tell me:**

1. **Working Commands:** Which ones work perfectly? ✅
2. **Broken Commands:** Which ones have errors? ❌
3. **Bugs Found:** Any unexpected behavior? 🐛
4. **Performance:** Are responses fast enough? ⚡

---

## 🎯 Next Steps

Once all commands work:

1. We'll implement automated tests
2. Add monitoring and metrics
3. Commit the test suite to GitHub
4. Your project reaches 95% expert level!

**Happy Testing! 🚀**
