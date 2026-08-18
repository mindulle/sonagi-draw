FROM node:22-bookworm-slim
WORKDIR /app
RUN npm install -g pnpm@9.1.0
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -r build
WORKDIR /app/apps/sync-server
EXPOSE 5858
CMD ["pnpm", "start"]
