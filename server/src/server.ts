import 'dotenv/config';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './room/RoomManager';
import { parseWsUserFromRequest } from './ws/parseWsUser';
import type { WsAuthUser } from './auth/types';
import { resolveListenPort } from './serverPort';
import { getPool } from './db/pool';
import * as friendshipsRepo from './repos/friendshipsRepo';
import { registerUserSocket, unregisterUserSocket, notifyUserSockets } from './ws/userSocketRegistry';
import { createHttpApp } from './createHttpApp';

const PORT = resolveListenPort();

const app = createHttpApp();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

// Rate-limit для социальных сообщений (пинги 2 msg/sec, чат 1 msg/sec).
// Хранится в памяти — при рестарте сбрасывается, чего достаточно для
// анти-спама «в рамках сессии». В прод пригодится TTL/cleanup по inactivity.
const pingRateByPlayer = new Map<string, number>();
const chatRateByPlayer = new Map<string, number>();
const inviteRateBySender = new Map<string, number>();
const inviteRateByPair = new Map<string, number>();

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

    registerUserSocket(wsUser.userId, ws);

    let playerId: string | null = null;
    let roomCode: string | null = null;
    let spectatorId: string | null = null;
    let spectatorRoomCode: string | null = null;
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
                const mode: string = typeof data.mode === 'string' ? data.mode : 'deathmatch';
                const singlePlayerTest = mode === 'solo';
                const practiceMode = mode === 'practice';
                const deathmatchMode = mode === 'deathmatch';
                console.log(`[SERVER] Creating new room, mode=${mode}`);
                const result = roomManager.createRoom(singlePlayerTest, wsUser, practiceMode, deathmatchMode);
                roomCode = result.code;
                console.log(`[SERVER] Room created: ${roomCode}, player: ${result.playerId}`);
                const room = roomManager.getRoom(result.code);
                if (room) {
                    room.updatePlayerWebSocket(result.playerId, ws);
                    playerId = result.playerId;
                }
            } else if (data.type === 'joinRoom') {
                const code = String(data.code || '').trim().toUpperCase();
                console.log(`[SERVER] Player joining room: ${code}`);
                if (roomCode && playerId && roomCode !== code) {
                    roomManager.leaveRoom(roomCode, playerId);
                    roomCode = null;
                    playerId = null;
                }
                const result = roomManager.joinRoom(code, ws, wsUser);

                if (result) {
                    roomCode = code;
                    playerId = result.playerId;
                    console.log(`[SERVER] Player ${playerId} joined room ${code}`);
                } else {
                    console.log(`[SERVER] Failed to join room ${code} - room full or doesn't exist`);
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            message: 'Room is full or does not exist'
                        })
                    );
                }
            } else if (data.type === 'tankConfig' && roomCode && playerId) {
                console.log(`[SERVER] Player ${playerId} in room ${roomCode} selected tank config`);
                const result = roomManager.setTankConfig(roomCode, playerId, data.data);
                if (!result.success) {
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            message: result.message || 'Failed to set tank config'
                        })
                    );
                }
            } else if (data.type === 'ready' && roomCode && playerId) {
                console.log(`[SERVER] Player ${playerId} in room ${roomCode} is ready: ${data.ready}`);
                const result = roomManager.setReady(roomCode, playerId, data.ready);
                if (!result.success) {
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            message: result.message || 'Failed to set ready status'
                        })
                    );
                }
            } else if (data.type === 'action') {
                if (roomCode && playerId) {
                    const action = data.action || data;
                    const hasAction =
                        action.forward ||
                        action.backward ||
                        action.turnLeft ||
                        action.turnRight ||
                        action.turretLeft ||
                        action.turretRight ||
                        action.shoot;
                    if (hasAction) {
                        console.log(`[SERVER] Player ${playerId} in room ${roomCode} sent action:`, JSON.stringify(action));
                    }
                    roomManager.handlePlayerAction(roomCode, playerId, action);
                }
            } else if (data.type === 'ping:send' && roomCode && playerId) {
                const allowed: Array<'careful' | 'enemy' | 'attack' | 'retreat'> = ['careful', 'enemy', 'attack', 'retreat'];
                const pingType = allowed.includes(data.pingType) ? data.pingType : null;
                const x = Number(data.x);
                const y = Number(data.y);
                if (pingType && Number.isFinite(x) && Number.isFinite(y)) {
                    // Простейший rate-limit: не чаще 2 пингов в секунду на игрока
                    const nowTs = Date.now();
                    const last = pingRateByPlayer.get(playerId) ?? 0;
                    if (nowTs - last >= 500) {
                        pingRateByPlayer.set(playerId, nowTs);
                        const room = roomManager.getRoom(roomCode);
                        room?.broadcast({
                            type: 'ping:msg',
                            fromId: playerId,
                            x,
                            y,
                            pingType,
                            at: nowTs
                        });
                    }
                }
            } else if (data.type === 'chat:send' && roomCode && playerId) {
                const text = String(data.text ?? '')
                    .trim()
                    .slice(0, 200);
                if (text) {
                    const nowTs = Date.now();
                    const last = chatRateByPlayer.get(playerId) ?? 0;
                    if (nowTs - last >= 1000) {
                        chatRateByPlayer.set(playerId, nowTs);
                        const room = roomManager.getRoom(roomCode);
                        room?.broadcast({
                            type: 'chat:msg',
                            fromId: playerId,
                            fromName: room.getPlayerDisplayName(playerId) ?? 'Игрок',
                            text,
                            at: nowTs
                        });
                    }
                }
            } else if (data.type === 'invite:send' && roomCode && playerId) {
                const targetUserId = String(data.targetUserId ?? '').trim();
                if (!targetUserId || targetUserId === wsUser.userId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Укажите друга' }));
                    return;
                }
                const room = roomManager.getRoom(roomCode);
                if (!room) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Комната не найдена' }));
                    return;
                }
                const pub = room.getPublicInfo();
                if (pub.singlePlayerTest) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Из соло-комнаты нельзя пригласить' }));
                    return;
                }
                if (room.hasUser(targetUserId)) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Игрок уже в этой комнате' }));
                    return;
                }
                const pool = getPool();
                if (!pool) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Сервис временно недоступен' }));
                    return;
                }
                void (async () => {
                    try {
                        if (await friendshipsRepo.isBlockedBetween(pool, wsUser.userId, targetUserId)) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Нельзя пригласить этого пользователя' }));
                            return;
                        }
                        if (!(await friendshipsRepo.areAcceptedFriends(pool, wsUser.userId, targetUserId))) {
                            ws.send(
                                JSON.stringify({
                                    type: 'error',
                                    message: 'Инвайт доступен только принятым друзьям'
                                })
                            );
                            return;
                        }
                        const nowTs = Date.now();
                        const lastGlobal = inviteRateBySender.get(wsUser.userId) ?? 0;
                        if (nowTs - lastGlobal < 2000) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Слишком часто. Подождите пару секунд.' }));
                            return;
                        }
                        const pairKey = `${wsUser.userId}\t${targetUserId}`;
                        const lastPair = inviteRateByPair.get(pairKey) ?? 0;
                        if (nowTs - lastPair < 8000) {
                            ws.send(
                                JSON.stringify({
                                    type: 'error',
                                    message: 'Этому другу уже недавно отправляли приглашение.'
                                })
                            );
                            return;
                        }
                        inviteRateBySender.set(wsUser.userId, nowTs);
                        inviteRateByPair.set(pairKey, nowTs);

                        notifyUserSockets(targetUserId, {
                            type: 'invite:msg',
                            roomCode,
                            fromUserId: wsUser.userId,
                            fromLogin: wsUser.login,
                            fromDisplayName: wsUser.displayName,
                            practiceMode: pub.practiceMode,
                            deathmatchMode: pub.deathmatchMode,
                            singlePlayerTest: pub.singlePlayerTest,
                            at: nowTs
                        });
                        ws.send(JSON.stringify({ type: 'invite:sent', targetUserId, roomCode }));
                    } catch (e) {
                        console.error('[invite:send]', e);
                        try {
                            ws.send(JSON.stringify({ type: 'error', message: 'Не удалось отправить приглашение' }));
                        } catch {
                            /* ignore */
                        }
                    }
                })();
            } else if (data.type === 'spectate:list') {
                // Вернуть список комнат, которые можно смотреть.
                ws.send(
                    JSON.stringify({
                        type: 'spectate:list',
                        rooms: roomManager.listWatchableRooms()
                    })
                );
            } else if (data.type === 'spectate:join') {
                const targetCode = String(data.code || '').trim().toUpperCase();
                if (!targetCode) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Не указана комната' }));
                    return;
                }
                // Если клиент уже игрок в комнате — запрещаем наблюдение.
                if (roomCode && playerId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Нельзя смотреть во время игры' }));
                    return;
                }
                if (spectatorId && spectatorRoomCode) {
                    roomManager.handleSpectatorDisconnect(spectatorRoomCode, spectatorId);
                    spectatorId = null;
                    spectatorRoomCode = null;
                }
                const result = roomManager.spectateRoom(targetCode, ws, wsUser);
                if (!result) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Комната не найдена или пуста' }));
                    return;
                }
                spectatorId = result.spectatorId;
                spectatorRoomCode = result.code;
            } else if (data.type === 'spectate:leave') {
                if (spectatorId && spectatorRoomCode) {
                    roomManager.handleSpectatorDisconnect(spectatorRoomCode, spectatorId);
                    spectatorId = null;
                    spectatorRoomCode = null;
                    ws.send(JSON.stringify({ type: 'spectate:left' }));
                }
            } else if (data.type === 'leaveGame') {
                if (roomCode && playerId) {
                    roomManager.leaveRoom(roomCode, playerId);
                    roomCode = null;
                    playerId = null;
                    ws.send(
                        JSON.stringify({
                            type: 'leftGame'
                        })
                    );
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                })
            );
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
        unregisterUserSocket(wsUser.userId, ws);
        if (roomCode && playerId) {
            console.log(`[SERVER] Player ${playerId} disconnected from room ${roomCode}`);
            roomManager.handleDisconnect(roomCode, playerId);
        } else if (spectatorId && spectatorRoomCode) {
            roomManager.handleSpectatorDisconnect(spectatorRoomCode, spectatorId);
        } else {
            console.log('[SERVER] Client disconnected (not in room)');
        }
        clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
    });

    ws.on('pong', () => {});
});
