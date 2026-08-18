# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build and run backend
FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Environment variables (override in Railway/production)
ENV PORT=3001 \
    NODE_ENV=production \
    JWT_SECRET=minume_secret_key_2026 \
    JWT_EXPIRES_IN=24h \
    DB_HOST=localhost \
    DB_PORT=3306 \
    DB_USER=root \
    DB_PASSWORD= \
    DB_NAME=minume_xvii \
    FRONTEND_URL=*

EXPOSE 3001
CMD ["npm", "start"]