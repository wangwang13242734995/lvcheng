# ============== Stage 1: Dependencies ==============
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ============== Stage 2: Build ==============
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production build: disable NextAuth URL check at build time
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="file:./dev.db"
ENV NEXTAUTH_SECRET="build-time-secret-not-used-at-runtime-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ============== Stage 3: Runtime ==============
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# SQLite needs writeable storage (kept inside container for standalone deploy demo,
# swap this out for a DATABASE_URL to Postgres in Sealos/Vercel)
ENV DATABASE_URL="file:./data/dev.db"
ENV NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-dev-secret-change-in-production-abc123xyz}"

RUN apk add --no-cache openssl tini

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Make sure /app/data exists so SQLite db file can be created
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 8080

# Use tini as init so SIGTERM is handled cleanly
ENTRYPOINT ["/sbin/tini", "--"]

# Next.js production server: start + run migrations on boot
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma generate && exec node node_modules/next/dist/bin/next start -p 8080 -H 0.0.0.0"]
