import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Publication } from './src/repository/publication.entity';
import { User } from './src/repository/user.entity';
import { RefreshToken } from './src/repository/refreshToken.entity';

const isCompiled = __filename.includes('dist') || __dirname.includes('dist');

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306') || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'zywy_rozaniec',
  entities: [Publication, User, RefreshToken],
  migrations: [
    isCompiled
      ? 'dist/migrations/*.js' // to start the app
      : 'src/migrations/*.ts', // to migrate the db
  ],
  synchronize: false,
});
