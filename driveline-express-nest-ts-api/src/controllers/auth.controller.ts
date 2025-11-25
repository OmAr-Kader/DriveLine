import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UserDocument } from '../schema/user.schema';
import { AuthService } from 'src/services/auth.service';
import { RegisterUserDto } from 'src/dto/register.user.dto';
import { ApiKeyGuard } from 'src/utils/verification';
import { LoginUserDto } from 'src/dto/login.user.dto';

@Controller('auth')
@UseGuards(ApiKeyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() body: RegisterUserDto): Promise<{ message: string; user: Partial<UserDocument> }> {
    try {
      return await this.authService.registerUser(body);
    } catch (err) {
      throw new HttpException({ message: (err as Error).message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async loginUser(@Body() body: LoginUserDto): Promise<{ message: string; token: string; user: Partial<UserDocument> }> {
    try {
      return await this.authService.loginUser(body);
    } catch (err) {
      throw new HttpException({ message: (err as Error).message }, HttpStatus.BAD_REQUEST);
    }
  }
}
