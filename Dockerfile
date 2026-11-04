FROM node:24.21.0-alpine

WORKDIR /app/board-server

COPY board-server/package*.json ./
RUN npm ci --omit=dev --include=optional

COPY board-server/ ./
COPY trainers/board-compat.json /app/trainers/board-compat.json
COPY learning/ /app/learning/
COPY assistant-service/package.json /app/assistant-service/package.json
COPY assistant-service/public/practice-core.js /app/assistant-service/public/practice-core.js
COPY ege-baza/path/ /app/ege-baza/path/
COPY trainers/oge-basics/ /app/trainers/oge-basics/
COPY trainers/motion-grade6/ /app/trainers/motion-grade6/
COPY courses/vilenkin-6-part-1/math.js courses/vilenkin-6-part-1/learning-contracts.js /app/courses/vilenkin-6-part-1/
COPY courses/vilenkin-6-part-1/data/ /app/courses/vilenkin-6-part-1/data/
COPY courses/vilenkin-6-part-1/textbook-math.js courses/vilenkin-6-part-1/textbook-learning-contracts.js /app/courses/vilenkin-6-part-1/
COPY courses/vilenkin-6-part-1/textbook-source-labels.js courses/vilenkin-6-part-1/textbook-support.js courses/vilenkin-6-part-1/textbook-support.css /app/courses/vilenkin-6-part-1/
COPY courses/vilenkin-6-part-1/textbook-data/ /app/courses/vilenkin-6-part-1/textbook-data/
COPY geometry-course/textbook/learning-contracts.js /app/geometry-course/textbook/learning-contracts.js
COPY geometry-course/textbook/assets/math-text.js geometry-course/textbook/assets/planar-viewer.js /app/geometry-course/textbook/assets/

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
