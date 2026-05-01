import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { CreateSubscriptionRequest } from './request/create-subscription.request';

@Injectable()
export class SubscriptionService {
  constructor(@InjectModel(Subscription.name) private readonly subscriptionModel: Model<SubscriptionDocument>) { };

  async createSubscription(requestBody: CreateSubscriptionRequest): Promise<UpdateWriteOpResult> {
    return await this.subscriptionModel.updateOne(
      { email: requestBody.email },
      { $setOnInsert: requestBody },
      { upsert: true }
    );
  };
};
