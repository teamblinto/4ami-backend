import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendInvitationDto } from './dto/send-invitation.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Send email' })
  @ApiResponse({ status: 201, description: 'Email queued for sending' })
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.emailService.sendEmail(sendEmailDto);
  }

  @Post('invitation')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER_ADMIN)
  @ApiOperation({ summary: 'Send user invitation email' })
  @ApiResponse({ status: 201, description: 'Invitation email queued for sending' })
  sendInvitation(@Body() sendInvitationDto: SendInvitationDto) {
    return this.emailService.sendInvitation(sendInvitationDto);
  }
}
