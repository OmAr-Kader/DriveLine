/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeEnvironment } from '../enums/stripe.enums';
import { IServiceResponse } from '../interfaces/stripe.interfaces';
import { StripeConfig } from './stripe.config';
import { LoggerKit } from 'src/common/utils/LogKit';

@Injectable()
export class StripeBaseConfigService {
  protected readonly logger = LoggerKit.create(this.constructor.name);
  private stripeTestInstance: any | null = null;
  private stripeProductionInstance: any | null = null;
  protected readonly defaultCurrency: string;
  protected readonly isProduction: boolean;
  protected readonly config: StripeConfig;

  constructor(protected readonly configService: ConfigService) {
    this.config = {
      secretKeyTest: this.configService.get<string>('stripe.secretKeyTest') ?? '',
      secretKeyProduction: this.configService.get<string>('stripe.secretKeyProduction') ?? '',
      webhookSecretTest: this.configService.get<string>('stripe.webhookSecretTest') ?? '',
      webhookSecretProduction: this.configService.get<string>('stripe.webhookSecretProduction') ?? '',
      apiVersion: this.configService.get<string>('stripe.apiVersion') ?? '2024-12-18.acacia',
      currency: this.configService.get<string>('stripe.currency') ?? 'usd',
      isProduction: this.configService.get<boolean>('stripe.isProduction') ?? false,
      maxNetworkRetries: this.configService.get<number>('stripe.maxNetworkRetries') ?? 3,
      timeout: this.configService.get<number>('stripe.timeout') ?? 30000,
    };

    this.defaultCurrency = this.config.currency;
    this.isProduction = this.config.isProduction;
  }

  /**
   * Lazy initialization of Stripe test instance
   */
  private get stripeTest(): Stripe {
    if (!this.stripeTestInstance) {
      if (!this.config.secretKeyTest) {
        throw new BadRequestException('Stripe test secret key is not configured');
      }
      this.stripeTestInstance = new Stripe(this.config.secretKeyTest, {
        apiVersion: this.config.apiVersion as Stripe.LatestApiVersion,
        typescript: true,
        maxNetworkRetries: this.config.maxNetworkRetries,
        timeout: this.config.timeout,
      });
    }
    return this.stripeTestInstance as Stripe;
  }

  /**
   * Lazy initialization of Stripe production instance
   */
  private get stripeProduction(): Stripe {
    if (!this.stripeProductionInstance) {
      if (!this.config.secretKeyProduction) {
        throw new BadRequestException('Stripe production secret key is not configured');
      }
      this.stripeProductionInstance = new Stripe(this.config.secretKeyProduction, {
        apiVersion: this.config.apiVersion as Stripe.LatestApiVersion,
        typescript: true,
        maxNetworkRetries: this.config.maxNetworkRetries,
        timeout: this.config.timeout,
      });
    }
    return this.stripeProductionInstance as Stripe;
  }

  /**
   * Get Stripe instance based on environment
   */
  protected getStripeInstance(environment?: StripeEnvironment): Stripe {
    const env = environment ?? this.getCurrentEnvironment();
    return env === StripeEnvironment.PRODUCTION ? this.stripeProduction : this.stripeTest;
  }

  /**
   * Get current environment based on configuration
   */
  protected getCurrentEnvironment(): StripeEnvironment {
    return this.isProduction ? StripeEnvironment.PRODUCTION : StripeEnvironment.TEST;
  }

  /**
   * Get webhook secret based on environment
   */
  protected getWebhookSecret(environment?: StripeEnvironment): string {
    const env = environment ?? this.getCurrentEnvironment();
    const secret = env === StripeEnvironment.PRODUCTION ? this.config.webhookSecretProduction : this.config.webhookSecretTest;

    if (!secret) {
      throw new BadRequestException(`Webhook secret not configured for ${env} environment`);
    }

    return secret;
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): IServiceResponse<T> {
    return { success: true, data };
  }

  /**
   * Create failure response
   */
  protected failure<T>(code: string, message: string, details?: Record<string, unknown>): IServiceResponse<T> {
    this.logger?.error(`Stripe operation failed: ${code} - ${message}`, details);
    return {
      success: false,
      error: { code, message, details },
    };
  }

  /**
   * Handle Stripe errors with proper categorization
   */
  protected handleStripeError<T>(error: unknown): IServiceResponse<T> {
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      const stripeError = error as Stripe.errors.StripeError;

      this.logger?.error(`Stripe Error [${stripeError.type}]: ${stripeError.message}`, {
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
      });

      // Map Stripe error types to user-friendly messages
      let userMessage = stripeError.message;
      let errorCode = stripeError.code ?? 'stripe_error';

      switch (stripeError.type) {
        case 'StripeCardError': {
          const cardError = stripeError as Stripe.errors.StripeCardError;
          errorCode = cardError.decline_code ?? cardError.code ?? 'card_error';
          userMessage = this.getCardErrorMessage(cardError);
          break;
        }
        case 'StripeRateLimitError':
          errorCode = 'rate_limit';
          userMessage = 'Too many requests.  Please try again later.';
          break;
        case 'StripeInvalidRequestError':
          errorCode = 'invalid_request';
          break;
        case 'StripeAPIError':
          errorCode = 'api_error';
          userMessage = 'Payment service temporarily unavailable. Please try again. ';
          break;
        case 'StripeConnectionError':
          errorCode = 'connection_error';
          userMessage = 'Unable to connect to payment service. Please try again.';
          break;
        case 'StripeAuthenticationError':
          errorCode = 'authentication_error';
          userMessage = 'Payment service configuration error. ';
          break;
        case 'StripePermissionError':
          errorCode = 'permission_error';
          userMessage = 'This operation is not permitted. ';
          break;
        case 'StripeIdempotencyError':
          errorCode = 'idempotency_error';
          userMessage = 'Duplicate request detected.';
          break;
        case 'StripeSignatureVerificationError':
          errorCode = 'signature_error';
          userMessage = 'Invalid webhook signature.';
          break;
      }

      return this.failure<T>(errorCode, userMessage, {
        type: stripeError.type,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
        declineCode: (stripeError as Stripe.errors.StripeCardError).decline_code,
      });
    }

