# Multi-stage Dockerfile for the Express + React full-stack application

# Stage 1: Build stage
FROM node:20-slim AS builder
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for compiling code)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the frontend assets and compile the Express backend server
RUN npm run build

# Stage 2: Production execution stage
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors for standard start operations
COPY package*.json ./

# Install only production dependencies to keep the image size minimal and secured
RUN npm ci --only=production

# Copy built assets and compiled backend from the builder step
COPY --from=builder /usr/src/app/dist ./dist

# Expose port 3000 for server ingress routing
EXPOSE 3000

# Start the Node.js production server
CMD ["npm", "start"]
