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
# Запускаем Node.js приложение в фоновом режиме
node dist/app.js &
NODE_PID=$!

# Функция для проверки, запущен ли сервер
wait_for_server() {
  echo "Ожидание запуска сервера..."
  for i in $(seq 1 30); do
    if wget -q --spider http://localhost:3000/health 2>/dev/null; then
      echo "Сервер успешно запущен!"
      return 0
    fi
    echo "Попытка $i: Сервер еще не готов..."
    sleep 1
  done
  echo "Сервер не запустился в течение 30 секунд."
  return 1
}

# Ждем запуска сервера
if ! wait_for_server; then
  echo "Ошибка запуска сервера. Проверьте логи для получения дополнительной информации."
  kill $NODE_PID
  exit 1
fi

echo "Сервис полностью запущен и готов к работе"

# Ждем завершения работы приложения
wait $NODE_PID
