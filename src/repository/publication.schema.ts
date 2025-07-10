import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PublicationDocument = Publication & Document;

@Schema()
export class Publication {
  @Prop({ required: true, unique: true, index: true })
  day: string;

  @Prop([
    {
      type: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
      options: {
        type: Object,
        default: {},
      },
    },
  ])
  data: Array<{
    type: string;
    value: string;
    options?: Record<string, unknown>;
  }>;
}

export const PublicationSchema = SchemaFactory.createForClass(Publication);
