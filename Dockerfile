# ============== Stage 1: Dependencies ==============
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# --ignore-scripts 跳过 postinstall(prisma generate)，因为 prisma schema 还没 COPY
RUN npm install --legacy-peer-deps --ignore-scripts

# ============== Stage 2: Build ==============
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production build: disable NextAuth URL check at build time
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="build-time-secret-not-used-at-runtime-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1

# 先 COPY 了完整源码，现在可以运行 prisma generate
RUN npx prisma generate
RUN npm run build

# ============== Stage 3: Runtime ==============
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

ENV DATABASE_URL="file:./data/dev.db"
ENV NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-dev-secret-change-in-production-abc123xyz}"

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma generate && exec node node_modules/next/dist/bin/next start -p 8080 -H 0.0.0.0"]
