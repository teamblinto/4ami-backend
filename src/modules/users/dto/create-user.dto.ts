import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    enum: UserRole, 
    enumName: 'UserRole',
    example: UserRole.CUSTOMER_USER,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'role must be one of the following values: ADMIN, CUSTOMER_ADMIN, CUSTOMER_USER'
  })
  role?: UserRole;
}
