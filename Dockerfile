FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create auth directory
RUN mkdir -p /app/shana_auth

EXPOSE 3000

CMD ["node", "index.js"]
