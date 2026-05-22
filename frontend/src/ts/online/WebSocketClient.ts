export interface ServerMessage {
    type:
        | 'joined'
        | 'error'
        | 'snapshot'
        | 'gameEnd'
        | 'roomUpdate'
        | 'gameStart'
        | 'leftGame'
        | 'invite:msg'
        | 'invite:sent'
        | 'friends:accepted'
        | 'friends:incoming'
        | 'friends:became_friends'
        | 'friends:you_accepted'
        | 'spectate:list'
        | 'spectate:joined'
        | 'spectate:left'
        | 'ping:msg';
    roomId?: string;
    playerId?: string;
    role?: 'attacker' | 'defender' | 'fighter';
    message?: string;
    tick?: number;
    world?: any;
    reason?: string;
    winner?: 'attacker' | 'defender';
    players?: Array<{
        playerId: string;
        role: 'attacker' | 'defender' | 'fighter';
        tankConfig?: any;
        ready?: boolean;
        userId?: string;
        displayName?: string;
    }>;
    singlePlayerTest?: boolean;
    practiceMode?: boolean;
    deathmatchMode?: boolean;
    creatorPlayerId?: string;
    canStart?: boolean;
    settings?: {
        matchDurationSec: number;
        ammoSpawnIntervalSec: number;
        backgroundSequence: number[];
        arenaSurfaceMaterial: number;
    };
    /** invite:msg — приглашение в комнату от друга */
    roomCode?: string;
    fromUserId?: string;
    fromLogin?: string;
    fromDisplayName?: string;
    targetUserId?: string;
    at?: number;
    friendUserId?: string;
    friendLogin?: string;
    friendDisplayName?: string;
    /** friends:became_friends — второй участник дружбы */
    peerUserId?: string;
    peerLogin?: string;
    peerDisplayName?: string;
    /** spectate:joined */
    hasActiveGame?: boolean;
    spectatorId?: string;
    /** spectate:list */
    rooms?: unknown[];
    /** ping:msg (время — то же поле `at`, что и у invite:msg) */
    fromId?: string;
    x?: number;
    y?: number;
    pingType?: string;
}

export interface ClientMessage {
    type:
        | 'createRoom'
        | 'joinRoom'
        | 'tankConfig'
        | 'ready'
        | 'action'
        | 'leaveGame'
        | 'requestGameState'
        | 'roomSettings'
        | 'startGame';
    singlePlayer?: boolean;
    practice?: boolean;
    deathmatch?: boolean;
    code?: string;
    data?: any;
    ready?: boolean;
    settings?: Partial<{
        matchDurationSec: number;
        ammoSpawnIntervalSec: number;
        backgroundSequence: number[];
        arenaSurfaceMaterial: number;
    }>;
    action?: {
        forward?: boolean;
        backward?: boolean;
        turnLeft?: boolean;
        turnRight?: boolean;
        turretLeft?: boolean;
        turretRight?: boolean;
        shoot?: boolean;
    };
}

/** Порт игрового WebSocket-сервера, если не используется __GAME_WS_PATH__. */
declare const __GAME_WS_PORT__: string | undefined;
/** Например /game — тот же host, что у страницы (прокси nginx в Docker). */
declare const __GAME_WS_PATH__: string | undefined;

const DEFAULT_GAME_WS_PORT =
    typeof __GAME_WS_PORT__ !== 'undefined' ? String(__GAME_WS_PORT__) : '3000';

