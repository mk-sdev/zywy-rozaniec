import { ConflictException, Injectable } from '@nestjs/common';
import { UserrepositoryService } from './userrepository/userrepository.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(private userRepository: UserrepositoryService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findOne(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10); // 10 salt rounds

    await this.userRepository.insertOne({
      email,
      password: hashedPassword,
    });
  }
}
