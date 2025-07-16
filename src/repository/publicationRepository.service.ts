import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicationDocument } from './publication.schema';

@Injectable()
export class PublicationRepositoryService {
  constructor(
    @InjectModel('Publication')
    private publicationModel: Model<PublicationDocument>,
  ) {}

  getOneByDay(index: number): Promise<PublicationDocument | null> {
    return this.publicationModel.findOne({ index });
  }

  async getAllPublications(): Promise<PublicationDocument[]> {
    return this.publicationModel.find().exec();
  }

  async insertOne(
    index: number,
    data: Array<{
      type: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.publicationModel.create({ index, data });
  }

  async updateOne(
    index: number,
    data: Array<{
      type: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.publicationModel.updateOne({ index }, { $set: { data } });
  }
}
