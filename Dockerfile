# Используем официальный образ Node.js как базовый
FROM node:lts-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Установка зависимостей для Sharp, wget и необходимых утилит
RUN apk add --no-cache python3 make g++ vips-dev bash coreutils wget

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript код
RUN npm run build

# Делаем директории для загрузок и временных файлов
# и обеспечиваем соответствующие права доступа
RUN mkdir -p /app/uploads /app/temp && \
    chmod 777 /app/uploads /app/temp

# Копируем entrypoint скрипт
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Открываем порт
EXPOSE 3000

# Запускаем приложение с использованием tini для правильной обработки сигналов
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
