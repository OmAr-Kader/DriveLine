import Stripe from 'stripe';
import { PaymentIntentType, PaymentStatus, RefundReason, StripeEnvironment, SubscriptionStatus } from '../enums/stripe.enums';

// ==================== Customer Interfaces ====================

export interface ICreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: IAddressParams;
}

export interface IAddressParams {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ICustomerResponse {
  id: string;
  stripeCustomerId: string;
  email: string;
  name: string | null;
  environment: StripeEnvironment;
  createdAt: Date;
}

// ==================== Payment Intent Interfaces ====================

export interface ICreatePaymentIntentParams {
  userId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  type: PaymentIntentType;
  statementDescriptor?: string;
  receiptEmail?: string;
}

export interface IUpdatePaymentIntentParams {
  paymentIntentId: string;
  amount?: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  statementDescriptor?: string;
  receiptEmail?: string;
}

export interface IPaymentIntentResponse {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret: string | null;
  capturedAt: Date | null;
  createdAt: Date;
}

// ==================== Subscription Interfaces ====================

export interface ICreateSubscriptionParams {
  userId: string;
  customerId: string;
  priceId: string;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
  couponId?: string;
  billingCycleAnchor?: number;
}

export interface IUpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
  trialEnd?: number | 'now';
  couponId?: string;
}

export interface ISubscriptionResponse {
  id: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

// ==================== Product Interfaces ====================

export interface ICreateProductParams {
  name: string;
  description?: string;
  active?: boolean;
  metadata?: Record<string, string>;
  images?: string[];
  unitLabel?: string;
  prices?: ICreatePriceParams[];
}

export interface ICreatePriceParams {
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount?: number;
    trialPeriodDays?: number;
  };
  metadata?: Record<string, string>;
  nickname?: string;
}

export interface IProductResponse {
  id: string;
  stripeProductId: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
}

// ==================== Payment Method Interfaces ====================

export interface IAttachPaymentMethodParams {
  userId: string;
  customerId: string;
  paymentMethodId: string;
  setAsDefault?: boolean;
}

export interface IDetachPaymentMethodParams {
  userId: string;
  paymentMethodId: string;
}

export interface IPaymentMethodResponse {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

// ==================== Refund Interfaces ====================

export interface ICreateRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: RefundReason;
  metadata?: Record<string, string>;
}

export interface IRefundResponse {
  id: string;
  stripeRefundId: string;
  amount: number;
  status: string;
  reason: string | null;
  createdAt: Date;
}

// ==================== Webhook Interfaces ====================

export interface IWebhookEvent {
  id: string;
  type: string;
  data: Stripe.Event.Data;
  created: number;
  livemode: boolean;
}

export interface IWebhookHandlerResult {
  success: boolean;
  eventId: string;
  eventType: string;
  message?: string;
  error?: string;
}

// ==================== Pagination Interfaces ====================

export interface IPaginationParams {
  page?: number;
  limit?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Service Response Wrapper ====================

export interface IServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ==================== Extended Response Interfaces ====================

export interface IPaymentIntentDetailedResponse extends IPaymentIntentResponse {
  amountCaptured: number;
  amountRefunded: number;
  description: string | null;
  receiptEmail: string | null;
  receiptUrl: string | null;
  paymentMethodId: string | null;
  intentType: PaymentIntentType;
  canceledAt: Date | null;
  cancellationReason: string | null;
  metadata: Record<string, string> | null;
}

export interface ISubscriptionDetailedResponse extends ISubscriptionResponse {
  stripePriceId: string;
  stripeProductId: string | null;
  quantity: number | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  canceledAt: Date | null;
  endedAt: Date | null;
  metadata: Record<string, string> | null;
}

export interface ICustomerDetailedResponse extends ICustomerResponse {
  phone: string | null;
  address: IAddressParams | null;
  isActive: boolean;
  defaultPaymentMethodId: string | null;
  metadata: Record<string, string> | null;
}
