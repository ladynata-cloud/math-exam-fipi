FROM node:24.21.0-alpine

WORKDIR /app/board-server

COPY board-server/package*.json ./
RUN npm ci --omit=dev --include=optional

COPY board-server/ ./
COPY trainers/board-compat.json /app/trainers/board-compat.json
COPY learning/ /app/learning/
COPY ege-baza/path/ /app/ege-baza/path/
COPY trainers/oge-basics/ /app/trainers/oge-basics/

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV PROGRESS_STORE_PATH=/data/progress.json
ENV GROUP_LESSON_STORE_DIR=/data/group-lessons
ENV LEARNING_DB_PATH=/data/learning.sqlite
ENV LEARNING_PUBLIC_ORIGIN=https://mathexam-board-ladynata.amvera.io
ENV LEARNING_TRAINER_ORIGIN=https://mathexam.space

VOLUME ["/data"]

EXPOSE 3000

CMD ["npm", "start"]
