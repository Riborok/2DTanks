-- Роль fighter для арены (deathmatch) в match_participants и реплеях.
ALTER TABLE match_participants DROP CONSTRAINT IF EXISTS match_participants_role_check;
ALTER TABLE match_participants
    ADD CONSTRAINT match_participants_role_check
    CHECK (role IN ('attacker', 'defender', 'spectator', 'fighter'));
