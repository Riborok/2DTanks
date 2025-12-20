export class RoomCodeGenerator {
    private static readonly CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    private static readonly CODE_LENGTH = 6;

    public static generate(): string {
        let code = '';
        for (let i = 0; i < RoomCodeGenerator.CODE_LENGTH; i++) {
            code += RoomCodeGenerator.CHARS.charAt(
                Math.floor(Math.random() * RoomCodeGenerator.CHARS.length)
            );
        }
        return code;
    }
}


