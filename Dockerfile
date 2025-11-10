# -------------------------------
# Base image for dependencies
# -------------------------------
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci


# -------------------------------
# Build stage (if you transpile)
# -------------------------------
# Optional — if your Express project uses Babel/TypeScript
FROM base AS build
ENV NODE_ENV=production
COPY . .
# Remove .env copy - use runtime environment variables instead
RUN npm run build || echo "no build step"
RUN npm prune --production

# -------------------------------
# Production runtime
# -------------------------------
FROM node:18-alpine AS production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S express -u 1001

WORKDIR /app

# Copy only what's needed for runtime
COPY --from=build --chown=express:nodejs /app/package*.json ./
COPY --from=build --chown=express:nodejs /app/node_modules ./node_modules

# Copy application files (adjust paths based on your project structure)
COPY --from=build --chown=express:nodejs /app/src ./src
COPY --from=build --chown=express:nodejs /app/server.js ./server.js

USER express

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', res => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "run", "start:prod"]
