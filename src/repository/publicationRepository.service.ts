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

  getOneByDay(day: string): Promise<PublicationDocument | null> {
    return this.publicationModel.findOne({ day });
  }

  async insertOneOrUpdate(publication: {
    day: string;
    data: Array<{
      type: string;
      value: string;
      options?: Record<string, unknown>;
    }>;
  }): Promise<PublicationDocument> {
    return this.publicationModel
      .findOneAndUpdate(
        { day: publication.day },
        { $set: publication },
        { upsert: true, new: true }, // upsert = insert jeśli brak, new = zwróć nowy dokument
      )
      .exec();
  }
}
