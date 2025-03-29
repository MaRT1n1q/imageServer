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

echo "Запуск приложения..."
exec "$@"
