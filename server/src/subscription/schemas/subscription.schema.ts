import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email?: string;
};

export const SubscriptionSchema: MongooseSchema<Subscription> = SchemaFactory.createForClass(Subscription);
