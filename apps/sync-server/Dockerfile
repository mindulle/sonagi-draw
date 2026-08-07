FROM node:22-bookworm-slim
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/sync-server/package.json apps/sync-server/
COPY packages/tldraw-schema/package.json packages/tldraw-schema/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -r build
WORKDIR /app/apps/sync-server
EXPOSE 5858
CMD ["pnpm", "start"]
