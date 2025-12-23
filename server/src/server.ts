import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './room/RoomManager';

const PORT = process.env.PORT || 3000;

const wss = new WebSocketServer({ port: Number(PORT) });
const roomManager = new RoomManager();

console.log(`Server started on port ${PORT}`);

wss.on('connection', (ws: WebSocket, req) => {
    console.log('New client connected from', req.socket.remoteAddress);
    console.log('WebSocket readyState:', ws.readyState);
    
    let playerId: string | null = null;
    let roomCode: string | null = null;

    ws.on('message', (message: Buffer) => {
        try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'createRoom') {
                console.log('[SERVER] Creating new room...');
                const result = roomManager.createRoom();
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
                const result = roomManager.joinRoom(code, ws);
                
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

    // Send ping to keep connection alive
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

    ws.on('pong', () => {
        // Client responded to ping, connection is alive
    });
});


