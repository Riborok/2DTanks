/**
 * Создаёт недостающие PNG под пути из ImagePreloader и UI,
 * копируя нейтральную заглушку (1x1 transparent). Нужен после клонирования репозитория,
 * если полный пакет арта не приложен к проекту.
 *
 * Запуск из каталога frontend: npm run ensure-assets
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const imgRoot = path.join(frontendRoot, 'src/img');

/** Минимальный валидный PNG 1×1 (прозрачный), если шаблона нет */
const FALLBACK_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
);

function collectRelativePaths() {
    const rel = [];
    const MATERIAL = ['Grass', 'Ground', 'Sandstone'];

    for (const material of MATERIAL) {
        rel.push(`backgrounds/${material}_0.png`);
        rel.push(`backgrounds/${material}_1.png`);
    }
    for (let i = 0; i < 5; i++) {
        rel.push(`tanks/Bullets/Bullet_${i}.png`);
    }
    for (const material of MATERIAL) {
        rel.push(`blocks/${material}_0.png`);
        rel.push(`blocks/${material}_1.png`);
    }
    const hullTurretColors = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let hullNum = 0; hullNum < 8; hullNum++) {
        for (const c of hullTurretColors) {
            rel.push(`tanks/Hulls/Hull_${hullNum}/Hull_${c}.png`);
        }
    }
    for (let turretNum = 0; turretNum < 8; turretNum++) {
        for (const c of hullTurretColors) {
            rel.push(`tanks/Turrets/Turret_${turretNum}/Turret_${c}.png`);
        }
    }
    for (let weaponNum = 0; weaponNum < 8; weaponNum++) {
        rel.push(`tanks/Weapons/Weapon_${weaponNum}.png`);
    }
    for (let trackNum = 0; trackNum < 4; trackNum++) {
        rel.push(`tanks/Tracks/Track_${trackNum}.png`);
        rel.push(`tanks/Tracks/Track_${trackNum}_Solo.png`);
    }

    rel.push(
        'item/Key.png',
        'item/Light_Bullet_Box.png',
        'item/Medium_Bullet_Box.png',
        'item/Heavy_Bullet_Box.png',
        'item/Grenade_Bullet_Box.png',
        'item/Sniper_Bullet_Box.png'
    );

    rel.push(
        'tanks/Effects/Sprites/Sprite_Effects_Explosion.png',
        'tanks/Effects/Sprites/Grenade_Effects_Explosion.png',
        'tanks/Effects/Sprites/Sprite_Effects_Smoke.png',
        'tanks/Effects/Movement/Movement.png'
    );
    for (let type = 0; type < 2; type++) {
        rel.push(`tanks/Effects/Tire Tracks/Tire_Track_${type}.png`);
        rel.push(`tanks/Effects/Tire Tracks/Tire_Track_Chain_${type}.png`);
    }
    rel.push(
        'tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_0.png',
        'tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_1.png',
        'tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_0.png',
        'tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_1.png'
    );

    rel.push('icon.png');

    return [...new Set(rel)];
}

function main() {
    // Нейтральный шаблон: не маскируем отсутствие арта под "щит" в UI.
    const template = FALLBACK_PNG;

    let created = 0;
    let skipped = 0;
    for (const rel of collectRelativePaths()) {
        const full = path.join(imgRoot, rel);
        if (fs.existsSync(full)) {
            skipped++;
            continue;
        }
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, template);
        created++;
    }
    console.log(
        `[ensure-game-assets] template=embedded 1x1 PNG created=${created} skipped(existing)=${skipped}`
    );
}

main();
