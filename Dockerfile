# Use Node.js 18 Alpine
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy ONLY application code (never copy .env or config/local.env)
COPY src/ ./src/
COPY config/validate.js ./config/validate.js
COPY deploy-commands.js ./

# Verify no secrets were copied
RUN test ! -f config/local.env && test ! -f .env || (echo "ERROR: Secrets detected in image!" && exit 1)

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the bot
CMD ["node", "src/bot.js"]
