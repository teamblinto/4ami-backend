import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { SendEmailDto } from './dto/send-email.dto';
import { SendInvitationDto } from './dto/send-invitation.dto';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email')
    private emailQueue: Queue,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto): Promise<{ jobId: string; message: string }> {
    console.log('📧 EmailService.sendEmail called with:', {
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      hasText: !!sendEmailDto.text,
      hasHtml: !!sendEmailDto.html,
    });
    
    try {
      const job = await this.emailQueue.add('send-email', sendEmailDto);
      console.log('✅ Email job queued successfully:', job.id);
      
      return {
        jobId: job.id.toString(),
        message: 'Email queued for sending',
      };
    } catch (error) {
      console.error('❌ Failed to queue email job:', error);
      throw error;
    }
  }

  async sendInvitation(sendInvitationDto: SendInvitationDto): Promise<{ jobId: string; message: string }> {
    const job = await this.emailQueue.add('send-invitation', sendInvitationDto);
    
    return {
      jobId: job.id.toString(),
      message: 'Invitation email queued for sending',
    };
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<{ jobId: string; message: string }> {
    const job = await this.emailQueue.add('send-password-reset', {
      email,
      resetToken,
    });
    
    return {
      jobId: job.id.toString(),
      message: 'Password reset email queued for sending',
    };
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<{ jobId: string; message: string }> {
    const job = await this.emailQueue.add('send-email-verification', {
      email,
      verificationToken,
    });
    
    return {
      jobId: job.id.toString(),
      message: 'Email verification queued for sending',
    };
  }
}
