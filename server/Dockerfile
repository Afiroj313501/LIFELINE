# ==========================================
# LifeLine Backend — Multi-Stage Dockerfile
# ==========================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install system utilities needed for building native modules
RUN apk add --no-cache openssl libc6-compat

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy application source code
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client & Compile TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine compatibility in Alpine
RUN apk add --no-cache openssl libc6-compat curl

# Install production-only dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist

# Use non-root node user for container security
USER node

EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
