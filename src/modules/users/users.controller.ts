import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserVerificationResponseDto } from './dto/user-verification-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  // @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: [UserResponseDto]
  })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('test-serialization')
  @Public()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Test user serialization (no auth required)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test user data with password excluded',
    type: UserResponseDto
  })
  async testSerialization() {
    const user = await this.usersService.findOne('116c4018-ed1c-41a0-ad8f-bc05d6448d03');
    return { user };
  }

  @Get('dashboard/stats')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  getDashboardStats() {
    return this.usersService.getDashboardStats();
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Invite a new user' })
  @ApiResponse({ status: 201, description: 'User invitation sent' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  inviteUser(@Body() inviteUserDto: InviteUserDto) {
    return this.usersService.inviteUser(inviteUserDto);
  }

  @Get('verify-token/:token')
  @Public()
  @ApiOperation({ summary: 'Get user by email verification token' })
  @ApiResponse({ status: 200, description: 'User found', type: UserVerificationResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByVerificationToken(@Param('token') token: string): Promise<UserVerificationResponseDto> {
    const user = await this.usersService.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }
    
    // Manually construct response to include emailVerificationToken
    return {
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
    };
  }

  @Get('verify-status/:email')
  @Public()
  @ApiOperation({ summary: 'Get user verification status by email' })
  @ApiResponse({ status: 200, description: 'User verification status found', type: UserVerificationResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserVerificationStatus(@Param('email') email: string): Promise<UserVerificationResponseDto> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Manually construct response to include emailVerificationToken
    return {
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
    };
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Activate user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
}
