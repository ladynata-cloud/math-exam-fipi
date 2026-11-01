FROM node:24.21.0-alpine
WORKDIR /app/assistant-service
COPY --chown=node:node assistant-service/package.json assistant-service/release.json ./
COPY --chown=node:node assistant-service/src/ ./src/
COPY --chown=node:node assistant-service/knowledge/ ./knowledge/
COPY --chown=node:node assistant-service/public/ ./public/
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV ASSISTANT_MODE=offline
ENV ASSISTANT_DB_PATH=/data/assistant.sqlite
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "src/server.js"]
