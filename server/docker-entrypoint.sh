#!/bin/sh
set -e
node scripts/run-migrations.js
exec npm start
