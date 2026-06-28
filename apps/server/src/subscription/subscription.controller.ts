import { Controller, Post, Body, Header } from '@nestjs/common';
import { UpdateWriteOpResult } from 'mongoose';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionRequest } from './request/create-subscription.request';

@Controller({ path: 'subscription', version: '1' })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { };

  @Post('create-subscription')
  @Header('Content-Type', 'application/json; charset=utf-8')
  async createSubscription(@Body() requestBody: CreateSubscriptionRequest): Promise<UpdateWriteOpResult> {
    return await this.subscriptionService.createSubscription(requestBody);
  };
};
