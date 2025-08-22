import { InjectRepository } from '@nestjs/typeorm';
import { Help } from './help.entity';
import { Repository } from 'typeorm';
import { Item } from './item.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HelpRepositoryService {
  constructor(
    @InjectRepository(Help)
    private helpRepository: Repository<Help>,
  ) {}

  async getOne(): Promise<Help | null> {
    return await this.helpRepository.findOne({ where: { index: 1 } });
  }

  async updateOne(data: Array<Item>): Promise<void> {
    const existing = await this.getOne();

    if (existing) {
      existing.data = data;
      await this.helpRepository.save(existing);
    }
  }
}
