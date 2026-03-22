# ETAPA 1: Dependencias
FROM node:22-slim AS deps
WORKDIR /app
# Corepack es excelente para Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
# Instalamos TODO para el build, pero luego limpiaremos
RUN yarn install --frozen-lockfile

# ETAPA 2: Runner (Imagen Final)
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Cloud Run inyecta PORT automáticamente, pero dejar 8080 como default es buena práctica
ENV PORT=8080 

COPY --from=deps /app/node_modules ./node_modules
COPY . . 

# Permisos para la carpeta de credenciales si tus agentes generan archivos temporales
#RUN mkdir -p ./credentials && chown -R node:node ./credentials

EXPOSE 8080
USER node

# Usas --experimental-strip-types, lo cual es genial para Node 22 + TS
CMD ["node", "--experimental-strip-types", "index.js"]
