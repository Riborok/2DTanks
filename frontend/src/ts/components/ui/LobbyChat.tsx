import React, { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';

interface ChatMsg {
    id: number;
    fromId: string;
    fromName: string;
    text: string;
    at: number;
}

const MAX_LEN = 200;
let _mid = 1;

const LobbyChat: React.FC<{ wsClient: WebSocketClient; myPlayerId: string }> = ({
    wsClient,
    myPlayerId
}) => {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [value, setValue] = useState('');
    const logRef = useRef<HTMLDivElement | null>(null);
    const lastSendRef = useRef(0);

    useEffect(() => {
        const handler = (m: any) => {
            if (!m || m.type !== 'chat:msg') return;
            setMessages((prev) => {
                const next = [
                    ...prev,
                    {
                        id: _mid++,
                        fromId: String(m.fromId),
                        fromName: String(m.fromName || 'Игрок').slice(0, 32),
                        text: String(m.text || '').slice(0, MAX_LEN),
                        at: Number(m.at) || Date.now()
                    }
                ];
                return next.slice(-50);
            });
        };
        wsClient.on('chat:msg' as any, handler);
        return () => wsClient.off('chat:msg' as any, handler);
    }, [wsClient]);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [messages]);

    const send = () => {
        const text = value.trim();
        if (!text) return;
        const now = Date.now();
        if (now - lastSendRef.current < 1000) return;
        lastSendRef.current = now;
        wsClient.send({ type: 'chat:send', text } as any);
        setValue('');
    };

    return (
        <div className="chat-panel" role="log" aria-label="Чат лобби">
            <div className="chat-log" ref={logRef}>
                {messages.length === 0 && (
                    <div className="chat-msg" style={{ opacity: 0.6 }}>
                        Сообщения появятся здесь. Будьте вежливы.
                    </div>
                )}
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className="chat-msg"
                        style={m.fromId === myPlayerId ? { opacity: 0.9 } : undefined}
                    >
                        <span className="chat-from">{m.fromName}:</span>
                        {m.text}
                    </div>
                ))}
            </div>
            <div className="chat-input-row">
                <input
                    type="text"
                    maxLength={MAX_LEN}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            send();
                        }
                    }}
                    placeholder="Сообщение (Enter — отправить)"
                />
                <button type="button" onClick={send}>
                    Отправить
                </button>
            </div>
        </div>
    );
};

export default LobbyChat;
