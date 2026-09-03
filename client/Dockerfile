FROM node:24-bookworm-slim AS build

WORKDIR /app

# pnpm 的构建脚本白名单位于工作区配置中，需在安装依赖前复制进镜像。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . ./
RUN pnpm build

FROM nginx:1.27-alpine

# 官方 Nginx 镜像会在启动时将模板中的环境变量替换为实际配置。
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
