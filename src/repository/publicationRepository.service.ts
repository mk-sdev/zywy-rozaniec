import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from './publication.entity';

type Item = {
  type: string;
  value: string;
  options?: Record<string, unknown>;
};

@Injectable()
export class PublicationRepositoryService {
  constructor(
    @InjectRepository(Publication)
    private publicationRepository: Repository<Publication>,
  ) {}

  // getOneByDay(index: number): Promise<Publication | null> {
  //   return this.publicationRepository.findOne({ where: { index } });
  // }

  getOne(
    part: string,
    mystery: number,
    index: number,
  ): Promise<Publication | null> {
    return this.publicationRepository.findOne({
      where: { part, mystery, index },
    });
  }

  async getAllPublications(): Promise<Publication[]> {
    return this.publicationRepository.find();
  }

  async getSomePublications(
    part: string,
    mystery: number,
  ): Promise<Publication[]> {
    return this.publicationRepository.find({ where: { part, mystery } });
  }

  async insertOne(
    index: number,
    mystery: number,
    part: string,
    title: string,
    data: Array<Item>,
    quote: Array<Item>,
    task: Array<Item>,
  ): Promise<void> {
    const publication = this.publicationRepository.create({
      index,
      mystery,
      part,
      title,
      data,
      quote,
      task,
    });
    await this.publicationRepository.save(publication);
  }

  async updateOne(
    index: number,
    mystery: number,
    part: string,
    title: string,
    data: Array<Item>,
    quote: Array<Item>,
    task: Array<Item>,
  ): Promise<void> {
    const existing = await this.publicationRepository.findOne({
      where: { index, mystery, part },
    });

    if (existing) {
      existing.title = title;
      existing.data = data;
      existing.quote = quote;
      existing.task = task;
      await this.publicationRepository.save(existing);
    }
  }
}
