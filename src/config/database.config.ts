import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || '4ami_user',
  password: process.env.DB_PASSWORD || '4ami_password',
  database: process.env.DB_DATABASE || '4ami_db',
}));
