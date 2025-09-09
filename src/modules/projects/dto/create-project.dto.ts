import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Asset Management Project' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'A comprehensive asset management project', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: { priority: 'high', category: 'infrastructure' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
