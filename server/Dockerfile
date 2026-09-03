FROM node:24-bookworm-slim

WORKDIR /app

# 与宿主机 ~/.npmrc 保持一致，corepack 及 pnpm 均走国内镜像，避免直连 npmjs.org 被重置。
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com \
    npm_config_registry=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