const WS_PATH =
    typeof __GAME_WS_PATH__ !== 'undefined' && String(__GAME_WS_PATH__).length > 0
        ? (String(__GAME_WS_PATH__).startsWith('/') ? String(__GAME_WS_PATH__) : `/${__GAME_WS_PATH__}`)
        : '';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    /** Базовый URL без query (токен добавляется при подключении). */
    private readonly baseUrl: string;
    private readonly getAccessToken: () => string | null;
    private listeners: Map<string, ((data: ServerMessage) => void)[]> = new Map();
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private isConnecting: boolean = false;
    private wasConnected: boolean = false;
    /** Один общий промис, если connect() вызвали несколько раз до открытия сокета */
    private connectAttemptPromise: Promise<void> | null = null;
    /** Messages sent before the socket is OPEN */
    private pendingOutgoing: ClientMessage[] = [];

    /**
     * @param url — базовый ws:// или wss:// URL без ?token=
     * @param getAccessToken — JWT для передачи в query при WebSocket handshake (как в описании к диплому)
     */
    constructor(url?: string, getAccessToken?: () => string | null) {
        this.baseUrl = url ?? WebSocketClient.resolveDefaultUrl();
        this.getAccessToken = getAccessToken ?? (() => null);
    }

    private buildConnectUrl(): string {
        const token = this.getAccessToken();
        if (!token) {
            return this.baseUrl;
        }
        const sep = this.baseUrl.includes('?') ? '&' : '?';
        return `${this.baseUrl}${sep}token=${encodeURIComponent(token)}`;
    }

    private static resolveDefaultUrl(): string {
        if (typeof window === 'undefined') {
            return WS_PATH ? `ws://127.0.0.1:5173${WS_PATH}` : `ws://127.0.0.1:${DEFAULT_GAME_WS_PORT}`;
        }
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        if (WS_PATH) {
            return `${proto}//${window.location.host}${WS_PATH}`;
        }
        return `${proto}//${window.location.hostname}:${DEFAULT_GAME_WS_PORT}`;
    }

    public connect(): Promise<void> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.connectAttemptPromise) {
            return this.connectAttemptPromise;
        }

        this.connectAttemptPromise = new Promise((resolve, reject) => {
            let settled = false;

            const finishOk = () => {
                if (settled) return;
                settled = true;
                this.isConnecting = false;
                this.connectAttemptPromise = null;
                resolve();
            };

            const finishFail = (message: string) => {
                if (settled) return;
                settled = true;
                this.isConnecting = false;
                this.connectAttemptPromise = null;
                this.pendingOutgoing = [];
                this.ws = null;
                reject(new Error(message));
            };

            try {
                this.isConnecting = true;
                const connectUrl = this.buildConnectUrl();
                console.log('[WS] Connecting to', connectUrl.replace(/token=[^&]+/, 'token=***'));
                const socket = new WebSocket(connectUrl);
                this.ws = socket;

                socket.onopen = () => {
                    if (this.ws !== socket) return;
                    console.log('WebSocket connected');
                    this.wasConnected = true;
                    this.reconnectAttempts = 0;
                    this.flushPendingOutgoing();
                    finishOk();
                };

                socket.onmessage = (event) => {
                    if (this.ws !== socket) return;
                    try {
                        const message: ServerMessage = JSON.parse(event.data);
                        this.emit(message.type, message);
                        this.emit('message', message);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                socket.onerror = () => {
                    if (this.ws !== socket) return;
                    console.error('WebSocket error (см. onclose для деталей)');
                };

                socket.onclose = (event) => {
                    if (this.ws !== socket) return;
                    console.log('WebSocket closed', event.code, event.reason || '');
                    this.isConnecting = false;

                    if (!settled) {
                        if (event.code === 4401) {
                            const authMsg =
                                'Требуется войти в аккаунт. Без регистрации или входа игра недоступна.';
                            finishFail(authMsg);
                            this.emit('error', { type: 'error', message: authMsg });
                            return;
                        }
                        finishFail(
                            `Не удалось подключиться к серверу (${this.baseUrl.replace(/token=[^&]+/g, 'token=***')}). Проверьте, что backend и nginx запущены.`
                        );
                        this.emit('error', {
                            type: 'error',
                            message: `Сервер недоступен. Убедитесь, что запущен WebSocket на ${this.baseUrl}`
                        });
                        return;
                    }

                    const wasOpen = this.wasConnected;
                    this.wasConnected = false;
                    this.ws = null;

                    if (event.code === 4401) {
                        this.emit('error', {
                            type: 'error',
                            message: 'Требуется войти в аккаунт. Без регистрации или входа игра недоступна.'
                        });
                        return;
                    }

                    if (wasOpen && event.code !== 1000) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                this.isConnecting = false;
                this.connectAttemptPromise = null;
                reject(error);
            }
        });

        return this.connectAttemptPromise;
    }

    private attemptReconnect(): void {
        if (!this.getAccessToken()) {
            this.emit('error', {
                type: 'error',
                message: 'Нет сессии. Войдите снова, чтобы продолжить.'
            });
            return;
        }
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect().catch(() => {
                    // Will retry automatically
                });
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            this.emit('error', { type: 'error', message: 'Connection lost. Please refresh the page.' });
        }
    }

    private flushPendingOutgoing(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        while (this.pendingOutgoing.length > 0) {
            const msg = this.pendingOutgoing.shift()!;
            this.ws.send(JSON.stringify(msg));
        }
    }

    public send(message: ClientMessage): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return;
        }
        this.pendingOutgoing.push(message);
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.connect().catch(() => {
                this.emit('error', {
                    type: 'error',
                    message: 'Не удалось подключиться к серверу.'
                });
            });
        }
    }

    public on(event: string, callback: (data: ServerMessage) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    public off(event: string, callback: (data: ServerMessage) => void): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    private emit(event: string, data: ServerMessage): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    /** Закрыть сокет без снятия подписок (например, «в меню» с тем же клиентом). */
    public closeSocket(): void {
        this.pendingOutgoing = [];
        this.connectAttemptPromise = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    public disconnect(): void {
        this.closeSocket();
        this.listeners.clear();
    }

    /**
     * Переподключение с актуальным токеном (слушатели сохраняются).
     */
    public reconnect(): Promise<void> {
        this.pendingOutgoing = [];
        this.connectAttemptPromise = null;
        if (this.ws) {
            const old = this.ws;
            old.onclose = null;
            old.onerror = null;
            old.onmessage = null;
            old.close(1000);
            this.ws = null;
        }
        return this.connect();
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /** WebSocket.CONNECTING | OPEN | CLOSING | CLOSED или CLOSED, если сокета нет */
    public getReadyState(): number {
        return this.ws ? this.ws.readyState : WebSocket.CLOSED;
    }

    public getServerUrl(): string {
        return this.baseUrl;
    }
}
