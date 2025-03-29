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
exec "$@"
