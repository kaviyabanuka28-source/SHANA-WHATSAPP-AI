FROM node:18-slim
# Chromium සහ අවශ්‍ය ෆොන්ට්ස් ස්ථාපනය කරන්න
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    --no-install-recommends

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
