# Используем официальный образ Node.js как базовый
FROM node:lts-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Установка зависимостей для Sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript код
RUN npm run build

# Делаем директории для загрузок и временных файлов
RUN mkdir -p /app/uploads /app/temp

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/app.js"]
