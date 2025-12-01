# Use Node LTS base image
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /webapp

# Copy package.json and lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose the port the Express server listens on
EXPOSE 3333
EXPOSE 4000

CMD ['npm', 'run', 'start']
