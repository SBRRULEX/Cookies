FROM node:20

WORKDIR /app

COPY backend ./backend
COPY frontend ./frontend
COPY cookie-extractor ./cookie-extractor

WORKDIR /app/backend
RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
