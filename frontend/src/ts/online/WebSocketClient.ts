export interface ServerMessage {
    type: 'joined' | 'error' | 'snapshot' | 'gameEnd' | 'roomUpdate' | 'gameStart';
    roomId?: string;
    playerId?: string;
    role?: 'attacker' | 'defender';
    message?: string;
    tick?: number;
    world?: any;
    reason?: string;
    winner?: 'attacker' | 'defender';
    players?: Array<{
        playerId: string;
        role: 'attacker' | 'defender';
        tankConfig?: any;
        ready?: boolean;
    }>;
}

export interface ClientMessage {
    type: 'createRoom' | 'joinRoom' | 'tankConfig' | 'ready' | 'action';
    code?: string;
    data?: any;
    ready?: boolean;
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

/** Порт игрового WebSocket-сервера (совпадает с server PORT по умолчанию). */
const DEFAULT_GAME_WS_PORT = '3000';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
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
     * @param url — полный ws:// или wss:// URL. Если не задан: тот же host, что у страницы, порт {DEFAULT_GAME_WS_PORT}
     * (сервер: `process.env.PORT || 3000`).
     */
    constructor(url?: string) {
        this.url = url ?? WebSocketClient.resolveDefaultUrl();
    }

    private static resolveDefaultUrl(): string {
        if (typeof window === 'undefined') {
            return `ws://127.0.0.1:${DEFAULT_GAME_WS_PORT}`;
        }
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
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
                console.log('[WS] Connecting to', this.url);
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.wasConnected = true;
                    this.reconnectAttempts = 0;
                    this.flushPendingOutgoing();
                    finishOk();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: ServerMessage = JSON.parse(event.data);
                        this.emit(message.type, message);
                        this.emit('message', message);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                this.ws.onerror = () => {
                    console.error('WebSocket error (см. onclose для деталей)');
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed', event.code, event.reason || '');
                    this.isConnecting = false;

                    if (!settled) {
                        finishFail(
                            `Не удалось подключиться к серверу (${this.url}). Запустите сервер игры и проверьте порт ${DEFAULT_GAME_WS_PORT}.`
                        );
                        this.emit('error', {
                            type: 'error',
                            message: `Сервер недоступен. Убедитесь, что запущен WebSocket на ${this.url}`
                        });
                        return;
                    }

                    const wasOpen = this.wasConnected;
                    this.wasConnected = false;
                    this.ws = null;

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

    public disconnect(): void {
        this.pendingOutgoing = [];
        this.connectAttemptPromise = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public getServerUrl(): string {
        return this.url;
    }
}
