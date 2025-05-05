FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

CMD ["node", "dist/index.js"]
