# Use the official Node.js 20 lightweight image (Debian-based for better native compatibility)
FROM node:20-slim

# Install system dependencies for native modules and better compatibility
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies separately for better caching
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Force rebuild of native modules for the container's architecture (linux-x64-gnu)
RUN npm rebuild lightningcss

# Copy the rest of the frontend code
COPY . .

# Expose the Next.js port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]
