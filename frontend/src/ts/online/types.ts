// Types for online game state

export interface ServerTank {
    id: string;
    x: number;
    y: number;
    angle: number;
    turretAngle: number;
    health: number;
    maxHealth: number;
    armor?: number;
    maxArmor?: number;
    role: 'attacker' | 'defender';
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
    color: number;
    isIdle?: boolean; // Whether the tank is idle (velocity.length === 0)
}

export interface ServerBullet {
    id: number;
    x: number;
    y: number;
    angle: number;
    type: number;
}

export interface ServerWall {
    id: number;
    x: number;
    y: number;
    angle: number;
    materialNum: number; // 0=Grass, 1=Ground, 2=Sandstone
    shapeNum: number; // 0=Rect, 1=Square
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

export interface GameWorldSnapshot {
    tanks: ServerTank[];
    bullets: ServerBullet[];
    walls: ServerWall[];
    items: ServerItem[];
    explosions?: ServerExplosion[]; // Optional: tank explosions from this tick
    grenadeExplosions?: ServerGrenadeExplosion[]; // Optional: grenade explosions from this tick
    keysCollected: number;
    currentLevel: number;
    timeElapsed: number;
}
