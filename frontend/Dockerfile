# Frontend Dockerfile for 2DTanks
FROM node:20-alpine AS builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY frontend ./
COPY server/src /app/server/src

# Сборка: API и WS через nginx (:5173), без прямого обращения к :3000 из браузера
ARG GAME_API_ORIGIN=
ARG GAME_WS_PATH=/game
ENV GAME_API_ORIGIN=${GAME_API_ORIGIN}
ENV GAME_WS_PATH=${GAME_WS_PATH}

# Build the application
RUN npm run build-prod

# Production stage
FROM nginx:alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built files to nginx
COPY --from=builder /app/frontend/src/js /usr/share/nginx/html/src/js
COPY --from=builder /app/frontend/src/img /usr/share/nginx/html/src/img
COPY --from=builder /app/frontend/src/audio /usr/share/nginx/html/src/audio
COPY --from=builder /app/frontend/src/index.css /usr/share/nginx/html/src/
COPY --from=builder /app/frontend/index.html /usr/share/nginx/html/
COPY --from=builder /app/frontend/manifest.webmanifest /usr/share/nginx/html/
COPY --from=builder /app/frontend/sw.js /usr/share/nginx/html/

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
