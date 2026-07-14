FROM node:18-bullseye-slim

# Install dependencies for Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies install කරන්න
COPY package.json ./
RUN npm install

# කෝඩ් එක copy කරන්න
COPY . .

# Environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Node path එක හරියටම දීම
ENV PATH="/usr/local/bin:${PATH}"

CMD ["node", "node.js"]
