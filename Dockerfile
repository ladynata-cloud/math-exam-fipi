FROM node:20-alpine

WORKDIR /app

COPY board-server/package*.json ./
RUN npm install --omit=dev

COPY board-server/ ./

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]
