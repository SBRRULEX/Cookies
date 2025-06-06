# Use official Node.js LTS image
FROM node:18-bullseye-slim

# Install dependencies needed for puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install deps
COPY backend/package*.json ./
RUN npm install

# Copy backend code
COPY backend/ .

# Expose port
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
