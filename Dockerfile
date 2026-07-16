FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate

ENV PORT=8080
ENV NODE_ENV=development
ENV NEXTAUTH_SECRET="dev-secret-change-in-production-abc123xyz"

EXPOSE 8080

CMD ["npx", "next", "dev", "-p", "8080", "-H", "0.0.0.0"]
