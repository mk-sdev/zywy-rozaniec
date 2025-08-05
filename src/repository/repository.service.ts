import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async insertOne({
    login,
    password,
  }: {
    login: string;
    password: string;
  }): Promise<void> {
    const user = this.userRepository.create({
      login,
      password,
      refreshTokens: [],
    });
    await this.userRepository.save(user);
  }

  async findOne(_id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { _id } });
  }

  async findOneByLogin(login: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { login } });
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
}
