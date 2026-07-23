FROM node:20-slim

# Install git (required for @whiskeysockets/baileys)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create auth directory
RUN mkdir -p /app/shana_auth

EXPOSE 8080

CMD ["node", "index.js"]
