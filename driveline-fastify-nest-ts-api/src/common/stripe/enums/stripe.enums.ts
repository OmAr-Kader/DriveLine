export enum PaymentStatus {
  PENDING = 'pending',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  REQUIRES_CAPTURE = 'requires_capture',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

export enum PaymentIntentType {
  IMMEDIATE = 'immediate',
  HOLD = 'hold',
  FUTURE_USAGE = 'future_usage',
}

export enum WebhookEventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  //EXPIRED_UNCAPTURED_CHARGE = 'expired_uncaptured_charge',
}

export enum StripeEnvironment {
  TEST = 'test',
  PRODUCTION = 'production',
}
