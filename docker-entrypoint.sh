#!/bin/sh
set -e

# Проверяем права на директории
echo "Проверка и настройка прав доступа к директориям..."
chmod -R 777 /app/uploads
chmod -R 777 /app/temp

# Проверяем наличие директорий
echo "Проверка наличия необходимых директорий..."
mkdir -p /app/uploads
mkdir -p /app/temp

# Проверяем доступность директорий
echo "Проверка доступности директорий для записи..."
touch /app/uploads/.writetest && rm /app/uploads/.writetest
touch /app/temp/.writetest && rm /app/temp/.writetest

# Проверяем наличие инструментов
echo "Проверка наличия wget..."
which wget || echo "ОШИБКА: wget не найден!"

# Устанавливаем обработчик для корректного завершения процесса Node.js
cleanup() {
    echo "Получен сигнал остановки, завершаем работу..."
    if [ -n "$NODE_PID" ] && kill -0 $NODE_PID 2>/dev/null; then
        kill -SIGTERM $NODE_PID
        wait $NODE_PID
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Запуск приложения..."
# Запускаем Node.js приложение в прямом режиме для отображения всех ошибок
node dist/app.js &
NODE_PID=$!

# Даем приложению время инициализироваться
echo "Ожидание инициализации приложения..."
sleep 5

# Тестируем напрямую доступность эндпоинта health
echo "Проверка эндпоинта /health..."
LOCAL_PORT=${PORT:-3000}

wget -O - http://localhost:$LOCAL_PORT/health || echo "ОШИБКА: Эндпоинт /health недоступен"
curl -v http://localhost:$LOCAL_PORT/health 2>&1 || echo "ОШИБКА: Curl не смог подключиться к /health"

# Ожидаем завершения работы приложения
echo "Приложение запущено, PID: $NODE_PID"
wait $NODE_PID
