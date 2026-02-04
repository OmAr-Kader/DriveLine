import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, IsEnum, Min, Max, MaxLength } from 'class-validator';
import Stripe from 'stripe';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  @MaxLength(255)
  customerId: string;

  @IsString()
  @MaxLength(255)
  priceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentMethodId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trialPeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  couponId?: string;

  @IsOptional()
  @IsNumber()
  billingCycleAnchor?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class UpdateSubscriptionDto {
  @IsString()
  @MaxLength(255)
  subscriptionId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  priceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsEnum(['create_prorations', 'none', 'always_invoice'])
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;

  @IsOptional()
  trialEnd?: number | 'now';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  couponId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class CancelSubscriptionDto {
  @IsString()
  @MaxLength(255)
  subscriptionId: string;

  @IsOptional()
  @IsBoolean()
  cancelImmediately?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}
