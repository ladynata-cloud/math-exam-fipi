FROM node:24-alpine
WORKDIR /app
COPY assets/assistant/navigator-data.js assets/assistant/division-dialogue.js ./assets/assistant/
COPY site-assistant/ ./site-assistant/
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
USER node
EXPOSE 8080
CMD ["node", "site-assistant/server.mjs"]
