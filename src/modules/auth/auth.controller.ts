import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { CustomerSignupDto } from './dto/customer-signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EmailVerificationResponseDto } from './dto/email-verification-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('customer-admin-signup')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Customer signup with invitation code' })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer successfully registered',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid invitation code or validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async customerSignUp(@Body() customerSignupDto: CustomerSignupDto) {
    return this.authService.customerSignUp(customerSignupDto);
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    type: AuthResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInDto: SignInDto, @Request() req) {
    return this.authService.signIn(req.user);
  }


  @Get('profile')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved',
    type: UserResponseDto
  })
  async getProfile(@CurrentUser() user: User) {
    return { user };
  }

  @Public()
  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully', type: EmailVerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Param('token') token: string): Promise<EmailVerificationResponseDto> {
    const user = await this.authService.verifyEmail(token);
    return { 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        title: user.title,
        phone: user.phone,
        company: user.company,
        source: user.source,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: user.emailVerificationToken,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        fullName: `${user.firstName} ${user.lastName}`,
      }
    };
  }

  @Public()
  @Post('clear-verification-token/:token')
  @ApiOperation({ summary: 'Clear verification token after successful verification' })
  @ApiResponse({ status: 200, description: 'Verification token cleared successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async clearVerificationToken(@Param('token') token: string) {
    await this.authService.clearVerificationToken(token);
    return { message: 'Verification token cleared successfully' };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.requestPasswordReset(email);
    return { message: 'Password reset email sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    await this.authService.resetPassword(token, password);
    return { message: 'Password reset successfully' };
  }
}
