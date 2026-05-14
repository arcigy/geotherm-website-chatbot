FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:embed

ENV NODE_ENV=production
ENV CHAT_API_HOST=0.0.0.0
ENV CHAT_API_PORT=4317

EXPOSE 4317

CMD ["npm", "run", "start:chat-api"]
