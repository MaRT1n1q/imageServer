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

echo "Запуск приложения..."
# Запускаем Node.js приложение в фоновом режиме
node dist/app.js &
NODE_PID=$!

# Функция для проверки, запущен ли сервер
wait_for_server() {
  echo "Ожидание запуска сервера..."
  for i in $(seq 1 30); do
    if wget -q -O - http://localhost:3000/health > /dev/null 2>&1; then
      echo "Сервер успешно запущен!"
      return 0
    fi
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

# Возвращаем pid процесса Node.js, чтобы Docker мог отслеживать его
wait $NODE_PID
