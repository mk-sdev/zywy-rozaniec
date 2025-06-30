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
}
