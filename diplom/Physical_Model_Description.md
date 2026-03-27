# Описание физической модели базы данных 2DTanks

## Введение

Физическая модель описывает реализацию базы данных в СУБД **PostgreSQL**. Модель разработана на основе инфологической модели и учитывает производительность (индексы), целостность (ограничения) и расширяемость системы.

**СУБД:** PostgreSQL 16+  
**Схема:** `public` (по умолчанию)

---

## 1. Пользователи и профили

### 1.1 Таблица `users`

| Столбец       | Тип данных     | Ограничения      | Описание                    |
|---------------|----------------|------------------|-----------------------------|
| user_id       | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| login         | VARCHAR(50)    | NOT NULL, UNIQUE | Логин для входа             |
| email         | VARCHAR(255)   | NOT NULL, UNIQUE | Адрес электронной почты     |
| password_hash | VARCHAR(255)   | NOT NULL         | Хеш пароля                  |
| display_name  | VARCHAR(100)   | NOT NULL         | Отображаемое имя игрока     |
| created_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата регистрации    |
| updated_at    | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата последнего изменения |

```sql
CREATE TABLE users (
    user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login         VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_email ON users(email);
```

---

### 1.2 Таблица `user_profiles`

| Столбец      | Тип данных     | Ограничения           | Описание                    |
|--------------|----------------|------------------------|-----------------------------|
| profile_id   | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| user_id      | UUID           | NOT NULL, UNIQUE, REFERENCES users(user_id) ON DELETE CASCADE | Ссылка на пользователя |
| avatar_url   | VARCHAR(500)   |                       | URL аватара                 |
| preferred_role | VARCHAR(20)  | CHECK (preferred_role IN ('attacker', 'defender')) | Предпочитаемая роль |
| created_at   | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания             |
| updated_at   | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE user_profiles (
    profile_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    avatar_url     VARCHAR(500),
    preferred_role VARCHAR(20) CHECK (preferred_role IN ('attacker', 'defender')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

---

## 2. Сезоны и рейтинги

### 2.1 Таблица `seasons`

| Столбец   | Тип данных     | Ограничения      | Описание                    |
|-----------|----------------|------------------|-----------------------------|
| season_id | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| name      | VARCHAR(100)   | NOT NULL         | Название сезона             |
| start_date| DATE           | NOT NULL         | Дата начала сезона          |
| end_date  | DATE           | NOT NULL         | Дата окончания сезона       |
| is_active | BOOLEAN        | NOT NULL, DEFAULT FALSE | Признак активного сезона |
| created_at| TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания           |
| updated_at| TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE seasons (
    season_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_season_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_seasons_is_active ON seasons(is_active);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
```

---

### 2.2 Таблица `user_ratings`

| Столбец      | Тип данных  | Ограничения           | Описание                    |
|--------------|-------------|------------------------|-----------------------------|
| rating_id    | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| user_id      | UUID        | NOT NULL, REFERENCES users(user_id) ON DELETE CASCADE | Ссылка на пользователя |
| season_id    | UUID        | NOT NULL, REFERENCES seasons(season_id) ON DELETE CASCADE | Ссылка на сезон |
| rating_value | INTEGER     | NOT NULL, DEFAULT 1000 | Значение рейтинга (Elo-подобный) |
| wins_count   | INTEGER     | NOT NULL, DEFAULT 0    | Количество побед           |
| losses_count | INTEGER     | NOT NULL, DEFAULT 0    | Количество поражений       |
| created_at   | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Дата создания             |
| updated_at   | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE user_ratings (
    rating_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    season_id    UUID NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL DEFAULT 1000,
    wins_count   INTEGER NOT NULL DEFAULT 0 CHECK (wins_count >= 0),
    losses_count INTEGER NOT NULL DEFAULT 0 CHECK (losses_count >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_rating_per_season UNIQUE (user_id, season_id)
);

CREATE INDEX idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX idx_user_ratings_season_id ON user_ratings(season_id);
CREATE INDEX idx_user_ratings_value ON user_ratings(season_id, rating_value DESC);
```

---

## 3. Типы матчей и матчи

### 3.1 Таблица `match_types`

| Столбец      | Тип данных     | Ограничения      | Описание                    |
|--------------|----------------|------------------|-----------------------------|
| match_type_id| UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| code         | VARCHAR(50)    | NOT NULL, UNIQUE | Код типа (standard, kill_time) |
| name         | VARCHAR(100)   | NOT NULL         | Название                    |
| description  | TEXT           |                  | Описание                    |
| created_at   | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания           |
| updated_at   | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE match_types (
    match_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.2 Таблица `matches`

| Столбец        | Тип данных     | Ограничения           | Описание                    |
|----------------|----------------|------------------------|-----------------------------|
| match_id       | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_type_id  | UUID           | NOT NULL, REFERENCES match_types(match_type_id) ON DELETE RESTRICT | Тип матча |
| season_id      | UUID           | REFERENCES seasons(season_id) ON DELETE SET NULL | Сезон (опционально) |
| room_code      | VARCHAR(20)    |                       | Код комнаты при создании    |
| match_status   | VARCHAR(20)    | NOT NULL              | waiting / in_progress / completed / aborted |
| winner_role    | VARCHAR(20)    |                       | attacker / defender / NULL  |
| end_reason     | VARCHAR(50)    |                       | timeLimit / keysCollected / opponentDisconnect и др. |
| duration_ticks | INTEGER        |                       | Длительность в игровых тиках |
| started_at     | TIMESTAMPTZ    |                       | Время начала матча          |
| ended_at       | TIMESTAMPTZ    |                       | Время окончания матча       |
| created_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания записи      |
| updated_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE matches (
    match_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_type_id  UUID NOT NULL REFERENCES match_types(match_type_id) ON DELETE RESTRICT,
    season_id      UUID REFERENCES seasons(season_id) ON DELETE SET NULL,
    room_code      VARCHAR(20),
    match_status   VARCHAR(20) NOT NULL CHECK (match_status IN ('waiting', 'in_progress', 'completed', 'aborted')),
    winner_role    VARCHAR(20) CHECK (winner_role IS NULL OR winner_role IN ('attacker', 'defender')),
    end_reason     VARCHAR(50),
    duration_ticks INTEGER,
    started_at     TIMESTAMPTZ,
    ended_at       TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_match_type_id ON matches(match_type_id);
CREATE INDEX idx_matches_season_id ON matches(season_id);
CREATE INDEX idx_matches_status ON matches(match_status);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
```

---

## 4. Участники матча

### 4.1 Таблица `match_participants`

| Столбец        | Тип данных     | Ограничения           | Описание                    |
|----------------|----------------|------------------------|-----------------------------|
| participant_id | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id       | UUID           | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| user_id        | UUID           | REFERENCES users(user_id) ON DELETE SET NULL | Пользователь (NULL для анонимов) |
| role           | VARCHAR(20)    | NOT NULL              | attacker / defender / spectator |
| tank_color     | VARCHAR(20)    |                       | Цвет танка                  |
| tank_hull_num  | SMALLINT       |                       | Номер корпуса               |
| tank_track_num | SMALLINT       |                       | Номер гусениц               |
| tank_turret_num| SMALLINT       |                       | Номер башни                 |
| tank_weapon_num| SMALLINT       |                       | Номер оружия                |
| kills_count    | INTEGER        | NOT NULL, DEFAULT 0    | Количество уничтожений      |
| deaths_count   | INTEGER        | NOT NULL, DEFAULT 0    | Количество смертей          |
| is_winner      | BOOLEAN        | NOT NULL, DEFAULT FALSE | Признак победителя         |
| created_at     | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания             |

```sql
CREATE TABLE match_participants (
    participant_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('attacker', 'defender', 'spectator')),
    tank_color      VARCHAR(20),
    tank_hull_num   SMALLINT,
    tank_track_num  SMALLINT,
    tank_turret_num SMALLINT,
    tank_weapon_num SMALLINT,
    kills_count     INTEGER NOT NULL DEFAULT 0 CHECK (kills_count >= 0),
    deaths_count    INTEGER NOT NULL DEFAULT 0 CHECK (deaths_count >= 0),
    is_winner       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX idx_match_participants_user_id ON match_participants(user_id);
```

---

## 5. Реплей: входы и спауны

### 5.1 Таблица `match_inputs`

| Столбец     | Тип данных  | Ограничения           | Описание                    |
|-------------|-------------|------------------------|-----------------------------|
| input_id    | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id    | UUID        | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| tick_number | INTEGER     | NOT NULL              | Тик события                 |
| player_id   | VARCHAR(50) | NOT NULL              | Идентификатор игрока (clientId) |
| action_type | VARCHAR(30) | NOT NULL              | forward / backward / turn_left / turn_right / turret_left / turret_right / shoot |
| is_pressed  | BOOLEAN     | NOT NULL              | Клавиша нажата (true) или отпущена (false) |

```sql
CREATE TABLE match_inputs (
    input_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    tick_number INTEGER NOT NULL,
    player_id   VARCHAR(50) NOT NULL,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN (
        'forward', 'backward', 'turn_left', 'turn_right',
        'turret_left', 'turret_right', 'shoot'
    )),
    is_pressed  BOOLEAN NOT NULL
);

CREATE INDEX idx_match_inputs_match_tick ON match_inputs(match_id, tick_number);
```

---

### 5.2 Таблица `match_tank_spawns`

| Столбец      | Тип данных  | Ограничения           | Описание                    |
|--------------|-------------|------------------------|-----------------------------|
| spawn_id     | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id     | UUID        | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| tick_number  | INTEGER     | NOT NULL              | Тик (0 — старт/смена уровня, иначе — респаун) |
| role         | VARCHAR(20) | NOT NULL              | attacker / defender         |
| spawn_line   | SMALLINT    | NOT NULL              | Строка сетки (0..4)         |
| spawn_column | SMALLINT    | NOT NULL              | Столбец сетки (0..10)       |
| angle_index  | SMALLINT    |                       | Индекс угла 0–3 (только для респауна) |

```sql
CREATE TABLE match_tank_spawns (
    spawn_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    tick_number  INTEGER NOT NULL,
    role         VARCHAR(20) NOT NULL CHECK (role IN ('attacker', 'defender')),
    spawn_line   SMALLINT NOT NULL CHECK (spawn_line BETWEEN 0 AND 4),
    spawn_column SMALLINT NOT NULL CHECK (spawn_column BETWEEN 0 AND 10),
    angle_index  SMALLINT CHECK (angle_index IS NULL OR (angle_index BETWEEN 0 AND 3))
);

CREATE INDEX idx_match_tank_spawns_match_tick ON match_tank_spawns(match_id, tick_number);
```

---

### 5.3 Таблица `match_key_spawns`

| Столбец      | Тип данных  | Ограничения           | Описание                    |
|--------------|-------------|------------------------|-----------------------------|
| spawn_id     | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id     | UUID        | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| level        | SMALLINT    | NOT NULL              | Уровень (1, 2 или 3)        |
| key_index    | SMALLINT    | NOT NULL              | Номер ключа на уровне       |
| spawn_line   | SMALLINT    | NOT NULL              | Строка сетки                |
| spawn_column | SMALLINT    | NOT NULL              | Столбец сетки               |

```sql
CREATE TABLE match_key_spawns (
    spawn_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    level        SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
    key_index    SMALLINT NOT NULL,
    spawn_line   SMALLINT NOT NULL,
    spawn_column SMALLINT NOT NULL
);

CREATE INDEX idx_match_key_spawns_match_level ON match_key_spawns(match_id, level);
```

---

### 5.4 Таблица `match_ammo_box_spawns`

| Столбец      | Тип данных  | Ограничения           | Описание                    |
|--------------|-------------|------------------------|-----------------------------|
| spawn_id     | UUID        | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id     | UUID        | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| tick_number  | INTEGER     | NOT NULL              | Тик появления ящика         |
| spawn_line   | SMALLINT    | NOT NULL              | Строка сетки                |
| spawn_column | SMALLINT    | NOT NULL              | Столбец сетки               |
| box_type     | VARCHAR(20) | NOT NULL              | bulLight / bulMedium / bulHeavy / bulGrenade / bulSniper |

```sql
CREATE TABLE match_ammo_box_spawns (
    spawn_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    tick_number  INTEGER NOT NULL,
    spawn_line   SMALLINT NOT NULL,
    spawn_column SMALLINT NOT NULL,
    box_type     VARCHAR(20) NOT NULL CHECK (box_type IN ('bulLight', 'bulMedium', 'bulHeavy', 'bulGrenade', 'bulSniper'))
);

CREATE INDEX idx_match_ammo_box_spawns_match_tick ON match_ammo_box_spawns(match_id, tick_number);
```

---

## 6. Реплеи

### 6.1 Таблица `replays`

| Столбец           | Тип данных     | Ограничения           | Описание                    |
|-------------------|----------------|------------------------|-----------------------------|
| replay_id         | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid() | Уникальный идентификатор   |
| match_id          | UUID           | NOT NULL, REFERENCES matches(match_id) ON DELETE CASCADE | Ссылка на матч |
| created_by_user_id| UUID           | REFERENCES users(user_id) ON DELETE SET NULL | Пользователь, сохранивший запись |
| title             | VARCHAR(200)   | NOT NULL              | Название реплея             |
| is_public         | BOOLEAN        | NOT NULL, DEFAULT FALSE | Признак публичности       |
| created_at        | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата создания             |
| updated_at        | TIMESTAMPTZ    | NOT NULL, DEFAULT NOW() | Дата обновления           |

```sql
CREATE TABLE replays (
    replay_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id           UUID NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    title              VARCHAR(200) NOT NULL,
    is_public          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_replays_match_id ON replays(match_id);
CREATE INDEX idx_replays_created_by ON replays(created_by_user_id);
CREATE INDEX idx_replays_is_public ON replays(is_public) WHERE is_public = TRUE;
```

---

## 7. Диаграмма зависимостей таблиц

```
users
  ├── user_profiles (1:1)
  ├── user_ratings (1:*)
  ├── match_participants (*:*)
  └── replays (1:*)

seasons
  ├── user_ratings (1:*)
  └── matches (0..1:*)

match_types
  └── matches (1:*)

matches
  ├── match_participants (1:*)
  ├── match_inputs (1:*)
  ├── match_tank_spawns (1:*)
  ├── match_key_spawns (1:*)
  ├── match_ammo_box_spawns (1:*)
  └── replays (1:*)
```

---

## 8. Триггеры (опционально)

### Обновление `updated_at` при изменении записи

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применить к таблицам с updated_at
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_user_ratings_updated_at BEFORE UPDATE ON user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_match_types_updated_at BEFORE UPDATE ON match_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_replays_updated_at BEFORE UPDATE ON replays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

*Примечание:* В PostgreSQL 12+ используется `EXECUTE FUNCTION`; в более старых версиях — `EXECUTE PROCEDURE`.

---

## 9. Начальные данные (seed)

### Справочник типов матчей

```sql
INSERT INTO match_types (code, name, description) VALUES
    ('standard', 'Стандартный', 'Режим сбора ключей и уничтожения базы'),
    ('kill_time', 'Kill Time', 'Режим на количество уничтожений за время');
```

### Активный сезон (опционально)

```sql
INSERT INTO seasons (name, start_date, end_date, is_active) VALUES
    ('Сезон 1', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', TRUE);
```

---

## 10. Сводная таблица типов данных

| Инфологический тип | PostgreSQL | Примечание                    |
|--------------------|------------|--------------------------------|
| Идентификатор      | UUID       | gen_random_uuid()             |
| Строка короткая    | VARCHAR(n) | n по домену                   |
| Строка длинная     | TEXT       | Без ограничения длины         |
| Целое              | INTEGER    | SMALLINT для малых диапазонов |
| Булево             | BOOLEAN    |                               |
| Дата               | DATE       |                               |
| Дата и время       | TIMESTAMPTZ| С учётом часового пояса       |
