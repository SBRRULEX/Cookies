# Use official Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ .

# Install puppeteer dependencies (important for headless chrome)
RUN apt-get update && \
    apt-get install -y chromium && \
    npm install puppeteer

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose port
EXPOSE 3000

CMD ["node", "index.js"]
