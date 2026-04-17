#!/usr/bin/env node
/**
 * Обёртка: вся логика в scripts/seed-test-data.js (--only=presets).
 */
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, 'seed-test-data.js');
const extra = process.argv.slice(2);
const r = spawnSync(process.execPath, [script, '--only=presets', ...extra], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
