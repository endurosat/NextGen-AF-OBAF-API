FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

# Install librsync-dev and xz
RUN apk add --no-cache librsync-dev xz

COPY dist ./dist

# we need this because config is in a volume
COPY config ./config 

EXPOSE 7777

ENV PAYLOAD_API_HOST=172.28.64.1
ENV FPGA_API_HOST=172.28.64.1
ENV SERVER_PORT=7777
ENV PRIVATE_NETWORK=app-network
ENV JWT_PUBLIC_KEY=your-key-here

CMD ["node", "dist/src/main"]