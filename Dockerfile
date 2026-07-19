FROM node:18-slim

# git සහ chromium අවශ්‍ය දේ ස්ථාපනය කිරීම
RUN apt-get update && apt-get install -y \
    git \
    chromium \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    --no-install-recommends

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
