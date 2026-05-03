import { RoomCodeGenerator } from '../../src/utils/roomCodeGenerator';

describe('RoomCodeGenerator', () => {
    it('generate produces CODE_LENGTH chars from A-Z0-9', () => {
        jest.spyOn(Math, 'random').mockImplementation(() => 0);
        const code = RoomCodeGenerator.generate();
        expect(code).toBe('AAAAAA');
        expect(code).toMatch(/^[A-Z0-9]{6}$/);
        jest.restoreAllMocks();
    });

    it('different random values change characters', () => {
        let n = 0;
        const seq = [0, 0.5, 0.99, 0.1, 0.2, 0.3];
        jest.spyOn(Math, 'random').mockImplementation(() => seq[n++ % seq.length]);
        const code = RoomCodeGenerator.generate();
        expect(code).toHaveLength(6);
        expect(code).toMatch(/^[A-Z0-9]{6}$/);
        jest.restoreAllMocks();
    });
});
