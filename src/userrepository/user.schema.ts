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

  @Prop({ default: [] })
  refreshtokens?: string[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ index: true, sparse: true })
  verificationToken?: string;

  @Prop()
  pendingEmail?: string; // tymczasowy adres e-mail do potwierdzenia

  @Prop({ index: true, sparse: true })
  emailChangeToken?: string; // token do weryfikacji

  @Prop()
  emailChangeTokenExpires?: number; // timestamp ważności tokena
}

export const UserSchema = SchemaFactory.createForClass(User);
