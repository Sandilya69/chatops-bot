# 🐳 Docker Deployment Guide

This guide explains how to run the ChatOps bot using Docker.

---

## 📋 Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- Environment variables configured in `config/local.env`

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Build and start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

### Option 2: Docker CLI

```bash
# Build the image
docker build -t chatops-bot .

# Run the container
docker run -d \
  --name chatops-bot \
  --env-file config/local.env \
  -p 3000:3000 \
  chatops-bot

# View logs
docker logs -f chatops-bot

# Stop the container
docker stop chatops-bot
docker rm chatops-bot
```

---

## 🔧 Development Mode

For development with hot reload:

```bash
# Start with volume mounts
docker-compose up

# The src/ directory is mounted, so changes reflect immediately
```

---

## 🏭 Production Deployment

### Build Production Image

```bash
docker build -t chatops-bot:v1.0.0 .
```

### Run in Production

```bash
docker run -d \
  --name chatops-bot \
  --restart unless-stopped \
  --env-file config/local.env \
  -p 3000:3000 \
  chatops-bot:v1.0.0
```

### Push to Registry

```bash
# Tag for registry
docker tag chatops-bot:v1.0.0 your-registry/chatops-bot:v1.0.0

# Push to registry
docker push your-registry/chatops-bot:v1.0.0
```

---

## 🔍 Verification

### Check Container Status

```bash
docker ps
```

### Check Health

```bash
docker inspect --format='{{.State.Health.Status}}' chatops-bot
```

### View Logs

```bash
# All logs
docker logs chatops-bot

# Follow logs
docker logs -f chatops-bot

# Last 100 lines
docker logs --tail 100 chatops-bot
```

### Test Bot Connection

1. Check Discord - bot should show as "Online"
2. Run `/ping` command
3. Check logs for "✅ Connected to MongoDB"

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs chatops-bot

# Common issues:
# - Missing environment variables
# - Invalid MongoDB URI
# - Discord token expired
```

### MongoDB Connection Failed

```bash
# Verify MONGODB_URI in config/local.env
# Ensure MongoDB Atlas allows connections from 0.0.0.0/0
# Check network connectivity
```

### Discord Bot Offline

```bash
# Verify DISCORD_TOKEN is valid
# Check CLIENT_ID matches your application
# Ensure bot has proper permissions
```

### Health Check Failing

```bash
# Check if port 3000 is accessible
curl http://localhost:3000/health

# If using custom port, update Dockerfile EXPOSE and docker-compose ports
```

---

## 📊 Monitoring

### Resource Usage

```bash
# CPU and memory stats
docker stats chatops-bot
```

### Disk Usage

```bash
# Image size
docker images chatops-bot

# Container size
docker ps -s
```

---

## 🔄 Updates

### Update to New Version

```bash
# Pull latest code
git pull

# Rebuild image
docker-compose build

# Restart with new image
docker-compose up -d

# Or with Docker CLI
docker build -t chatops-bot:v1.1.0 .
docker stop chatops-bot
docker rm chatops-bot
docker run -d --name chatops-bot --env-file config/local.env -p 3000:3000 chatops-bot:v1.1.0
```

---

## 🧹 Cleanup

```bash
# Stop and remove container
docker-compose down

# Remove image
docker rmi chatops-bot

# Remove all unused images
docker image prune -a
```

---

## 🌐 Cloud Deployment

### AWS ECS

```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag chatops-bot:latest your-account.dkr.ecr.us-east-1.amazonaws.com/chatops-bot:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/chatops-bot:latest
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/your-project/chatops-bot

# Deploy
gcloud run deploy chatops-bot --image gcr.io/your-project/chatops-bot --platform managed
```

### Azure Container Instances

```bash
# Push to ACR
az acr build --registry yourregistry --image chatops-bot:latest .

# Deploy
az container create --resource-group myResourceGroup --name chatops-bot --image yourregistry.azurecr.io/chatops-bot:latest
```

---

## 📝 Environment Variables

Required in `config/local.env`:

```env
DISCORD_TOKEN=your_discord_token
CLIENT_ID=your_client_id
MONGODB_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
PORT=3000
```

---

## 🎯 Best Practices

1. **Use specific image tags** (not `latest`) in production
2. **Set resource limits** in docker-compose or deployment configs
3. **Use secrets management** (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Enable logging** to external service (CloudWatch, Stackdriver, etc.)
5. **Set up monitoring** (Prometheus, Datadog, etc.)
6. **Implement CI/CD** for automated builds and deployments

---

## 🆘 Support

If you encounter issues:
1. Check logs: `docker logs chatops-bot`
2. Verify environment variables
3. Test MongoDB connection
4. Verify Discord bot permissions
5. Check GitHub token scopes
