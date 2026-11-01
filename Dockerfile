# ==============================================================================
# POSKETREN NJ - Backend Multi-Stage Dockerfile (NestJS + Prisma)
# ==============================================================================

# Stage 1: Build & Prisma Generate
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build

# Remove development dependencies to keep image small
RUN npm prune --production

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Add openssl for runtime Prisma engine
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=8080

# Security: Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package*.json ./

EXPOSE 8080

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/src/main"]

