import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PublicationDocument = Publication & Document;

@Schema()
export class Publication {
  @Prop({ required: true })
  part: string; // radosna, bolesna, chwalebna, światła

  @Prop({
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} nie jest liczbą całkowitą',
    },
  })
  mystery: number;

  @Prop({ required: true })
  index: number;

  @Prop({ required: true })
  title: string;

  @Prop([
    {
      type: {
        type: String, // Text | Image | Video | Game
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
