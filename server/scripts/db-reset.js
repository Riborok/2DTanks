#!/usr/bin/env node
/**
 * Полный reset БД: wipe + migrate.
 * Использование:
 *   npm run db:reset
 */

const path = require('path');
const { spawn } = require('child_process');

const serverRoot = path.join(__dirname, '..');

function runNodeScript(scriptRelativePath) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(serverRoot, scriptRelativePath)], {
            cwd: serverRoot,
            stdio: 'inherit',
            env: process.env
        });
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`Скрипт ${scriptRelativePath} завершился с кодом ${code}`));
        });
        child.on('error', reject);
    });
}

async function main() {
    await runNodeScript('scripts/db-wipe.js');
    await runNodeScript('scripts/run-migrations.js');
    console.log('[db:reset] Готово: БД очищена и миграции применены.');
}

main().catch((err) => {
    console.error('[db:reset] Ошибка:', err.message || err);
    process.exit(1);
});
