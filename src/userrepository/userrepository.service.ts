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

  async findOne(email: string) {
    return this.userModel.findOne({ email });
  }

  async addRefreshToken(email: string, token: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshtokens) {
      user.refreshtokens = [];
    }

    // Unikamy duplikatów
    if (!user.refreshtokens.includes(token)) {
      user.refreshtokens.push(token);
      await user.save();
    }
  }

  async replaceRefreshToken(email: string, oldToken: string, newToken: string) {
    const user = await this.userModel.findOne({ email });
    if (!user || !user.refreshtokens) return;

    const index = user.refreshtokens.indexOf(oldToken);
    if (index !== -1) {
      user.refreshtokens[index] = newToken;
      await user.save();
    } else {
      // fallback – dodaj nowy jeśli stary nie znaleziony
      user.refreshtokens.push(newToken);
      await user.save();
    }
  }

  async removeRefreshToken(email: string, token: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshtokens = (user.refreshtokens || []).filter((t) => t !== token);
    await user.save();
  }

  async findOneByToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ verificationToken: token });
  }
}
