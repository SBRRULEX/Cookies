FROM node:20-alpine

WORKDIR /app

COPY backend /app/backend
COPY frontend /app/frontend

WORKDIR /app/backend

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
