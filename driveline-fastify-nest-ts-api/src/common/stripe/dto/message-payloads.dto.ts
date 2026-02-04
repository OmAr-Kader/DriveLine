import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  IsBoolean,
  IsArray,
  IsEmail,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, RefundReason, StripeEnvironment } from '../enums/stripe.enums';
import Stripe from 'stripe';

// ==================== Base Payload ====================

export class BaseMessagePayload {
  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  requesterId?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

// ==================== Customer Payloads ====================

export class AddressPayload {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

export class CreateCustomerPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPayload)
  address?: AddressPayload;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class GetOrCreateCustomerPayload extends CreateCustomerPayload {
  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class FindCustomerByIdPayload extends BaseMessagePayload {
  @IsUUID()
  customerId: string;
}

export class FindCustomerByUserIdPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class FindCustomerByStripeIdPayload extends BaseMessagePayload {
  @IsString()
  stripeCustomerId: string;
}

export class UpdateCustomerPayload extends BaseMessagePayload {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPayload)
  address?: AddressPayload;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class DeleteCustomerPayload extends BaseMessagePayload {
  @IsUUID()
  customerId: string;
}

export class SyncCustomerPayload extends BaseMessagePayload {
  @IsUUID()
  customerId: string;
}

export class ListCustomersPayload extends BaseMessagePayload {
  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== Payment Payloads ====================

export class CreatePaymentPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(50)
  @Max(99999999)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(22)
  statementDescriptor?: string;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class UpdatePaymentPayload extends BaseMessagePayload {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(99999999)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(22)
  statementDescriptor?: string;

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class ConfirmPaymentPayload extends BaseMessagePayload {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class CapturePaymentPayload extends BaseMessagePayload {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  amountToCapture?: number;
}

export class CancelPaymentPayload extends BaseMessagePayload {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

export class FindPaymentByIdPayload extends BaseMessagePayload {
  @IsUUID()
  paymentId: string;
}

export class FindPaymentByStripeIdPayload extends BaseMessagePayload {
  @IsString()
  stripePaymentIntentId: string;
}

export class ListPaymentsByUserIdPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ListPaymentsByStatusPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsArray()
  @IsEnum(PaymentStatus, { each: true })
  status: PaymentStatus[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetHeldPaymentsPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

export class SyncPaymentPayload extends BaseMessagePayload {
  @IsUUID()
  paymentId: string;
}

export class GetPaymentStatsPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

// ==================== Refund Payloads ====================

export class CreateRefundPayload extends BaseMessagePayload {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsEnum(RefundReason)
  reason?: RefundReason;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class FindRefundsByPaymentIdPayload extends BaseMessagePayload {
  @IsUUID()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ==================== Subscription Payloads ====================

export class CreateSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsUUID()
  customerId: string;

  @IsString()
  priceId: string;

  @IsOptional()
  @IsString()
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
  couponId?: string;

  @IsOptional()
  @IsNumber()
  billingCycleAnchor?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class UpdateSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  subscriptionId: string;

  @IsOptional()
  @IsString()
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
  couponId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class CancelSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  subscriptionId: string;

  @IsOptional()
  @IsBoolean()
  cancelImmediately?: boolean;
}

export class ResumeSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  subscriptionId: string;
}

export class PauseSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  subscriptionId: string;

  @IsOptional()
  @IsNumber()
  resumeAt?: number;
}

export class UnpauseSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  subscriptionId: string;
}

export class FindSubscriptionByIdPayload extends BaseMessagePayload {
  @IsUUID()
  subscriptionId: string;
}

export class FindSubscriptionByStripeIdPayload extends BaseMessagePayload {
  @IsString()
  stripeSubscriptionId: string;
}

export class ListSubscriptionsByUserIdPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetActiveSubscriptionsPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

export class HasActiveSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

export class SyncSubscriptionPayload extends BaseMessagePayload {
  @IsString()
  stripeSubscriptionId: string;
}

// ==================== Product Payloads ====================

export class CreatePricePayload {
  @IsNumber()
  @Min(0)
  unitAmount: number;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @IsObject()
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
    trialPeriodDays?: number;
  };

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class CreateProductPayload extends BaseMessagePayload {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitLabel?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePricePayload)
  prices?: CreatePricePayload[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class UpdateProductPayload extends BaseMessagePayload {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class ArchiveProductPayload extends BaseMessagePayload {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class FindProductByIdPayload extends BaseMessagePayload {
  @IsUUID()
  productId: string;
}

export class FindProductByStripeIdPayload extends BaseMessagePayload {
  @IsString()
  stripeProductId: string;
}

export class ListProductsPayload extends BaseMessagePayload {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AddPriceToProductPayload extends BaseMessagePayload {
  @IsUUID()
  productId: string;

  @ValidateNested()
  @Type(() => CreatePricePayload)
  price: CreatePricePayload;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class DeactivatePricePayload extends BaseMessagePayload {
  @IsUUID()
  productId: string;

  @IsString()
  stripePriceId: string;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class SyncProductsPayload extends BaseMessagePayload {
  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

// ==================== Payment Method Payloads ====================

export class AttachPaymentMethodPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsUUID()
  customerId: string;

  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class DetachPaymentMethodPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsString()
  paymentMethodId: string;
}

export class SetDefaultPaymentMethodPayload extends BaseMessagePayload {
  @IsString()
  userId: string;

  @IsString()
  paymentMethodId: string;
}

export class FindPaymentMethodByIdPayload extends BaseMessagePayload {
  @IsUUID()
  paymentMethodId: string;
}

export class ListPaymentMethodsByUserIdPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

export class GetDefaultPaymentMethodPayload extends BaseMessagePayload {
  @IsString()
  userId: string;
}

export class SyncPaymentMethodsPayload extends BaseMessagePayload {
  @IsUUID()
  customerId: string;
}

// ==================== Webhook Payloads ====================

export class ProcessWebhookPayload extends BaseMessagePayload {
  @IsString()
  signature: string;

  @IsString()
  rawBody: string;

  @IsOptional()
  @IsEnum(StripeEnvironment)
  environment?: StripeEnvironment;
}

export class RetryFailedWebhooksPayload extends BaseMessagePayload {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxAttempts?: number;
}

export class CleanupWebhooksPayload extends BaseMessagePayload {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  olderThanDays?: number;
}

// ==================== Event Payloads (Emitted Events) ====================

export class PaymentEventPayload {
  paymentId: string;
  stripePaymentIntentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, string>;
  timestamp: number;
}

export class SubscriptionEventPayload {
  subscriptionId: string;
  stripeSubscriptionId: string;
  userId: string;
  customerId: string;
  status: string;
  priceId: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, string>;
  timestamp: number;
}

export class CustomerEventPayload {
  customerId: string;
  stripeCustomerId: string;
  userId: string;
  email: string;
  environment: StripeEnvironment;
  timestamp: number;
}

export class RefundEventPayload {
  refundId: string;
  stripeRefundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  timestamp: number;
}

export class DisputeEventPayload {
  disputeId: string;
  chargeId: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  timestamp: number;
}
