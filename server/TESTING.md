# Тестирование сервера 2DTanks

## Уровни

1. **Модульные тесты** (`npm run test:unit`) — изолированная проверка функций и классов без HTTP и без PostgreSQL.
2. **Интеграционные тесты** (`npm run test:integration`) — HTTP-запросы через Supertest к приложению `createHttpApp()`; сценарии с БД выполняются только если задан `DATABASE_URL`.

## Модульные группы (файлы в `test/unit/`)

| Область | Файл | Содержание |
|--------|------|------------|
| Геометрия | `VectorUtils.test.ts`, `additionalFunc.test.ts`, `CollisionDetector.test.ts`, `point.test.ts` | Векторы, расстояния, углы, SAT, `getCollisionResult` |
| Утилиты | `seededRandom.test.ts`, `roomCodeGenerator.test.ts`, `IDTracker.test.ts` | PRNG, код комнаты, кодирование id сущностей |
| БД / WS | `pool.test.ts`, `userSocketRegistry.test.ts` | `getPool` без `DATABASE_URL`, реестр сокетов и `notifyUserSockets` |
| Конфиг / сеть | `serverPort.test.ts`, `createHttpApp.cors.test.ts`, `createHttpApp.test.ts` | Порт HTTP, CORS (в т.ч. LAN), smoke `GET /api/health` |
| Аутентификация | `password.test.ts`, `jwt.test.ts`, `httpAuth.test.ts` | bcrypt, JWT, middleware Bearer |
| WebSocket | `parseWsUser.test.ts` | Разбор JWT из query WebSocket upgrade |
| Игровой мир | `deathmatchArenaLayout.test.ts` | Пресеты арены, бан-ячейки, `pickDeathmatchSpawnSlots` |
| Константы / API-тела | `gameConstants.test.ts`, `parseTankPresetPayload.test.ts` | `dynamicCrateMass`, `ResolutionManager`, валидация пресета танка |
| Полигон / сущности | `entityManipulator.test.ts`, `rectangularEntity.test.ts` | Движение, поворот, геометрия прямоугольной сущности |
| Физика | `pointRotator.test.ts`, `collisionResolver.test.ts` | Поворот точки, импульс и отсутствие контакта |
| Реплеи (чистые функции) | `replayRepo.pure.test.ts` | `isReplayPlayerInput`, `replayEventsToActionRows` |

## Интеграционные сценарии (`test/integration/`)

Файл `repos.integration.test.ts` (только при заданной БД, см. `setup-env.ts`):

- **userRepo**: создание пользователя, поиск по login/email (без учёта регистра), отсутствующие записи → `null`, профиль, `updateUserProfile` (в т.ч. `avatarUrl`, комбинация с ролью);
- **tankPresetRepo**: CRUD пресетов, негативные кейсы чужого пользователя / неверного id, порядок списка;
- **friendshipsRepo**: запрос, повторный запрос, встречный запрос (авто-принятие), принятие/отклонение, уже друзья, `no_pending`, блокировка и `listBlocked`, поиск по login и `display_name`, `areAcceptedFriends` для одного id;
- **matchRepo**: пустой список игроков и неизвестный тип матча → `null`, создание матча и `finalizeMatch` (победа по роли и по `winnerUserIds` на арене);
- **replayRepo** / **replayLikesRepo**: матч + реплей, `saveMatchReplayActions` с `events`, `getReplayIfAllowed` (участник, публичный просмотр, несуществующий id), история, slug (владелец / чужой), `updateReplayMeta`, `enrichMatchStatsDisplayNames`, лайки и `listPublicReplays` (`new` / `top`, `liked_by_me`).

Файл `auth.api.integration.test.ts`:

- всегда: `GET /api/health`, `GET /api/game/replays` без токена → 401;
- при наличии PostgreSQL: регистрация/логин, негативные кейсы auth, логин с неверным паролем → 401, `GET /api/game/replays` с Bearer → 200 и список реплеев;
- при наличии PostgreSQL: `GET /api/auth/me` / `PUT /api/auth/profile` (401 без токена, 400 при пустом теле профиля и неверной роли, позитивное обновление `preferredRole`);
- при наличии PostgreSQL: блок «Game API extensions» — `GET/POST /api/game/tank-presets`, `GET .../replays/:id/playback` и share для несуществующего реплея → 404, `GET /api/game/matches/history` → 200;
- при наличии PostgreSQL: `GET /api/public/gallery` → 200, `GET /api/public/replays/by-slug/.../playback` для несуществующего slug → 404.

## Переменные окружения для интеграции

Создайте файл `.env.test` в каталоге `server/` (шаблон: `.env.test.example`). Рекомендуется отдельная тестовая база:

```env
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/tanks_test
JWT_SECRET=не-короче-32-символов-для-прода
```

Перед первым прогоном: `npm run migrate` с тем же `DATABASE_URL` / `TEST_DATABASE_URL`, что указываете в `.env.test`.

Если `DATABASE_URL` не задан, выполняются только тесты без БД (health + защита `/api/game/replays` без заголовка); блоки с PostgreSQL будут пропущены (`describe.skip`).

## Скриншоты для пояснительной записки

Выполните в терминале и сохраните вывод как «Рисунок 5.1» / «Рисунок 5.2»:

```bash
npm run test:unit
npm run test:integration
```
