# ETAPA 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Habilitamos Yarn correctamente 
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copiamos los archivos de Yarn 
COPY package.json yarn.lock ./

# Instalación limpia usando el lockfile de Yarn 
RUN yarn install

# ETAPA 2: Construcción
FROM node:20-alpine AS builder
WORKDIR /app

# Habilitamos Yarn aquí también para el comando build
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declaramos los ARG con el guion bajo inicial (estándar de Cloud Build)
ARG _NEXT_PUBLIC_API_URL
ARG _NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ARG _NEXT_PUBLIC_NETWORK
ARG _NEXT_PUBLIC_API_FIREBASE
ARG _NEXT_PUBLIC_API_FIREBASE_APP_ID

# Los asignamos a las variables que Next.js leerá en el build
ENV NEXT_PUBLIC_API_URL=$_NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_THIRDWEB_CLIENT_ID=$_NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ENV NEXT_PUBLIC_NETWORK=$_NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_API_FIREBASE=$_NEXT_PUBLIC_API_FIREBASE
ENV NEXT_PUBLIC_API_FIREBASE_APP_ID=$_NEXT_PUBLIC_API_FIREBASE_APP_ID
ENV NEXT_TELEMETRY_DISABLED=1


RUN yarn build

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