import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, firstName, lastName, role, phone } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      role: role || UserRole.CUSTOMER_USER,
      phone,
      emailVerificationToken: uuidv4(),
    });

    return this.userRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async inviteUser(inviteUserDto: InviteUserDto): Promise<User> {
    const { email, firstName, lastName, role, phone, invitationCode, company, source } = inviteUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      role: role || UserRole.CUSTOMER_USER,
      phone,
      isActive: false, // User needs to complete signup
      emailVerificationToken: invitationCode, // Use the frontend-generated code
    });

    const savedUser = await this.userRepository.save(user);

    // Send invitation email with the frontend-generated code
    try {
      await this.emailService.sendInvitation({
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        invitationToken: savedUser.emailVerificationToken,
        customMessage: `Welcome to 4AMI Platform! You have been invited as a ${savedUser.role.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't fail the user creation if email fails
    }

    return savedUser;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.userRepository.save(user);
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    usersByRole: Record<UserRole, number>;
  }> {
    const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isActive: false } }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = parseInt(item.count);
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      usersByRole: roleStats,
    };
  }
}
