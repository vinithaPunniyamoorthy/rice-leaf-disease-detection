FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code (env vars come from Railway Dashboard, not .env file)
COPY backend/server.js ./
COPY backend/src/ ./src/

# Copy Flutter web build (pre-built static files)
COPY backend/public/ ./public/

# Create uploads directory
RUN mkdir -p uploads

# Create entrypoint script that sets MYSQL_URL and Gmail credentials for Railway
RUN printf '#!/bin/sh\n\
if [ -z "$MYSQL_URL" ] && [ -n "$DB_HOST" ]; then\n\
  # Auto-construct MYSQL_URL from individual vars for Railway\n\
  MYSQL_URL="mysql://${DB_USER:-root}:${DB_PASSWORD}@mysql.railway.internal:3306/railway"\n\
  export MYSQL_URL\n\
  echo "[ENTRYPOINT] Set MYSQL_URL from Railway internal networking"\n\
fi\n\
if [ -z "$GMAIL_USER" ]; then\n\
  export GMAIL_USER="pvinitha224@gmail.com"\n\
  echo "[ENTRYPOINT] Set default GMAIL_USER"\n\
fi\n\
if [ -z "$GMAIL_PASS" ]; then\n\
  export GMAIL_PASS="mdefvsszeaguaybg"\n\
  echo "[ENTRYPOINT] Set default GMAIL_PASS"\n\
fi\n\
exec node server.js\n' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 5000

# Start the server via entrypoint script
CMD ["/bin/sh", "/app/start.sh"]
