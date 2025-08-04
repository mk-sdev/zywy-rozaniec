import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async insertOne({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    const user = this.userRepository.create({
      email,
      password,
      refreshTokens: [],
    });
    await this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { _id: id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneByVerificationToken(token: string): Promise<User | null> {
    // return this.userRepository.findOne({ where: { verificationToken: token } });
    return null;
  }

  async findOneByEmailToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { emailChangeToken: token } });
  }

  async findOneByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    const user = await this.findOne(id);
    if (user) {
      user.refreshTokens.push(token);
      await this.userRepository.save(user);
    }
  }

  async replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const user = await this.findOne(id);
    if (user) {
      const index = user.refreshTokens.indexOf(oldToken);
      if (index !== -1) {
        user.refreshTokens[index] = newToken;
      } else {
        user.refreshTokens.push(newToken);
      }
      await this.userRepository.save(user);
    }
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    const user = await this.findOne(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await this.userRepository.save(user);
    }
  }

  async trimRefreshTokens(userId: string, maxTokens = 5): Promise<void> {
    const user = await this.findOne(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.slice(-maxTokens);
      await this.userRepository.save(user);
    }
  }

  async setNewVerificationToken(
    email: string,
    password: string,
    token: string,
    expiresAt: number,
  ): Promise<void> {
    // const user = await this.findOneByEmail(email);
    // if (user) {
    //   user.password = password;
    //   user.verificationToken = token;
    //   user.verificationTokenExpires = expiresAt;
    //   await this.userRepository.save(user);
    // }
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    // const user = await this.findOne(userId);
    // if (user) {
    //   user.isDeletionPending = false;
    //   user.deletionScheduledAt = undefined;
    //   await this.userRepository.save(user);
    // }
  }

  async updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    const user = await this.findOneByEmail(email);
    if (user) {
      user.password = hashedPassword;
      user.refreshTokens = [];
      await this.userRepository.save(user);
    }
  }

  async setNewPasswordFromResetToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOneByPasswordResetToken(token);
    if (user) {
      user.password = newPassword;
      user.refreshTokens = [];
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await this.userRepository.save(user);
    }
  }

  async markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void> {
    // const user = await this.findOneByEmail(email);
    // if (user) {
    //   user.isDeletionPending = true;
    //   user.deletionScheduledAt = deletionScheduledAt;
    //   await this.userRepository.save(user);
    // }
  }

  async markEmailChangePending(
    id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void> {
    const user = await this.findOne(id);
    if (user) {
      user.pendingEmail = pendingEmail;
      user.emailChangeToken = emailChangeToken;
      user.emailChangeTokenExpires = emailChangeTokenExpires;
      await this.userRepository.save(user);
    }
  }

  async verifyAccount(id: string): Promise<void> {
    // const user = await this.findOne(id);
    // if (user) {
    //   user.isVerified = true;
    //   user.verificationToken = undefined;
    //   user.verificationTokenExpires = undefined;
    //   await this.userRepository.save(user);
    // }
  }

  async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
    const user = await this.findOne(userId);
    if (user) {
      user.email = newEmail;
      user.pendingEmail = undefined;
      user.emailChangeToken = undefined;
      user.emailChangeTokenExpires = undefined;
      await this.userRepository.save(user);
    }
  }

  async remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ): Promise<void> {
    const user = await this.findOneByEmail(email);
    if (user) {
      user.passwordResetToken = resetToken;
      user.passwordResetTokenExpires = passwordResetTokenExpires;
      await this.userRepository.save(user);
    }
  }
}
