# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy entire repo contents
COPY . .

# Install backend dependencies
RUN cd backend && npm install

# Expose port
EXPOSE 3000

# Start the backend server
CMD ["node", "backend/index.js"]
