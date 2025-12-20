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

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private listeners: Map<string, ((data: ServerMessage) => void)[]> = new Map();
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private isConnecting: boolean = false;
    private wasConnected: boolean = false;

    constructor(url: string = 'ws://localhost:3000') {
        this.url = url;
    }

    public connect(): Promise<void> {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.isConnecting = true;
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnecting = false;
                    this.wasConnected = true;
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: ServerMessage = JSON.parse(event.data);
                        this.emit(message.type, message);
                        // Also emit 'message' for generic listeners
                        this.emit('message', message);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    // Don't reject here - let onclose handle reconnection
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed', event.code, event.reason);
                    this.isConnecting = false;
                    const wasConnected = this.wasConnected;
                    this.wasConnected = false;
                    this.ws = null;
                    // Only attempt reconnect if we were previously connected and it wasn't a normal closure
                    if (wasConnected && event.code !== 1000) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
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

    public send(message: ClientMessage): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
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
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
