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

  getOne(
    part: string,
    mystery: number,
    index: number,
  ): Promise<PublicationDocument | null> {
    return this.publicationModel.findOne({ part, mystery, index }).exec();
  }

  //TODO: handle null
  async getAllPublications(): Promise<PublicationDocument[]> {
    return this.publicationModel.find().exec();
  }

  async getSomePublications(
    part: string,
    mystery: number,
  ): Promise<PublicationDocument[] | null> {
    return this.publicationModel.find({ part, mystery }).exec();
  }

  async insertOne(
    index: number,
    mystery: number,
    part: string,
    title: string,
    data: Array<{
      type: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.publicationModel.create({ index, mystery, part, title, data });
  }

  async updateOne(
    index: number,
    mystery: number,
    part: string,
    title: string,
    data: Array<{
      type: string;
      value: string;
      options?: Record<string, unknown>;
    }>,
  ): Promise<void> {
    await this.publicationModel.updateOne(
      { index, mystery, part },
      { $set: { title, data } },
    );
  }
}
