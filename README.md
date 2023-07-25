# Тестовое задание на должность "Ведущий разработчик NodeJS"
## Инструкция по локальной развертывании проекта

### Пререквизиты
Убедитесь что у вас установлен [Node Js](https://nodejs.org/en) и [Docker](https://www.docker.com/).

## Для локального поднятия RabbitMQ запустите команду с помощью Docker Compose

1. Убедитесь, что у вас установлен Docker и Docker Compose.
2. Склонируйте репозиторий с проектом.
3. Перейдите в корневую папку проекта.

4. Создайте и запустите контейнер RabbitMQ с помощью Docker Compose:

```
docker-compose up -d
```

## Далее из директории приложения
### Перейдите в папку producer.
```
cd producer
```
### Установите зависимости и запустите сервис Producer
```
yarn install
```
    
    yarn dev
### Аналогично с сервисом Consumer
```
cd consumer
```
```
yarn install
```
    
    yarn dev

