import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RefreshToken } from './refreshToken.entity';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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
    });
    await this.userRepository.save(user);
  }

  async findOne(_id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { _id },
      relations: ['refreshTokens'], // <- ważne!
    });
  }

  async findOneByLogin(login: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { login } });
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    const user = await this.findOne(id);
    if (user) {
      const rt = this.refreshTokenRepository.create({ token, user });
      await this.refreshTokenRepository.save(rt);
    }
  }

  async replaceRefreshToken(
    id: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    const user = await this.findOne(id);
    if (!user) return;

    // Znajdź stary token
    const existing = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, user: { _id: id } },
    });

    if (existing) {
      await this.refreshTokenRepository.remove(existing);
    }

    // Dodaj nowy
    const newEntry = this.refreshTokenRepository.create({
      token: newToken,
      user,
    });
    await this.refreshTokenRepository.save(newEntry);
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token });
  }

  async trimRefreshTokens(userId: string, maxTokens = 5): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { user: { _id: userId } },
      order: { token: 'ASC' },
    });

    const excess = tokens.length - maxTokens;
    if (excess > 0) {
      const toRemove = tokens.slice(0, excess);
      await this.refreshTokenRepository.remove(toRemove);
    }
  }

  async updatePassword(
    login: string,
    newHashedPassword: string,
  ): Promise<void> {
    const user = await this.findOneByLogin(login);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newHashedPassword;
    await this.userRepository.save(user);

    // Usuń wszystkie tokeny odświeżania
    // await this.refreshTokenRepository.delete({ user: { _id: user._id } });
  }
}
