import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Publication } from './src/repository/publication.entity';
import { User } from './src/repository/user.entity';
import { RefreshToken } from './src/repository/refreshToken.entity';
import { Help } from './src/repository/help.entity';

const isCompiled = __filename.includes('dist') || __dirname.includes('dist');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'zywy_rozaniec',
  entities: [Publication, User, RefreshToken, Help],
  migrations: [
    isCompiled
      ? 'dist/migrations/*.js' // to start the app
      : 'src/migrations/*.ts', // to migrate the db
  ],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false, // Neon wymaga SSL, ale nie pełnej weryfikacji certyfikatu
  },
});
