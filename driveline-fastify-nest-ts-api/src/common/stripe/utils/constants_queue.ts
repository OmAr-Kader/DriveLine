/**
 * Stripe Microservice Queue Names
 * Organized by domain for better maintainability
 */
export const STRIPE_QUEUE_NAMES = {
  // ==================== Customer Operations ====================
  CUSTOMER: {
    CREATE_TEST: 'stripe.customer.create.test',
    CREATE_PRODUCTION: 'stripe.customer.create.production',
    GET_OR_CREATE: 'stripe.customer.get_or_create',
    FIND_BY_ID: 'stripe.customer.find_by_id',
    FIND_BY_USER_ID: 'stripe.customer.find_by_user_id',
    FIND_BY_STRIPE_ID: 'stripe.customer.find_by_stripe_id',
    UPDATE: 'stripe.customer.update',
    DELETE: 'stripe.customer.delete',
    SYNC: 'stripe.customer.sync',
    LIST: 'stripe.customer.list',
  },

  // ==================== Payment Operations ====================
  PAYMENT: {
    CREATE_IMMEDIATE: 'stripe.payment.create.immediate',
    CREATE_HOLD: 'stripe.payment.create.hold',
    CREATE_FUTURE_USAGE: 'stripe.payment.create.future_usage',
    UPDATE: 'stripe.payment.update',
    CONFIRM: 'stripe.payment.confirm',
    CAPTURE: 'stripe.payment.capture',
    CANCEL: 'stripe.payment.cancel',
    FIND_BY_ID: 'stripe.payment.find_by_id',
    FIND_BY_STRIPE_ID: 'stripe.payment.find_by_stripe_id',
    LIST_BY_USER_ID: 'stripe.payment.list_by_user_id',
    LIST_BY_STATUS: 'stripe.payment.list_by_status',
    GET_HELD_PAYMENTS: 'stripe.payment.get_held',
    SYNC: 'stripe.payment.sync',
    GET_STATS: 'stripe.payment.get_stats',
  },

  // ==================== Refund Operations ====================
  REFUND: {
    CREATE: 'stripe.refund.create',
    FIND_BY_PAYMENT_ID: 'stripe.refund.find_by_payment_id',
    FIND_BY_ID: 'stripe.refund.find_by_id',
  },

  // ==================== Subscription Operations ====================
  SUBSCRIPTION: {
    CREATE: 'stripe.subscription.create',
    UPDATE: 'stripe.subscription.update',
    CANCEL: 'stripe.subscription.cancel',
    RESUME: 'stripe.subscription.resume',
    PAUSE: 'stripe.subscription.pause',
    UNPAUSE: 'stripe.subscription.unpause',
    FIND_BY_ID: 'stripe.subscription.find_by_id',
    FIND_BY_STRIPE_ID: 'stripe.subscription.find_by_stripe_id',
    LIST_BY_USER_ID: 'stripe.subscription.list_by_user_id',
    GET_ACTIVE_BY_USER_ID: 'stripe.subscription.get_active_by_user_id',
    HAS_ACTIVE: 'stripe.subscription.has_active',
    SYNC: 'stripe.subscription.sync',
  },

  // ==================== Product Operations ====================
  PRODUCT: {
    CREATE: 'stripe.product.create',
    UPDATE: 'stripe.product.update',
    ARCHIVE: 'stripe.product.archive',
    FIND_BY_ID: 'stripe.product.find_by_id',
    FIND_BY_STRIPE_ID: 'stripe.product.find_by_stripe_id',
    GET_ACTIVE: 'stripe.product.get_active',
    GET_ALL: 'stripe.product.get_all',
    ADD_PRICE: 'stripe.product.add_price',
    DEACTIVATE_PRICE: 'stripe.product.deactivate_price',
    SYNC_ALL: 'stripe.product.sync_all',
  },

  // ==================== Payment Method Operations ====================
  PAYMENT_METHOD: {
    ATTACH: 'stripe.payment_method.attach',
    DETACH: 'stripe.payment_method.detach',
    SET_DEFAULT: 'stripe.payment_method.set_default',
    FIND_BY_ID: 'stripe.payment_method.find_by_id',
    LIST_BY_USER_ID: 'stripe.payment_method.list_by_user_id',
    GET_DEFAULT: 'stripe.payment_method.get_default',
    SYNC: 'stripe.payment_method.sync',
  },

  // ==================== Webhook Operations ====================
  WEBHOOK: {
    PROCESS: 'stripe.webhook.process',
    RETRY_FAILED: 'stripe.webhook.retry_failed',
    GET_STATS: 'stripe.webhook.get_stats',
    GET_EVENTS: 'stripe.webhook.get_events',
    CLEANUP: 'stripe.webhook.cleanup',
  },

  // ==================== Event Emissions (For other services to listen) ====================
  EVENTS: {
    PAYMENT_SUCCEEDED: 'stripe.event.payment.succeeded',
    PAYMENT_FAILED: 'stripe.event.payment.failed',
    PAYMENT_REFUNDED: 'stripe.event.payment.refunded',
    SUBSCRIPTION_CREATED: 'stripe.event.subscription.created',
    SUBSCRIPTION_UPDATED: 'stripe.event.subscription.updated',
    SUBSCRIPTION_CANCELED: 'stripe.event.subscription.canceled',
    SUBSCRIPTION_TRIAL_ENDING: 'stripe.event.subscription.trial_ending',
    CUSTOMER_CREATED: 'stripe.event.customer.created',
    CUSTOMER_UPDATED: 'stripe.event.customer.updated',
    CUSTOMER_DELETED: 'stripe.event.customer.deleted',
    INVOICE_PAYMENT_FAILED: 'stripe.event.invoice.payment_failed',
    DISPUTE_CREATED: 'stripe.event.dispute.created',
  },
} as const;

/**
 * RabbitMQ Exchange Names
 */
export const STRIPE_EXCHANGES = {
  COMMANDS: 'stripe.commands',
  EVENTS: 'stripe.events',
  DEAD_LETTER: 'stripe.dead_letter',
} as const;

/**
 * Type helpers for queue names
 */
export type StripeCustomerQueues = (typeof STRIPE_QUEUE_NAMES.CUSTOMER)[keyof typeof STRIPE_QUEUE_NAMES.CUSTOMER];
export type StripePaymentQueues = (typeof STRIPE_QUEUE_NAMES.PAYMENT)[keyof typeof STRIPE_QUEUE_NAMES.PAYMENT];
export type StripeRefundQueues = (typeof STRIPE_QUEUE_NAMES.REFUND)[keyof typeof STRIPE_QUEUE_NAMES.REFUND];
export type StripeSubscriptionQueues = (typeof STRIPE_QUEUE_NAMES.SUBSCRIPTION)[keyof typeof STRIPE_QUEUE_NAMES.SUBSCRIPTION];
export type StripeProductQueues = (typeof STRIPE_QUEUE_NAMES.PRODUCT)[keyof typeof STRIPE_QUEUE_NAMES.PRODUCT];
export type StripePaymentMethodQueues = (typeof STRIPE_QUEUE_NAMES.PAYMENT_METHOD)[keyof typeof STRIPE_QUEUE_NAMES.PAYMENT_METHOD];
export type StripeWebhookQueues = (typeof STRIPE_QUEUE_NAMES.WEBHOOK)[keyof typeof STRIPE_QUEUE_NAMES.WEBHOOK];
export type StripeEventQueues = (typeof STRIPE_QUEUE_NAMES.EVENTS)[keyof typeof STRIPE_QUEUE_NAMES.EVENTS];
