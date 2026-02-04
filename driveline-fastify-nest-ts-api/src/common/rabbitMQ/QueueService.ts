import { Injectable, OnModuleInit, OnModuleDestroy, Inject, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ConsoleKit, LoggerKit } from 'src/common/utils/LogKit';
import {
  CapturePaymentPayload,
  ConfirmPaymentPayload,
  CreateCustomerPayload,
  CreatePaymentPayload,
  FindCustomerByUserIdPayload,
} from '../stripe/dto/message-payloads.dto';
import { StripeEnvironment } from '../stripe/enums/stripe.enums';
import { STRIPE_QUEUE_NAMES } from '../stripe/utils/constants_queue';
import Stripe from 'stripe';
import { ICustomerResponse, IPaymentIntentResponse, IServiceResponse } from '../stripe/interfaces/stripe.interfaces';
import { ANALYTICS_QUEUE_NAMES } from 'src/common/rabbitMQ/analytics_queue.constants';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = LoggerKit.create(QueueService.name);

  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit() {
    await this.client.connect();
    this.logger?.log('✅ Connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async sendStripeCreateCustomerJob(payload: CreateCustomerPayload, currentUserId: string): Promise<IServiceResponse<ICustomerResponse>> {
    try {
      this.logger?.log(`📤 Sending Stripe create customer job for user: ${payload.userId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom<IServiceResponse<ICustomerResponse>>(
        this.client.send<IServiceResponse<ICustomerResponse>>(STRIPE_QUEUE_NAMES.CUSTOMER.CREATE_TEST, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_customer_created', 'stripe', result.data?.stripeCustomerId || 'unknown', {
        postgresUserId: result.data?.id ?? 'unknown',
        environment: result.data?.environment ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  async getStripeCustomerJob(payload: FindCustomerByUserIdPayload, currentUserId: string): Promise<IServiceResponse<ICustomerResponse>> {
    try {
      if (!payload.userId) {
        throw new InternalServerErrorException('userId is required to fetch Stripe customer');
      }
      this.logger?.log(`📤 Sending Stripe get customer job for user: ${payload.userId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<ICustomerResponse>>(STRIPE_QUEUE_NAMES.CUSTOMER.FIND_BY_USER_ID, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_customer_fetched', 'stripe', result.data?.stripeCustomerId || 'unknown', {
        postgresUserId: result.data?.id ?? 'unknown',
        environment: result.data?.environment ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  async sendCreateImmediateStripePaymentJob(payload: CreatePaymentPayload, currentUserId: string): Promise<IServiceResponse<IPaymentIntentResponse>> {
    try {
      this.logger?.log(`📤 Sending Stripe create immediate payment job for user: ${payload.userId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<IPaymentIntentResponse>>(STRIPE_QUEUE_NAMES.PAYMENT.CREATE_IMMEDIATE, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_payment_created', 'stripe', payload.paymentMethodId || 'unknown', {
        id: result.data?.id ?? 'unknown',
        clientSecret: result.data?.clientSecret ?? 'unknown',
        status: result.data?.status ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  async sendCreateHoldStripePaymentJob(payload: CreatePaymentPayload, currentUserId: string): Promise<IServiceResponse<IPaymentIntentResponse>> {
    try {
      this.logger?.log(`📤 Sending Stripe create customer job for user: ${payload.userId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<IPaymentIntentResponse>>(STRIPE_QUEUE_NAMES.PAYMENT.CREATE_HOLD, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_payment_created_on_hold', 'stripe', payload.paymentMethodId || 'unknown', {
        id: result.data?.id ?? 'unknown',
        clientSecret: result.data?.clientSecret ?? 'unknown',
        status: result.data?.status ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  async confirmStripePaymentJob(payload: ConfirmPaymentPayload, currentUserId: string): Promise<IServiceResponse<IPaymentIntentResponse>> {
    try {
      this.logger?.log(`📤 Sending Stripe create customer job for user: ${payload.paymentIntentId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<IPaymentIntentResponse>>(STRIPE_QUEUE_NAMES.PAYMENT.CONFIRM, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_payment_confirmed', 'stripe', payload.paymentIntentId || 'unknown', {
        id: result.data?.id ?? 'unknown',
        clientSecret: result.data?.clientSecret ?? 'unknown',
        status: result.data?.status ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  async captureStripePaymentJob(payload: CapturePaymentPayload, currentUserId: string): Promise<IServiceResponse<IPaymentIntentResponse>> {
    try {
      this.logger?.log(`📤 Sending Stripe create customer job for user: ${payload.paymentIntentId}`);

      // Use send() for request-response pattern
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<IPaymentIntentResponse>>(STRIPE_QUEUE_NAMES.PAYMENT.CAPTURE, payload).pipe(timeout(30000)),
      );

      this.logger?.log(`📥 Received Stripe response for user: `, result);
      this.trackActivity(currentUserId, 'stripe_payment_captured', 'stripe', payload.paymentIntentId || 'unknown', {
        id: result.data?.id ?? 'unknown',
        clientSecret: result.data?.clientSecret ?? 'unknown',
        status: result.data?.status ?? 'unknown',
      });
      return result;
    } catch (error) {
      this.logger?.error('Failed to process Stripe job', error);
      throw new InternalServerErrorException(`Stripe processing failed: ${(error as Error).message}`);
    }
  }

  // ==================== Webhook Jobs ====================
  /**
   * Fire-and-forget: send webhook event to worker for DB processing
   */
  async sendWebhookProcessJob(event: Stripe.Event, environment: StripeEnvironment): Promise<void> {
    try {
      this.logger?.log(`📤 Emitting webhook event ${event.id} to worker`);
      // Use emit for async fire-and-forget
      this.client.emit(STRIPE_QUEUE_NAMES.WEBHOOK.PROCESS, { event, environment });
      // ensure the method remains async for callers who await it
      await Promise.resolve();
    } catch (error) {
      this.logger?.error('Failed to emit webhook job', error);
      throw new InternalServerErrorException(`Webhook enqueue failed: ${(error as Error).message}`);
    }
  }

  async retryFailedWebhooks(maxAttempts = 3): Promise<IServiceResponse<number>> {
    try {
      this.logger?.log(`📤 Sending webhook retry job with maxAttempts=${maxAttempts}`);
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<number>>(STRIPE_QUEUE_NAMES.WEBHOOK.RETRY_FAILED, { maxAttempts }).pipe(timeout(30000)),
      );
      this.logger?.log('📥 Received webhook retry response', result);
      return result;
    } catch (error) {
      this.logger?.error('Failed to send webhook retry job', error);
      throw new InternalServerErrorException(`Webhook retry failed: ${(error as Error).message}`);
    }
  }

  async getWebhookStats(): Promise<IServiceResponse<any>> {
    try {
      this.logger?.log('📤 Requesting webhook stats');
      const result = await firstValueFrom(this.client.send<IServiceResponse<any>>(STRIPE_QUEUE_NAMES.WEBHOOK.GET_STATS, {}).pipe(timeout(30000)));
      this.logger?.log('📥 Received webhook stats', result);
      return result;
    } catch (error) {
      this.logger?.error('Failed to request webhook stats', error);
      throw new InternalServerErrorException(`Webhook stats request failed: ${(error as Error).message}`);
    }
  }

  async cleanupWebhooks(olderThanDays: number): Promise<IServiceResponse<number>> {
    try {
      this.logger?.log(`📤 Sending webhook cleanup job olderThanDays=${olderThanDays}`);
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<number>>(STRIPE_QUEUE_NAMES.WEBHOOK.CLEANUP, { olderThanDays }).pipe(timeout(30000)),
      );
      this.logger?.log('📥 Received webhook cleanup response', result);
      return result;
    } catch (error) {
      this.logger?.error('Failed to send webhook cleanup job', error);
      throw new InternalServerErrorException(`Webhook cleanup failed: ${(error as Error).message}`);
    }
  }

  async getRecentWebhookEvents(payload: { status?: string; eventType?: string; page?: number; limit?: number }) {
    try {
      this.logger?.log('📤 Requesting recent webhook events', payload);
      const result = await firstValueFrom(
        this.client.send<IServiceResponse<any>>(STRIPE_QUEUE_NAMES.WEBHOOK.GET_EVENTS, payload).pipe(timeout(30000)),
      );
      return result;
    } catch (error) {
      this.logger?.error('Failed to request recent webhook events', error);
      throw new InternalServerErrorException(`Webhook events request failed: ${(error as Error).message}`);
    }
  }

  // ========================================
  // Analytics & Tracking Helper Methods
  // ========================================

  get generateEventTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
  }

  trackActivity(userId: string, activityType: string, resourceType: string, resourceId: string, metadata?: object): void {
    try {
      const payload = {
        user_id: userId,
        event_time: this.generateEventTimestamp,
        activity_type: activityType,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: JSON.stringify(metadata ?? {}),
      };

      // Fire-and-forget via RabbitMQ so analytics insertion can be isolated
      this.client.emit(ANALYTICS_QUEUE_NAMES.TRACK_USER_ACTIVITY, payload);
    } catch (error) {
      ConsoleKit.logKit('Error tracking user activity (emit):', error);
    }
  }

  // Expose helper emitters for direct use
  public trackHttpRequest(payload: { [k: string]: any }): void {
    try {
      this.client.emit(ANALYTICS_QUEUE_NAMES.TRACK_HTTP_REQUEST, payload);
    } catch (error) {
      ConsoleKit.logKit('Error emitting trackHttpRequest:', error);
    }
  }

  public logError(payload: { [k: string]: any }): void {
    try {
      this.client.emit(ANALYTICS_QUEUE_NAMES.LOG_ERROR, payload);
    } catch (error) {
      ConsoleKit.logKit('Error emitting logError:', error);
    }
  }
}
