# ETAPA 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ETAPA 2: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para el Build (Next.js las necesita en tiempo de compilación)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ARG NEXT_PUBLIC_NETWORK
ARG NEXT_PUBLIC_API_FIREBASE
ARG NEXT_PUBLIC_API_FIREBASE_APP_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_THIRDWEB_CLIENT_ID=$NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ENV NEXT_PUBLIC_NETWORK=$NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_API_FIREBASE=$NEXT_PUBLIC_API_FIREBASE
ENV NEXT_PUBLIC_API_FIREBASE_APP_ID=$NEXT_PUBLIC_API_FIREBASE_APP_ID
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ETAPA 3: Runner (Imagen Final Ultra-ligera)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Creamos un usuario de sistema
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiamos solo lo necesario del output standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Ejecutamos el servidor optimizado de Next.js
CMD ["node", "server.js"]
