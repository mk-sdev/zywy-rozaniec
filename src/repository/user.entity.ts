import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  _id: string;

  @Column({ unique: true })
  @Index()
  login: string;

  @Column()
  password: string;

  @Column('simple-array')
  refreshTokens: string[];
}
