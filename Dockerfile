FROM node:22.14.0-bookworm-slim
WORKDIR /app
COPY backend/runtime ./backend/runtime
COPY miniapp/assets ./miniapp/assets
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4390 ONO_DB=/data/ono.sqlite
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 4390
VOLUME ["/data"]
CMD ["node","backend/runtime/server.mjs"]

