FROM mcr.microsoft.com/playwright:v1.55.0-noble

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    VIDEO_DATA_DIR=/data

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 mathexam \
    && useradd --system --uid 10001 --gid mathexam --create-home mathexam \
    && mkdir -p /app /data \
    && chown -R mathexam:mathexam /app /data

WORKDIR /app
COPY --chown=mathexam:mathexam video-worker/package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY --chown=mathexam:mathexam video-worker/src ./src

USER mathexam
EXPOSE 3000
CMD ["node", "src/server.js"]
