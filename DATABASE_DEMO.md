# 📊 MongoDB Database Demo - What Gets Stored

This document shows exactly what data is stored in MongoDB when you deploy via ChatOps.

---

## 🎯 The Evaluator's Question

**"Show me the database. What does your MongoDB store?"**

---

## 📦 Collection: `active_deploys`

Every time you run `/deploy`, a document is created with complete audit trail.

### Example Document (After Running `/deploy service:api env:staging version:main`)

```json
{
  "_id": "65a1b2c3d4e5f6789abcdef0",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  
  // DEPLOYMENT INFO
  "service": "api",
  "env": "staging",
  "version": "main",
  "status": "completed",
  
  // WHO DEPLOYED IT (The Operator)
  "userId": "1234567890123456789",  // Discord User ID
  
  // WHEN
  "startedAt": "2026-01-12T08:45:00.000Z",
  
  // GITHUB WORKFLOW
  "workflowRunId": 19066230916,
  
  // ⭐ THE KEY DATA - ANSWERS "WHO ADDED?" AND "WHAT WAS ADDED?"
  "commitAuthor": "Rituraj Tripathi",
  "commitMessage": "feat: Add Stripe payment gateway integration\n\n- Integrated Stripe SDK\n- Added payment endpoints\n- Updated API documentation",
  "commitSha": "a1b2c3d",
  "commitUrl": "https://github.com/Sandilya69/chatops-bot/commit/a1b2c3d4e5f6"
}
```

---

## 🔍 What This Proves

| Question | Answer | Database Field |
|----------|--------|----------------|
| **Who deployed it?** | Discord User (e.g., @DevOps_Rituraj) | `userId` |
| **Who wrote the code?** | Rituraj Tripathi | `commitAuthor` ⭐ |
| **What was added?** | "Stripe payment gateway integration" | `commitMessage` ⭐ |
| **When was it deployed?** | 2026-01-12 08:45 AM | `startedAt` |
| **Which version?** | Commit `a1b2c3d` | `commitSha` ⭐ |
| **Where was it deployed?** | Staging environment | `env` |
| **What service?** | API service | `service` |
| **Proof link?** | GitHub commit URL | `commitUrl` ⭐ |

---

## 📊 Collection: `command_audits`

Every command execution is logged.

```json
{
  "_id": "65a1b2c3d4e5f6789abcdef1",
  "userId": "1234567890123456789",
  "command": "/deploy",
  "status": "success",
  "timestamp": "2026-01-12T08:45:00.000Z"
}
```

---

## 📊 Collection: `roles`

User permissions for RBAC.

```json
{
  "_id": "65a1b2c3d4e5f6789abcdef2",
  "userId": "1234567890123456789",
  "role": "admin",
  "createdAt": "2026-01-10T10:00:00.000Z"
}
```

---

## 🎭 How to Show This to Evaluator

### Option 1: MongoDB Compass (Visual)

1. Open **MongoDB Compass**
2. Connect to your MongoDB URI
3. Navigate to: `chatops-db` → `active_deploys`
4. Show them a recent document
5. **Point to these fields:**
   - `commitAuthor` - "This is WHO wrote the code"
   - `commitMessage` - "This is WHAT they added"
   - `userId` - "This is WHO deployed it via Discord"

### Option 2: MongoDB Shell (Terminal)

```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Switch to database
use chatops-db

# Show recent deployment with all details
db.active_deploys.findOne({}, {}, {sort: {startedAt: -1}})
```

**Expected Output:**
```javascript
{
  correlationId: 'a1b2c3d4-...',
  service: 'api',
  env: 'staging',
  commitAuthor: 'Rituraj Tripathi',  // ← WHO ADDED
  commitMessage: 'feat: Add Stripe payment gateway...',  // ← WHAT WAS ADDED
  commitSha: 'a1b2c3d',
  userId: '1234567890123456789'  // ← WHO DEPLOYED
}
```

### Option 3: Via Discord Bot (Live Demo)

Create a new command `/audit` to query the database:

```
User: /audit correlation:a1b2c3d4-e5f6-7890-abcd-ef1234567890

Bot: 
📋 **Deployment Audit Trail**
🆔 Correlation: a1b2c3d4-...
🔧 Service: api → staging
👤 Deployed By: @DevOps_Rituraj
✍️ Code Author: Rituraj Tripathi
📝 Changes: "feat: Add Stripe payment gateway integration"
🔗 Commit: a1b2c3d
⏰ Time: 2026-01-12 08:45 AM
✅ Status: completed
```

---

## 🏆 The Complete Data Flow

```
Developer writes code
    ↓
git commit -m "feat: Add payment gateway"
    ↓
git push origin main
    ↓
Discord: /deploy service:api env:staging version:main
    ↓
Bot fetches commit from GitHub API
    ↓
Bot stores in MongoDB:
  - userId (who deployed)
  - commitAuthor (who wrote code)
  - commitMessage (what was added)
  - commitSha (exact version)
    ↓
Bot triggers GitHub Actions
    ↓
Deployment completes
    ↓
Full audit trail stored forever
```

---

## 📸 Screenshot Checklist for Evaluator

Show them these 3 screens:

1. ✅ **Discord Chat** - The `/deploy` command with commit info displayed
2. ✅ **MongoDB Compass** - The `active_deploys` document with `commitAuthor` and `commitMessage`
3. ✅ **GitHub Commit** - The actual commit matching the `commitUrl` in the database

This proves **end-to-end traceability** from code → chat → database → deployment.

---

## 💡 Key Talking Points

**Evaluator:** "How do you know what was deployed?"

**You:** "Sir, every deployment is stored in MongoDB with the exact commit SHA, author name, and commit message. I can show you the database right now."

**Evaluator:** "But how does the data get there?"

**You:** "When I run `/deploy version:main`, the bot automatically calls the GitHub API, fetches the commit metadata, and stores it in MongoDB before deploying. This creates a permanent audit trail."

**Evaluator:** "What if someone deploys the wrong version?"

**You:** "The database has the exact commit SHA and URL. We can trace back to the exact code that was deployed, who wrote it, and who approved the deployment. It's all timestamped."

---

## 🎯 Summary

Your MongoDB stores:
- ✅ **Who deployed** (Discord User ID)
- ✅ **Who wrote the code** (Git commit author)
- ✅ **What was changed** (Commit message)
- ✅ **Exact version** (Commit SHA)
- ✅ **When** (Timestamp)
- ✅ **Where** (Environment)
- ✅ **Proof** (GitHub commit URL)

This is **enterprise-grade audit logging** that satisfies compliance requirements.
