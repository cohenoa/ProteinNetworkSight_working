FROM node AS builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .
EXPOSE 3000
# RUN npm run build
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build
CMD [ "npm", "start" ]