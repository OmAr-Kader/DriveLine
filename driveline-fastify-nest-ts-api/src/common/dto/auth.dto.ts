import { IsString, MinLength, MaxLength, Matches, IsEmail, ValidateNested, IsNotEmpty, IsDefined, IsOptional, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { User } from '../schema/user.schema';

export class RegisterUser {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value as string | undefined)?.toLowerCase().trim())
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  // simple phone validation (digits, spaces, +, - and parentheses)
  // adjust regex to your project's phone format if needed
  // @Matches(/^\+?[0-9\s\-()]{7,32}$/)
  phone: string;

  @IsString()
  @MaxLength(64)
  role: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  password: string;
}

export class RegisterResponseUser {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class RegisterResponse {
  @IsString()
  @IsNotEmpty()
  message: string;
  //token?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterResponseUser)
  user?: RegisterResponseUser;
}

export class LoginUser {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value as string | undefined)?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  password: string;
}

export class LoginResponse {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => User)
  user: Partial<User>;
}

export class ShakeHandRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  publicKey: string;

  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}

export class ShakeHandResponse {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  serverPublicKey: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
