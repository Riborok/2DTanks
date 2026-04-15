import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './room/RoomManager';
import authRoutes from './routes/authRoutes';
import gameApiRoutes from './routes/gameApiRoutes';
import { parseWsUserFromRequest } from './ws/parseWsUser';
import type { WsAuthUser } from './auth/types';
import { resolveListenPort } from './serverPort';

const PORT = resolveListenPort();

const app = express();
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            cb(null, true);
            return;
        }
        cb(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/game', gameApiRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

server.listen(PORT, () => {
    console.log(`HTTP + WebSocket on port ${PORT}`);
    console.log(`Auth API: http://localhost:${PORT}/api/auth`);
});

wss.on('connection', (ws: WebSocket, req) => {
    const wsUser = parseWsUserFromRequest(req);

    if (!wsUser) {
        try {
            ws.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Требуется войти в аккаунт. Откройте игру после регистрации или входа.'
                })
            );
        } catch {
            /* ignore */
        }
        ws.close(4401, 'Authentication required');
        return;
    }

    console.log('New client connected from', req.socket.remoteAddress, `(user ${wsUser.login})`);

    let playerId: string | null = null;
    let roomCode: string | null = null;
    const restored = roomManager.reconnectByUser(ws, wsUser);
    if (restored) {
        roomCode = restored.code;
        playerId = restored.playerId;
        console.log(`[SERVER] Restored session for user ${wsUser.login} in room ${roomCode} as ${playerId}`);
    }

    ws.on('message', (message: Buffer) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'createRoom') {
                const singlePlayer = data.singlePlayer === true;
                const deathmatch = data.deathmatch === true && !singlePlayer;
                const practice = data.practice === true && !singlePlayer && !deathmatch;
                console.log(
                    `[SERVER] Creating new room...${
                        singlePlayer ? ' (solo test)' : deathmatch ? ' (deathmatch)' : practice ? ' (practice)' : ''
                    }`
                );
                const result = roomManager.createRoom(singlePlayer, wsUser, practice, deathmatch);
                roomCode = result.code;
                console.log(`[SERVER] Room created: ${roomCode}, player: ${result.playerId}`);
                const room = roomManager.getRoom(result.code);
                if (room) {
                    room.updatePlayerWebSocket(result.playerId, ws);
                    playerId = result.playerId;
                }
            } else if (data.type === 'joinRoom') {
                const code = data.code;
                console.log(`[SERVER] Player joining room: ${code}`);
                const result = roomManager.joinRoom(code, ws, wsUser);

                if (result) {
                    roomCode = code;
                    playerId = result.playerId;
                    console.log(`[SERVER] Player ${playerId} joined room ${code}`);
                } else {
                    console.log(`[SERVER] Failed to join room ${code} - room full or doesn't exist`);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Room is full or does not exist'
                    }));
                }
            } else if (data.type === 'tankConfig' && roomCode && playerId) {
                console.log(`[SERVER] Player ${playerId} in room ${roomCode} selected tank config`);
                const result = roomManager.setTankConfig(roomCode, playerId, data.data);
                if (!result.success) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: result.message || 'Failed to set tank config'
                    }));
                }
            } else if (data.type === 'ready' && roomCode && playerId) {
                console.log(`[SERVER] Player ${playerId} in room ${roomCode} is ready: ${data.ready}`);
                const result = roomManager.setReady(roomCode, playerId, data.ready);
                if (!result.success) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: result.message || 'Failed to set ready status'
                    }));
                }
            } else if (data.type === 'action') {
                if (roomCode && playerId) {
                    const action = data.action || data;
                    const hasAction = action.forward || action.backward || action.turnLeft || action.turnRight ||
                        action.turretLeft || action.turretRight || action.shoot;
                    if (hasAction) {
                        console.log(`[SERVER] Player ${playerId} in room ${roomCode} sent action:`, JSON.stringify(action));
                    }
                    roomManager.handlePlayerAction(roomCode, playerId, action);
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);

    ws.on('close', (code, reason) => {
        if (roomCode && playerId) {
            console.log(`[SERVER] Player ${playerId} disconnected from room ${roomCode}`);
            roomManager.handleDisconnect(roomCode, playerId);
        } else {
            console.log('[SERVER] Client disconnected (not in room)');
        }
        clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
    });

    ws.on('pong', () => { });
});
