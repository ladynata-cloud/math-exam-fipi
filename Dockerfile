FROM node:20-alpine

WORKDIR /app/board-server

COPY board-server/package*.json ./
RUN npm install --omit=dev

COPY board-server/ ./
COPY trainers/board-compat.json /app/trainers/board-compat.json

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV PROGRESS_STORE_PATH=/data/progress.json

VOLUME ["/data"]

EXPOSE 3000

CMD ["npm", "start"]
