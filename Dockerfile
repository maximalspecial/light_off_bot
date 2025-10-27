FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm ci
COPY . .
RUN npm run build

CMD ["bash", "-lc", "node dist/src/bot.js & while true; do node dist/src/parser.js; node dist/src/scheduler.js; sleep 60; done"]
