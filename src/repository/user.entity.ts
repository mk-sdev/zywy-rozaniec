import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './refreshToken.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  // @Index()
  @Column({ unique: true })
  login: string;

  @Column()
  password: string;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens: RefreshToken[];
}
