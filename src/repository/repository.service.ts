import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';

@Injectable()
export class RepositoryService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async insertOne({ email, password }: { email: string; password: string }) {
    const created = new this.userModel({ email, password });
    return created.save();
  }

  async findOne(id: string) {
    return this.userModel.findOne({ _id: id });
  }

  async findOneByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findOneByToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ verificationToken: token });
  }

  async findOneByEmailToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ emailChangeToken: token });
  }

  async findOneByPasswordResetToken(
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ passwordResetToken: token });
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id, refreshTokens: { $ne: token } }, // $ne helps to avoid duplicates
      { $push: { refreshTokens: token } },
    );
  }

  async replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const result = await this.userModel.updateOne(
      { _id: id, refreshTokens: oldToken },
      { $set: { 'refreshTokens.$': newToken } },
    );

    // if old token hasn't been found, just add a new one
    if (result.matchedCount === 0) {
      await this.userModel.updateOne(
        { _id: id },
        { $push: { refreshTokens: newToken } },
      );
    }
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: token } },
    );
  }

  async setVerificationToken(
    userId: string,
    token: string,
    expiresAt: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          verificationToken: token,
          emailChangeTokenExpires: expiresAt,
        },
      },
    );
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          isDeletionPending: false,
          deletionScheduledAt: undefined,
        },
      },
    );
  }

  async updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          refreshTokens: [],
        },
      },
    );
  }

  async setNewPasswordFromResetToken(token: string, newPassword: string) {
    await this.userModel.updateOne(
      { passwordResetToken: token },
      {
        $set: {
          password: newPassword,
          refreshTokens: [],
        },
        $unset: {
          passwordResetToken: '',
          passwordResetTokenExpires: '',
        },
      },
    );
  }

  async markUserForDeletion(
    email: string,
    deletionScheduledAt: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          isDeletionPending: true,
          deletionScheduledAt,
        },
      },
    );
  }

  async markEmailChangePending(
    id: string,
    pendingEmail: string,
    emailChangeToken: string,
    emailChangeTokenExpires: number,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          pendingEmail,
          emailChangeToken,
          emailChangeTokenExpires,
        },
      },
    );
  }

  async verifyAccount(id: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          isVerified: true,
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpires: '',
        },
      },
    );
  }

  async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          email: newEmail,
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpires: null,
        },
      },
    );
  }

  async remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ) {
    await this.userModel.updateOne(
      { email },
      {
        $set: {
          passwordResetToken: resetToken,
          passwordResetTokenExpires,
        },
      },
    );
  }
}
