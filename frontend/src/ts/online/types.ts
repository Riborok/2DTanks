// Types for online game state

export interface ServerTank {
    id: string;
    playerId?: string;
    x: number;
    y: number;
    angle: number;
    turretAngle: number;
    health: number;
    maxHealth: number;
    armor?: number;
    maxArmor?: number;
    role: 'attacker' | 'defender' | 'fighter';
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
    color: number;
    isIdle?: boolean; // Whether the tank is idle (velocity.length === 0)
    /** Активен перк щита (сервер): клиент рисует синее кольцо */
    shieldActive?: boolean;
}

export interface ServerBullet {
    id: number;
    x: number;
    y: number;
    angle: number;
    type: number;
    /** id танка-источника (сервер `sourceId`) — для SFX своего выстрела; в старых повторах может отсутствовать */
    sourceTankId?: string;
}

export interface ServerWall {
    id: number;
    x: number;
    y: number;
    angle: number;
    materialNum: number; // 0=Grass, 1=Ground, 2=Sandstone
    shapeNum: number; // 0=Rect, 1=Square
}

export interface ServerCrate {
    id: number;
    x: number;
    y: number;
    angle: number;
    materialNum: number;
    shapeNum: number;
    /** Вариант спрайта разрушаемого блока (0…N), клиент `DestructibleCrateSprite`. */
    skinIndex?: number;
    hp: number;
    maxHp: number;
}

export interface ServerItem {
    id: number;
    x: number;
    y: number;
    type: number; // Bonus enum value
}

export interface ServerExplosion {
    x: number;
    y: number;
    angle: number;
}

export interface ServerGrenadeExplosion {
    x: number;
    y: number;
    angle: number;
    size: number;
}

/** Non-grenade bullet hit — client plays BulletImpactAnimation */
export interface ServerBulletImpact {
    x: number;
    y: number;
    angle: number;
    bulletType: number;
}

/** Удар корпуса танка (сервер, нормальный импульс контакта) — для SFX без эвристик. */
export interface ServerHullCollision {
    tick: number;
    x: number;
    y: number;
    playerId: string;
}

export interface GameWorldSnapshot {
    tanks: ServerTank[];
    bullets: ServerBullet[];
    walls: ServerWall[];
    crates?: ServerCrate[];
    items: ServerItem[];
    explosions?: ServerExplosion[]; // Optional: tank explosions from this tick
    grenadeExplosions?: ServerGrenadeExplosion[]; // Optional: grenade explosions from this tick
    bulletImpacts?: ServerBulletImpact[];
    hullCollisions?: ServerHullCollision[];
    backgroundMaterial?: number;
    wallMaterial?: number;
    keysCollected: number;
    currentLevel: number;
    timeElapsed: number;
    gameMode?: 'standard' | 'deathmatch';
    /** Длина раунда FFA (сек), с сервера — для UI без захардкоженного 60 */
    deathmatchDurationSec?: number;
    deathmatchRemainingSec?: number;
    /** Лимит матча с ключами (сек) или null в практике/соло — с сервера */
    standardTimeLimitSec?: number | null;
    killScores?: Record<string, number>;
}
