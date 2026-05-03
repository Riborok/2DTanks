import {
    isReplayPlayerInput,
    replayEventsToActionRows,
    type ReplayEvent,
    type ReplayPlayerInputEvent
} from '../../src/repos/replayRepo';

describe('replayRepo (pure helpers)', () => {
    it('isReplayPlayerInput narrows player_input events', () => {
        const e: ReplayEvent = {
            kind: 'player_input',
            tick: 1,
            playerId: 'p1',
            action: {
                forward: true,
                backward: false,
                turnLeft: false,
                turnRight: false,
                turretLeft: false,
                turretRight: false,
                shoot: false
            }
        };
        expect(isReplayPlayerInput(e)).toBe(true);
        if (isReplayPlayerInput(e)) {
            expect(e.playerId).toBe('p1');
        }
    });

    it('isReplayPlayerInput is false for other kinds', () => {
        const world: ReplayEvent = {
            kind: 'world_init',
            tick: 0,
            world: {},
            spawnOrigin: { x: 0, y: 0 }
        };
        expect(isReplayPlayerInput(world)).toBe(false);
    });

    it('replayEventsToActionRows filters to player_input only', () => {
        const input: ReplayPlayerInputEvent = {
            kind: 'player_input',
            tick: 5,
            playerId: 'a',
            action: {
                forward: false,
                backward: false,
                turnLeft: true,
                turnRight: false,
                turretLeft: false,
                turretRight: false,
                shoot: false
            }
        };
        const events: ReplayEvent[] = [
            { kind: 'world_init', tick: 0, world: {}, spawnOrigin: { x: 0, y: 0 } },
            input
        ];
        const rows = replayEventsToActionRows(events);
        expect(rows).toHaveLength(1);
        expect(rows[0].tick).toBe(5);
        expect(rows[0].playerId).toBe('a');
        expect(rows[0].action.turnLeft).toBe(true);
    });
});
