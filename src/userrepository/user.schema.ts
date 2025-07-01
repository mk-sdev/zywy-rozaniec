import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({
    required: true,
    unique: true,
    validate: {
      validator: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: 'Invalid email format',
    },
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  refreshtoken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
