FROM node:20

WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
