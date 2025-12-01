# Use Node LTS base image
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /webapp

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies (both frontend & backend if monorepo)
RUN npm install

# Copy all source code
COPY . .

# Build React frontend (adjust if your build script / folder differs)
RUN npm run start
RUN node /webapp/server.js

# Production image
FROM node:18-alpine AS production

WORKDIR /webapp

# Expose the port the Express server listens on
EXPOSE 3333
EXPOSE 4000
