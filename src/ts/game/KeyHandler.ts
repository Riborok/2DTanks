import {
    VK_A,
    VK_B,
    VK_C,
    VK_COMMA,
    VK_D,
    VK_DOWN,
    VK_E,
    VK_F,
    VK_G,
    VK_H,
    VK_I,
    VK_J,
    VK_K,
    VK_L,
    VK_LEFT,
    VK_M,
    VK_N,
    VK_O,
    VK_P,
    VK_PERIOD,
    VK_Q,
    VK_R,
    VK_RIGHT,
    VK_S,
    VK_T,
    VK_U,
    VK_UP,
    VK_V,
    VK_W,
    VK_X,
    VK_Y,
    VK_Z
} from "../constants/keyCodes";

export class KeyHandler {
    public static readonly A_MASK: number = 1 << 0;
    public static readonly B_MASK: number = 1 << 1;
    public static readonly C_MASK: number = 1 << 2;
    public static readonly D_MASK: number = 1 << 3;
    public static readonly E_MASK: number = 1 << 4;
    public static readonly F_MASK: number = 1 << 5;
    public static readonly G_MASK: number = 1 << 6;
    public static readonly H_MASK: number = 1 << 7;
    public static readonly I_MASK: number = 1 << 8;
    public static readonly J_MASK: number = 1 << 9;
    public static readonly K_MASK: number = 1 << 10;
    public static readonly L_MASK: number = 1 << 11;
    public static readonly M_MASK: number = 1 << 12;
    public static readonly N_MASK: number = 1 << 13;
    public static readonly O_MASK: number = 1 << 14;
    public static readonly P_MASK: number = 1 << 15;
    public static readonly Q_MASK: number = 1 << 16;
    public static readonly R_MASK: number = 1 << 17;
    public static readonly S_MASK: number = 1 << 18;
    public static readonly T_MASK: number = 1 << 19;
    public static readonly U_MASK: number = 1 << 20;
    public static readonly V_MASK: number = 1 << 21;
    public static readonly W_MASK: number = 1 << 22;
    public static readonly X_MASK: number = 1 << 23;
    public static readonly Y_MASK: number = 1 << 24;
    public static readonly Z_MASK: number = 1 << 25;

    public static readonly PERIOD_MASK: number = 1 << 26;
    public static readonly COMMA_MASK: number = 1 << 27;

    public static readonly UP_MASK: number = 1 << 28;
    public static readonly DOWN_MASK: number = 1 << 29;
    public static readonly RIGHT_MASK: number = 1 << 30;
    public static readonly LEFT_MASK: number = 1 << 31;

    private _keysMask: number = 0;
    public constructor() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    public clearMask() { this._keysMask = 0 }
    public get keysMask(): number {return this._keysMask}
    private handleKeyDown(event: KeyboardEvent) {
        this._keysMask |= KeyHandler.getMask(event.keyCode);
    }
    private handleKeyUp(event: KeyboardEvent) {
        this._keysMask &= ~KeyHandler.getMask(event.keyCode);
    }
    public static getMask(keyCode: number): number {
        switch (keyCode) {
            case VK_A:
                return KeyHandler.A_MASK;
            case VK_B:
                return KeyHandler.B_MASK;
            case VK_C:
                return KeyHandler.C_MASK;
            case VK_D:
                return KeyHandler.D_MASK;
            case VK_E:
                return KeyHandler.E_MASK;
            case VK_F:
                return KeyHandler.F_MASK;
            case VK_G:
                return KeyHandler.G_MASK;
            case VK_H:
                return KeyHandler.H_MASK;
            case VK_I:
                return KeyHandler.I_MASK;
            case VK_J:
                return KeyHandler.J_MASK;
            case VK_K:
                return KeyHandler.K_MASK;
            case VK_L:
                return KeyHandler.L_MASK;
            case VK_M:
                return KeyHandler.M_MASK;
            case VK_N:
                return KeyHandler.N_MASK;
            case VK_O:
                return KeyHandler.O_MASK;
            case VK_P:
                return KeyHandler.P_MASK;
            case VK_Q:
                return KeyHandler.Q_MASK;
            case VK_R:
                return KeyHandler.R_MASK;
            case VK_S:
                return KeyHandler.S_MASK;
            case VK_T:
                return KeyHandler.T_MASK;
            case VK_U:
                return KeyHandler.U_MASK;
            case VK_V:
                return KeyHandler.V_MASK;
            case VK_W:
                return KeyHandler.W_MASK;
            case VK_X:
                return KeyHandler.X_MASK;
            case VK_Y:
                return KeyHandler.Y_MASK;
            case VK_Z:
                return KeyHandler.Z_MASK;
            case VK_PERIOD:
                return KeyHandler.PERIOD_MASK;
            case VK_COMMA:
                return KeyHandler.COMMA_MASK;
            case VK_UP:
                return KeyHandler.UP_MASK;
            case VK_DOWN:
                return KeyHandler.DOWN_MASK;
            case VK_LEFT:
                return KeyHandler.LEFT_MASK;
            case VK_RIGHT:
                return KeyHandler.RIGHT_MASK;
            default:
                return 0;
        }
    }
}