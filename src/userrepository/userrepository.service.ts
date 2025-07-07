import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';

@Injectable()
export class UserrepositoryService {
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

  async addRefreshToken(id: string, token: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshtokens) {
      user.refreshtokens = [];
    }

    // Avoid duplicates
    if (!user.refreshtokens.includes(token)) {
      user.refreshtokens.push(token);
      await user.save();
    }
  }

  async replaceRefreshToken(id: string, oldToken: string, newToken: string) {
    const user = await this.findOne(id);
    if (!user || !user.refreshtokens) return;

    const index = user.refreshtokens.indexOf(oldToken);
    if (index !== -1) {
      user.refreshtokens[index] = newToken;
      await user.save();
    } else {
      // fallback - add new if the old one wasn't found
      user.refreshtokens.push(newToken);
      await user.save();
    }
  }

  async removeRefreshToken(id: string, token: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshtokens = (user.refreshtokens || []).filter((t) => t !== token);
    await user.save();
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
          refreshtokens: [],
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
