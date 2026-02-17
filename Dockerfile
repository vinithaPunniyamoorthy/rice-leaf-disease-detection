FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code (env vars come from Railway Dashboard, not .env file)
COPY backend/server.js ./
COPY backend/src/ ./src/

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
