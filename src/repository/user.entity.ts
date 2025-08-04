import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  _id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column('simple-array', { default: '' })
  refreshTokens: string[];

  // * for email change

  @Column({ nullable: true })
  pendingEmail?: string;

  @Column({ nullable: true })
  @Index({ unique: false, where: 'emailChangeToken IS NOT NULL' })
  emailChangeToken?: string;

  @Column({ type: 'bigint', nullable: true })
  emailChangeTokenExpires?: number;

  // * for password change

  @Column({ nullable: true })
  @Index({ unique: false, where: 'passwordResetToken IS NOT NULL' })
  passwordResetToken?: string;

  @Column({ type: 'bigint', nullable: true })
  passwordResetTokenExpires?: number;
}
