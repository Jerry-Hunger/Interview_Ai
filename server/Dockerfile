FROM node:24-bookworm-slim

WORKDIR /app

# 与宿主机 ~/.npmrc 保持一致，corepack 及 pnpm 均走国内镜像，避免直连 npmjs.org 被重置。
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com \
    npm_config_registry=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml ./
# 显式写入 pnpm 配置；仅设置 COREPACK_NPM_REGISTRY 不会改变依赖包下载源。
RUN corepack enable \
    && pnpm config set registry https://registry.npmmirror.com \
    && pnpm config set network-concurrency 8 \
    && pnpm config set fetch-retries 5 \
    && pnpm install --frozen-lockfile --prod

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/index.js"]
