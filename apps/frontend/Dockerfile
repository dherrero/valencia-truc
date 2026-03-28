FROM docker.io/node:lts as builder
WORKDIR /app

COPY . .
ENV NX_DAEMON=false
RUN npm ci
RUN npx nx build @valencia-truc/frontend --skip-nx-cache

FROM docker.io/nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
