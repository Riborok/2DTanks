-- Журнал событий матча (world_init, item_spawn, player_input) для реплея без опоры на частоту снимков.
ALTER TABLE match_replay_actions
    ADD COLUMN IF NOT EXISTS events JSONB;
