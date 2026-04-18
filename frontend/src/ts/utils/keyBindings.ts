import {
    VK_W,
    VK_S,
    VK_A,
    VK_D,
    VK_Q,
    VK_E,
    VK_SPACE
} from '../constants/keyCodes';

export type ControlAction =
    | 'forward'
    | 'backward'
    | 'turnLeft'
    | 'turnRight'
    | 'turretLeft'
    | 'turretRight'
    | 'shoot';

export interface KeyBindings {
    forward: string;
    backward: string;
    turnLeft: string;
    turnRight: string;
    turretLeft: string;
    turretRight: string;
    shoot: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
    forward: 'KeyW',
    backward: 'KeyS',
    turnLeft: 'KeyA',
    turnRight: 'KeyD',
    turretLeft: 'KeyQ',
    turretRight: 'KeyE',
    shoot: 'Space'
};

export const CONTROL_ACTION_ORDER: ControlAction[] = [
    'forward',
    'backward',
    'turnLeft',
    'turnRight',
    'turretLeft',
    'turretRight',
    'shoot'
];

export const CONTROL_ACTION_LABELS: Record<ControlAction, string> = {
    forward: 'Вперёд',
    backward: 'Назад',
    turnLeft: 'Поворот корпуса влево',
    turnRight: 'Поворот корпуса вправо',
    turretLeft: 'Башня влево',
    turretRight: 'Башня вправо',
    shoot: 'Огонь'
};

/** Зарезервировано в бою для колеса пингов (нельзя назначить на действие). */
export const RESERVED_GAME_KEY_CODES = new Set<string>(['KeyV']);

const ACTION_TO_VK: Record<ControlAction, number> = {
    forward: VK_W,
    backward: VK_S,
    turnLeft: VK_A,
    turnRight: VK_D,
    turretLeft: VK_Q,
    turretRight: VK_E,
    shoot: VK_SPACE
};

export const GAME_CONTROL_VK_CODES: number[] = CONTROL_ACTION_ORDER.map((a) => ACTION_TO_VK[a]);

export function findActionForKeyCode(bindings: KeyBindings, code: string): ControlAction | null {
    for (const action of CONTROL_ACTION_ORDER) {
        if (bindings[action] === code) {
            return action;
        }
    }
    return null;
}

export function actionToVk(action: ControlAction): number {
    return ACTION_TO_VK[action];
}

/** Человекочитаемая подпись для подсказки в настройках. */
export function formatKeyCode(code: string): string {
    if (!code) return '—';
    if (code === 'Space') return 'Пробел';
    if (code.startsWith('Key') && code.length === 4) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'Shift';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'Ctrl';
    if (code === 'AltLeft' || code === 'AltRight') return 'Alt';
    if (code === 'Enter' || code === 'NumpadEnter') return 'Enter';
    if (code === 'Backquote') return '`';
    if (code === 'Minus') return '-';
    if (code === 'Equal') return '=';
    if (code === 'BracketLeft') return '[';
    if (code === 'BracketRight') return ']';
    if (code === 'Backslash') return '\\';
    if (code === 'Semicolon') return ';';
    if (code === 'Quote') return "'";
    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';
    if (code === 'Slash') return '/';
    if (code.startsWith('Numpad')) return code.replace('Numpad', 'Num ');
    return code;
}
