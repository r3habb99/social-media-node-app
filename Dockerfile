# Stage 1: Build the application
FROM node:20-alpine3.20@sha256:76bacbf09e7a2a999b5cf058c3d543216919f7dad9b00ae040cc9c39635fcc65 AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json tsconfig.json ./

# Use npm ci for more reliable builds and update npm to fix vulnerabilities
RUN apk update && \
    apk upgrade && \
    npm install -g npm@latest && \
    npm ci

# Copy only necessary source files
COPY src/ ./src/
COPY public/ ./public/

# Build TypeScript
RUN npm run build

# Stage 2: Production image
# Use the same specific version as the builder for consistency
FROM node:20-alpine3.20@sha256:76bacbf09e7a2a999b5cf058c3d543216919f7dad9b00ae040cc9c39635fcc65

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only with npm ci and update system packages
RUN apk update && \
    apk upgrade && \
    # Add curl for healthcheck (smaller than wget)
    apk --no-cache add curl && \
    # Update npm to fix vulnerabilities
    npm install -g npm@latest && \
    npm ci --only=production && \
    # Create uploads directory with proper permissions
    mkdir -p /app/uploads && \
    chown node:node /app/uploads

# Copy built JavaScript files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Define a volume for uploads
VOLUME /app/uploads

# Set environment variables
ENV NODE_ENV=production \
    PORT=5050 \
    HOST=0.0.0.0

# Add healthcheck using curl instead of wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

# Security: Add security-related options
# Set npm log level to reduce output
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Switch to non-root user
USER node

# Expose port 5050
EXPOSE 5050

# Start the application
CMD ["node", "dist/server.js"]
