FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
