import { registerAs } from '@nestjs/config';

export interface StripeConfig {
  secretKeyTest: string;
  secretKeyProduction: string;
  webhookSecretTest: string;
  webhookSecretProduction: string;
  apiVersion: string;
  currency: string;
  isProduction: boolean;
  maxNetworkRetries: number;
  timeout: number;
}

export default registerAs('stripe', (): StripeConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    secretKeyTest: process.env.STRIPE_SECRET_KEY_TEST ?? '',
    secretKeyProduction: process.env.STRIPE_SECRET_KEY_PRODUCTION ?? '',
    webhookSecretTest: process.env.STRIPE_WEBHOOK_SECRET_TEST ?? '',
    webhookSecretProduction: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION ?? '',
    apiVersion: '2024-12-18.acacia',
    currency: process.env.STRIPE_DEFAULT_CURRENCY ?? 'usd',
    isProduction,
    maxNetworkRetries: parseInt(process.env.STRIPE_MAX_RETRIES ?? '3', 10),
    timeout: parseInt(process.env.STRIPE_TIMEOUT ?? '30000', 10),
  };
});
