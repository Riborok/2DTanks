import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env.test') });
dotenv.config();

const dbUrl = process.env.TEST_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (dbUrl) {
    process.env.DATABASE_URL = dbUrl;
}

if (!process.env.JWT_SECRET?.trim()) {
    process.env.JWT_SECRET = 'jest-integration-secret-key-min-32-chars!!';
}
