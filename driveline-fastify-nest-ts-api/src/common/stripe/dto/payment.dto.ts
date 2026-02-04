import { IsString, IsNumber, IsOptional, IsEnum, IsObject, IsEmail, Min, Max, MaxLength } from 'class-validator';
import { PaymentIntentType, RefundReason } from '../enums/stripe.enums';

export class CreatePaymentIntentDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(50) // Stripe minimum is 50 cents
  @Max(99999999) // Reasonable maximum
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(PaymentIntentType)
  type: PaymentIntentType;

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

export class UpdatePaymentIntentDto {
  @IsString()
  @MaxLength(255)
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

export class CapturePaymentDto {
  @IsString()
  @MaxLength(255)
  paymentIntentId: string;

  @IsOptional()
  @IsNumber()
  @Min(50)
  amountToCapture?: number;
}

export class CancelPaymentDto {
  @IsString()
  @MaxLength(255)
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

export class CreateRefundDto {
  @IsString()
  @MaxLength(255)
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
