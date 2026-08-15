# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL

RUN npm ci
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
# Next.js standalone server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets aren't included in the standalone directory.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install only Prisma CLI for migrations.
COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-save prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.js"]