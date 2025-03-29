#!/bin/bash

# Создаем директории, если их нет
mkdir -p uploads temp

# Запускаем docker-compose
docker-compose up -d

echo "Image Server запущен и доступен по адресу http://localhost:3000"
echo "Директория uploads синхронизирована с ./uploads на хост-машине"
