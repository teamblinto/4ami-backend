import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class InviteUserDto {
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

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'A7X3D' })
  @IsString()
  invitationCode: string;

  @ApiProperty({ example: 'ABC Corporation', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'How did you hear about us', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}
