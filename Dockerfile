# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files to install dependencies
COPY package*.json ./

# Install project dependencies
RUN npm ci

# Copy the rest of your application code
COPY . .

# Build TypeScript 
RUN npm run build

# Production stage 
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user 
RUN addgroup -g 1001 -S nodejs && \ 
    adduser -S appuser -u 1001

# Copy only production dependencies 
COPY package*.json ./ 
RUN npm ci --only=production && npm cache clean --force 

# Copy compiled app from builder 
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist

# Switch to non-root user 
USER appuser 

EXPOSE 3001 
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \ CMD wget -qO- http://localhost:3001/health || exit 1 

CMD ["node", "dist/server.js"]

