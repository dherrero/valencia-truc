FROM docker.io/node:lts as builder
WORKDIR /app

COPY . .
ENV NX_DAEMON=false
RUN npm ci
RUN npx nx build @valencia-truc/backend --skip-nx-cache

FROM docker.io/node:lts-slim
WORKDIR /app
COPY . .
RUN npm ci --omit=dev

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3333
CMD ["node", "apps/backend/dist/main.js"]
