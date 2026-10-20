FROM node:20-alpine
WORKDIR /app

# Установка Python и edge-tts для голосовых сообщений
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --break-system-packages edge-tts

COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "--dns-result-order=ipv4first", "src/bot.js"]