    // Handle standard errors
    if (error instanceof Error) {
      this.logger?.error(`Unexpected Error: ${error.message}`, error.stack);
      return this.failure<T>('internal_error', 'An unexpected error occurred.  Please try again.');
    }

    // Handle unknown errors
    this.logger?.error('Unknown error occurred', error);
    return this.failure<T>('unknown_error', 'An unexpected error occurred.');
  }

  /**
   * Get user-friendly card error message
   */
  private getCardErrorMessage(error: Stripe.errors.StripeCardError): string {
    const declineMessages: Record<string, string> = {
      authentication_required: 'This card requires authentication.  Please try again.',
      approve_with_id: 'Payment cannot be authorized.  Please try again or use a different card.',
      call_issuer: 'Your card was declined. Please contact your card issuer.',
      card_not_supported: 'This card does not support this type of purchase.',
      card_velocity_exceeded: "You have exceeded your card's limit. Please use a different card.",
      currency_not_supported: 'This card does not support the specified currency.',
      do_not_honor: 'Your card was declined. Please use a different card.',
      do_not_try_again: 'Your card was declined. Please use a different card.',
      duplicate_transaction: 'A duplicate transaction was detected.',
      expired_card: 'Your card has expired.  Please use a different card.',
      fraudulent: 'This transaction has been flagged as potentially fraudulent.',
      generic_decline: 'Your card was declined. Please use a different card.',
      incorrect_cvc: 'The CVC number is incorrect.  Please check and try again.',
      incorrect_number: 'The card number is incorrect. Please check and try again.',
      incorrect_pin: 'The PIN is incorrect. Please try again.',
      incorrect_zip: 'The postal code is incorrect. Please check and try again.',
      insufficient_funds: 'Your card has insufficient funds.',
      invalid_account: 'The card account is invalid.',
      invalid_amount: 'The payment amount is invalid.',
      invalid_cvc: 'The CVC number is invalid.',
      invalid_expiry_month: 'The expiration month is invalid.',
      invalid_expiry_year: 'The expiration year is invalid.',
      invalid_number: 'The card number is invalid.',
      invalid_pin: 'The PIN is invalid.',
      issuer_not_available: 'The card issuer is not available.  Please try again.',
      lost_card: 'This card has been reported lost.',
      merchant_blacklist: 'This card cannot be used for this purchase.',
      new_account_information_available: 'Please update your card information.',
      no_action_taken: 'Your card was declined. Please use a different card.',
      not_permitted: 'This transaction is not permitted.',
      offline_pin_required: 'This card requires a PIN.',
      online_or_offline_pin_required: 'This card requires a PIN.',
      pickup_card: 'This card cannot be used.',
      pin_try_exceeded: 'Too many PIN attempts. Please use a different card.',
      processing_error: 'An error occurred while processing.  Please try again.',
      reenter_transaction: 'Please try the transaction again.',
      restricted_card: 'This card is restricted.',
      revocation_of_all_authorizations: 'This card has been revoked.',
      revocation_of_authorization: 'This transaction was revoked.',
      security_violation: 'This card has a security issue.',
      service_not_allowed: 'This service is not allowed for this card.',
      stolen_card: 'This card has been reported stolen.',
      stop_payment_order: 'A stop payment order has been placed.',
      testmode_decline: 'Test card declined.',
      transaction_not_allowed: 'This transaction is not allowed.',
      try_again_later: 'Please try again later.',
      withdrawal_count_limit_exceeded: 'Withdrawal limit exceeded.',
    };

    return declineMessages[error.decline_code ?? ''] ?? error.message;
  }

  /**
   * Sanitize metadata for Stripe (key max 40 chars, value max 500 chars)
   */
  protected sanitizeMetadata(metadata?: Record<string, string>): Record<string, string> | undefined {
    if (!metadata || Object.keys(metadata).length === 0) {
      return undefined;
    }

    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined) continue;

      // Sanitize key:  max 40 chars, alphanumeric, underscores, hyphens
      const sanitizedKey = key.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_');

      // Sanitize value: max 500 chars, convert to string
      const sanitizedValue = String(value).slice(0, 500);

      sanitized[sanitizedKey] = sanitizedValue;
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Validate UUID format
   */

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
