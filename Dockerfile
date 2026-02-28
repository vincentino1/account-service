# Private Nexus Docker registry ARG DOCKER_PRIVATE_REPO
ARG DOCKER_PRIVATE_REPO

# Use Node 18 Alpine image from private Nexus Docker group registry
FROM ${DOCKER_PRIVATE_REPO}/node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy only the dependency files first to optimize Docker caching
COPY package*.json ./

# Copy .npmrc so npm inside Docker can authenticate with the private Nexus registry
COPY .npmrc ./

# Install exact dependency versions from package-lock.json
RUN npm install

# Copy source and build
COPY . .

# Build Angular app 
RUN npm run build 

# Remove npm credentials after build (extra safety)
RUN rm -f .npmrc

# =============================
# Production Stage
# =============================
FROM ${DOCKER_PRIVATE_REPO}/node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Install production dependencies only
COPY package*.json ./

RUN npm install --production

# Copy built app from builder
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

USER appuser

EXPOSE 3001

# Healthcheck without wget dependency
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health',res=>{if(res.statusCode!==200)process.exit(1)}).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
