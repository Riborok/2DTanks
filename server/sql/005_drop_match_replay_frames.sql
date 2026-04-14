-- Удаление устаревшего snapshot-хранилища реплея (заменено на match_replay_actions).
DROP TABLE IF EXISTS match_replay_frames;
