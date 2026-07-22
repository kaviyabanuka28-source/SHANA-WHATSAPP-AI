FROM node:20-slim

# Install dependencies for Chrome (Baileys might need it for some features)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create auth directory with proper permissions
RUN mkdir -p /app/shana_auth && chmod 777 /app/shana_auth

# Expose port (for health checks if needed)
EXPOSE 3000

# Start the bot
CMD ["node", "src/index.js"]
