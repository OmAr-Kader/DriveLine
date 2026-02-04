# Stage 1: Install and prune dependencies
FROM node:25-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /root/.npm

# Stage 2: Build
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build && \
    cp -r src/common/proto dist/common && \
    rm -rf node_modules src tsconfig*.json

# Stage 3: Production
FROM node:25-alpine

RUN apk add --no-cache nginx tini && \
    rm -rf /var/cache/apk/* /usr/share/man/* /usr/share/doc/* /tmp/*


WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /var/lib/nginx/logs \
    /var/lib/nginx/tmp/client_body \
    /var/lib/nginx/tmp/proxy \
    /var/lib/nginx/tmp/fastcgi \
    /var/lib/nginx/tmp/uwsgi \
    /var/lib/nginx/tmp/scgi && \
    chown -R node:node /var/lib/nginx /var/log/nginx /etc/nginx && \
    chmod -R 755 /var/lib/nginx

COPY package.json ./
COPY router.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

# Create a chained cert (server + CA) so nginx serves the full chain
RUN chmod +x /entrypoint.sh && \
    find node_modules -type f -name "*.md" -delete && \
    find node_modules -type f -name "*.ts" -delete && \
    find node_modules -type f -name "*.map" -delete && \
    find node_modules -depth -type d -name "test" -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -depth -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true

RUN ln -s /usr/local/bin/node /usr/local/bin/node-worker && \
    ln -s /usr/local/bin/node /usr/local/bin/node-webhook && \
    ln -s /usr/local/bin/node /usr/local/bin/node-main

EXPOSE 3000 3001 3002 3003 5672 8080

ENTRYPOINT ["/sbin/tini", "--", "/entrypoint.sh"]