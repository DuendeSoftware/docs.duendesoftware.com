FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

COPY fix-svg.sh ./

RUN npm install && npm install -g http-server

COPY . .

RUN chmod +x fix-svg.sh && ./fix-svg.sh

RUN npm run build

EXPOSE 8080

CMD ["http-server", "./dist", "-p", "8080", "-a", "0.0.0.0", "--cors", "-g"]