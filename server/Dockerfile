# Server Dockerfile for 2DTanks
FROM node:20-alpine

WORKDIR /app

# Install netcat for healthcheck
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY sql ./sql

# Build TypeScript
RUN npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose WebSocket port
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

