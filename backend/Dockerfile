FROM node:20-alpine

WORKDIR /app

# Install production dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Default the container to port 8000 so the image is self-consistent even when
# run standalone (docker-compose still overrides PORT explicitly).
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "src/server.js"]
