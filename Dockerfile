FROM node:20-slim

WORKDIR /app

# Copy package files first (caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create auth directory  
RUN mkdir -p /app/shana_auth

EXPOSE 8080

CMD ["node", "index.js"]
