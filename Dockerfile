# The AIgnc - Dockerfile
# Multi-stage build for Node.js application

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
