# 2DTanks Server

Серверная часть для многопользовательской игры 2DTanks.

## Установка

```bash
cd server
npm install
```

## Запуск

```bash
npm run build
npm start
```

Или в режиме разработки:

```bash
npm run dev
```

Сервер запустится на порту 3000 (или порту, указанном в переменной окружения PORT).

## Автоматическое тестирование (Jest)

Модульные тесты (геометрия, JWT, пароли, утилиты, CORS) без поднятого HTTP-порта:

```bash
npm run test:unit
```

Интеграционные тесты (Supertest + Express-приложение из `createHttpApp()`):

- без БД выполняется только `GET /api/health`;
- полный набор сценариев `/api/auth` — при заданном `DATABASE_URL` или `TEST_DATABASE_URL` (см. [.env.test.example](.env.test.example): скопируйте в `.env.test`, примените миграции к тестовой базе `npm run migrate`).

```bash
npm run test:integration
npm test          # unit + integration
npm run test:coverage   # покрытие по модульным тестам
```

Подробнее: [TESTING.md](TESTING.md).

## Структура

- `src/createHttpApp.ts` - Сборка Express-приложения (HTTP API без listen; используется сервером и тестами)
- `src/server.ts` - Главный файл сервера с WebSocket сервером
- `src/room/` - Система управления комнатами
- `src/game/` - Игровая логика
- `src/model/` - Модели игровых объектов
- `src/geometry/` - Геометрия и физика
- `src/components/` - Компоненты танков и пуль

## Протокол WebSocket

### Создание комнаты
```json
{ "type": "createRoom" }
```

Ответ:
```json
{ "type": "roomCreated", "roomCode": "ABC123", "playerId": "player_..." }
```

### Подключение к комнате
```json
{ "type": "joinRoom", "code": "ABC123" }
```

Ответ:
```json
{ "type": "joined", "roomId": "ABC123", "playerId": "player_...", "role": "attacker" }
```

### Отправка конфигурации танка
```json
{
  "type": "tankConfig",
  "data": {
    "color": 0,
    "hullNum": 0,
    "trackNum": 0,
    "turretNum": 0,
    "weaponNum": 0
  }
}
```

### Готовность
```json
{ "type": "ready", "ready": true }
```

### Игровые действия
```json
{
  "type": "action",
  "forward": true,
  "backward": false,
  "turnLeft": false,
  "turnRight": false,
  "turretLeft": false,
  "turretRight": false,
  "shoot": false
}
```

### Снимок состояния игры
```json
{
  "type": "snapshot",
  "tick": 124,
  "world": {
    "tanks": [...],
    "bullets": [...],
    "walls": [...],
    "items": [...],
    "keysCollected": 2,
    "currentLevel": 1,
    "timeElapsed": 45.2
  }
}
```
