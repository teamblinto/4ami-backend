import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.CUSTOMER_USER,
      emailVerificationToken: uuidv4(),
    });

    const savedUser = await this.userRepository.save(user);
    
    // Send email verification
    try {
      await this.emailService.sendEmailVerification(
        savedUser.email,
        savedUser.emailVerificationToken,
      );
    } catch (error) {
      console.error('Failed to send email verification:', error);
      // Don't fail the signup if email fails
    }

    const token = this.generateToken(savedUser);

    return { user: savedUser, token };
  }

  async signIn(user: User): Promise<AuthResponseDto> {
    console.log('🚀 SignIn called for user:', user.email);

    if (!user.isActive) {
      console.log('❌ Account is deactivated');
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user);
    console.log('✅ SignIn successful, returning user and token');
    return { user, token };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    console.log('🔍 Validating user:', email);

    console.log('🔍 Password:', password);
    
    // Use raw query to completely bypass any decorator interference
    const result = await this.userRepository.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    console.log('📊 Query result length:', result.length);

    if (result.length === 0) {
      console.log('❌ No user found');
      return null;
    }

    const userData = result[0];
    console.log('👤 User found:', userData.email, 'Password hash exists:', !!userData.password);
    
    // Validate password using bcrypt directly
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, userData.password);
    
    console.log('🔐 Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return null;
    }

    // Create User object manually to avoid any decorator issues
    const user = new User();
    user.id = userData.id;
    user.email = userData.email;
    user.firstName = userData.firstName;
    user.lastName = userData.lastName;
    user.phone = userData.phone;
    user.role = userData.role;
    user.isActive = userData.isActive;
    user.isEmailVerified = userData.isEmailVerified;
    user.emailVerificationToken = userData.emailVerificationToken;
    user.passwordResetToken = userData.passwordResetToken;
    user.passwordResetExpires = userData.passwordResetExpires;
    user.lastLoginAt = userData.lastLoginAt;
    user.createdAt = userData.createdAt;
    user.updatedAt = userData.updatedAt;

    console.log('✅ User validation successful');
    return user;
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    user.passwordResetToken = uuidv4();
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepository.save(user);

    // Send password reset email
    try {
      await this.emailService.sendPasswordReset(email, user.passwordResetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail the request if email fails
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
