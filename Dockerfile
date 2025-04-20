# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy source and public directories from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown node:node /app/uploads
VOLUME /app/uploads

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER node

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
